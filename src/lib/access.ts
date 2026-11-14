import { useMemo } from "react";
import { useDB } from "./store";
import { useSession } from "./session";
import { ADMIN_USER } from "./seed";
import type { DB, Role } from "./types";

/** Records the current role may see: admin sees all, faculty sees assigned students, students see themselves. */
export function scopeDB(db: DB, role: Role, userId: string) {
  if (role === "admin") return db;
  if (role === "faculty") {
    const students = db.students.filter((s) => s.facultyId === userId);
    const ids = new Set(students.map((s) => s.id));
    return {
      ...db,
      students,
      alerts: db.alerts.filter((a) => ids.has(a.studentId)),
      interventions: db.interventions.filter((i) => ids.has(i.studentId)),
    };
  }
  const students = db.students.filter((s) => s.id === userId);
  return {
    ...db,
    students,
    alerts: [],
    interventions: db.interventions.filter((i) => i.studentId === userId),
    activities: [],
  };
}

export function useScoped() {
  const db = useDB();
  const session = useSession();
  return useMemo(() => {
    const role: Role = session?.role ?? "student";
    const userId = session?.userId ?? "";
    const scoped = scopeDB(db, role, userId);
    let displayName = "";
    let subtitle = "";
    if (role === "admin") {
      displayName = ADMIN_USER.name;
      subtitle = "Administrator";
    } else if (role === "faculty") {
      const f = db.faculty.find((x) => x.id === userId);
      displayName = f?.name ?? userId;
      subtitle = `Faculty · ${f?.department ?? ""}`;
    } else {
      const s = db.students.find((x) => x.id === userId);
      displayName = s?.name ?? userId;
      subtitle = `Student · ${userId}`;
    }
    return { db, scoped, role, userId, displayName, subtitle, session };
  }, [db, session]);
}
