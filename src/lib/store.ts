import { useSyncExternalStore } from "react";
import { predictRisk, RISK_BANDS } from "./risk-model";
import { buildSeed } from "./seed";
import type { Activity, DB, Intervention, InterventionStatus, Student } from "./types";

const KEY = "eduguard-db-v1";
const SERVER_SEED: DB = buildSeed(0);

let state: DB | null = null;
const listeners = new Set<() => void>();

function load(): DB {
  if (state) return state;
  if (typeof window === "undefined") return SERVER_SEED;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed?.version === 1) {
        state = parsed;
        return state;
      }
    }
  } catch {
    /* fall through to seed */
  }
  state = buildSeed();
  persist();
  return state;
}

function persist() {
  if (typeof window !== "undefined" && state) {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  }
}

function set(next: DB) {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

function uid(prefix: string) {
  return `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

function activity(text: string, kind: Activity["kind"]): Activity {
  return { id: uid("ACT"), at: new Date().toISOString(), text, kind };
}

/** Raise a new alert, or refresh the open one, for every student now in the High band. */
function syncAlerts(db: DB, studentIds: string[]): DB {
  let alerts = db.alerts;
  const acts: Activity[] = [];
  for (const id of studentIds) {
    const s = db.students.find((x) => x.id === id);
    if (!s) continue;
    const p = predictRisk(s);
    const open = alerts.find((a) => a.studentId === id && a.status === "open");
    const reasons = p.reasons.map((r) => r.message);
    if (p.score >= RISK_BANDS.highFrom) {
      if (open) {
        alerts = alerts.map((a) => (a === open ? { ...a, score: p.score, reasons } : a));
      } else {
        alerts = [
          {
            id: uid("ALT"),
            studentId: id,
            facultyId: s.facultyId,
            score: p.score,
            reasons,
            status: "open",
            createdAt: new Date().toISOString(),
          },
          ...alerts,
        ];
        const fac = db.faculty.find((f) => f.id === s.facultyId);
        acts.push(
          activity(
            `High-risk alert raised for ${s.name} (${s.id}) — ${fac?.name ?? "faculty"} notified`,
            "alert",
          ),
        );
      }
    }
  }
  return { ...db, alerts, activities: [...acts, ...db.activities].slice(0, 60) };
}

export function getDB(): DB {
  return load();
}

export function useDB(): DB {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    load,
    () => SERVER_SEED,
  );
}

export type StudentInput = Omit<Student, "updatedAt" | "source"> & { source?: Student["source"] };

export const actions = {
  addStudent(input: StudentInput) {
    const db = load();
    if (db.students.some((s) => s.id.toLowerCase() === input.id.toLowerCase())) {
      throw new Error(`Student ID ${input.id} already exists`);
    }
    const s: Student = { ...input, source: input.source ?? "manual", updatedAt: new Date().toISOString() };
    let next: DB = {
      ...db,
      students: [...db.students, s],
      activities: [activity(`Student ${s.name} (${s.id}) added`, "student"), ...db.activities],
    };
    next = syncAlerts(next, [s.id]);
    set(next);
  },
  updateStudent(id: string, patch: Partial<StudentInput>) {
    const db = load();
    let next: DB = {
      ...db,
      students: db.students.map((s) =>
        s.id === id ? { ...s, ...patch, id, updatedAt: new Date().toISOString() } : s,
      ),
    };
    const s = next.students.find((x) => x.id === id);
    next.activities = [activity(`Academic record updated for ${s?.name} (${id})`, "student"), ...next.activities];
    next = syncAlerts(next, [id]);
    set(next);
  },
  deleteStudent(id: string) {
    const db = load();
    const s = db.students.find((x) => x.id === id);
    set({
      ...db,
      students: db.students.filter((x) => x.id !== id),
      alerts: db.alerts.filter((a) => a.studentId !== id),
      interventions: db.interventions.filter((i) => i.studentId !== id),
      activities: [activity(`Student ${s?.name ?? id} removed`, "student"), ...db.activities],
    });
  },
  importStudents(rows: StudentInput[]) {
    const db = load();
    const byId = new Map(db.students.map((s) => [s.id.toLowerCase(), s]));
    let added = 0;
    let updated = 0;
    const now = new Date().toISOString();
    for (const r of rows) {
      const existing = byId.get(r.id.toLowerCase());
      if (existing) {
        byId.set(r.id.toLowerCase(), { ...existing, ...r, id: existing.id, updatedAt: now });
        updated++;
      } else {
        byId.set(r.id.toLowerCase(), { ...r, source: "import", updatedAt: now });
        added++;
      }
    }
    let next: DB = {
      ...db,
      students: [...byId.values()],
      activities: [
        activity(`CSV import: ${added} added, ${updated} updated`, "import"),
        ...db.activities,
      ],
    };
    next = syncAlerts(next, rows.map((r) => [...byId.values()].find((s) => s.id.toLowerCase() === r.id.toLowerCase())!.id));
    set(next);
    return { added, updated };
  },
  resolveAlert(id: string, note: string) {
    const db = load();
    const a = db.alerts.find((x) => x.id === id);
    const s = db.students.find((x) => x.id === a?.studentId);
    set({
      ...db,
      alerts: db.alerts.map((x) =>
        x.id === id ? { ...x, status: "resolved", resolvedAt: new Date().toISOString(), resolutionNote: note } : x,
      ),
      activities: [activity(`Alert resolved for ${s?.name ?? "student"}`, "alert"), ...db.activities],
    });
  },
  addIntervention(input: Omit<Intervention, "id" | "createdAt" | "updatedAt" | "baselineScore">) {
    const db = load();
    const s = db.students.find((x) => x.id === input.studentId);
    if (!s) throw new Error("Student not found");
    const now = new Date().toISOString();
    set({
      ...db,
      interventions: [
        { ...input, id: uid("INT"), baselineScore: predictRisk(s).score, createdAt: now, updatedAt: now },
        ...db.interventions,
      ],
      activities: [activity(`${input.type} planned for ${s.name}`, "intervention"), ...db.activities],
    });
  },
  updateIntervention(id: string, patch: { status?: InterventionStatus; notes?: string }) {
    const db = load();
    const it = db.interventions.find((x) => x.id === id);
    const s = db.students.find((x) => x.id === it?.studentId);
    set({
      ...db,
      interventions: db.interventions.map((x) =>
        x.id === id ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x,
      ),
      activities: patch.status
        ? [activity(`${it?.type} for ${s?.name} marked ${patch.status}`, "intervention"), ...db.activities]
        : db.activities,
    });
  },
  deleteIntervention(id: string) {
    const db = load();
    set({ ...db, interventions: db.interventions.filter((x) => x.id !== id) });
  },
  resetDemo() {
    set(buildSeed());
  },
};
