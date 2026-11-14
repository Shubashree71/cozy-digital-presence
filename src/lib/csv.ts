import type { Student } from "./types";
import type { StudentInput } from "./store";

export const CSV_COLUMNS = [
  "Student ID",
  "Student Name",
  "Email",
  "Department",
  "Semester",
  "Faculty ID",
  "Attendance (%)",
  "Assignment Completion (%)",
  "Quiz Average (%)",
  "Internal Marks (%)",
  "Previous Performance (%)",
] as const;

function esc(v: unknown) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(rows: (string | number)[][]) {
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}

export function downloadFile(name: string, content: string, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const norm = (h: string) => h.toLowerCase().replace(/[^a-z]/g, "");
const ALIASES: Record<string, keyof StudentInput> = {
  studentid: "id",
  id: "id",
  studentname: "name",
  name: "name",
  email: "email",
  department: "department",
  dept: "department",
  semester: "semester",
  sem: "semester",
  facultyid: "facultyId",
  attendance: "attendance",
  assignmentcompletion: "assignment",
  assignment: "assignment",
  quizaverage: "quiz",
  quiz: "quiz",
  quizscore: "quiz",
  internalmarks: "internal",
  internal: "internal",
  previousperformance: "previous",
  overallperformance: "previous",
  previous: "previous",
};

export interface ImportResult {
  rows: StudentInput[];
  errors: string[];
}

export function parseStudentsCSV(
  text: string,
  defaults: { department: string; facultyId: string },
): ImportResult {
  const table = parseCSV(text);
  const errors: string[] = [];
  if (table.length < 2) return { rows: [], errors: ["The file has no data rows."] };
  const header = table[0].map((h) => ALIASES[norm(h)]);
  if (!header.includes("id") || !header.includes("name")) {
    return { rows: [], errors: ['Missing required columns "Student ID" and "Student Name".'] };
  }
  const rows: StudentInput[] = [];
  table.slice(1).forEach((cells, i) => {
    const rec: Record<string, string> = {};
    header.forEach((k, j) => {
      if (k) rec[k] = (cells[j] ?? "").trim();
    });
    const line = i + 2;
    if (!rec.id || !rec.name) {
      errors.push(`Row ${line}: Student ID and name are required.`);
      return;
    }
    const pct = (k: string) => {
      if (rec[k] === undefined || rec[k] === "") return undefined;
      const n = Number(rec[k].replace("%", ""));
      return Number.isFinite(n) && n >= 0 && n <= 100 ? n : NaN;
    };
    const vals = {
      attendance: pct("attendance"),
      assignment: pct("assignment"),
      quiz: pct("quiz"),
      internal: pct("internal"),
      previous: pct("previous"),
    };
    const bad = Object.entries(vals).filter(([, v]) => Number.isNaN(v));
    if (bad.length) {
      errors.push(`Row ${line}: ${bad.map(([k]) => k).join(", ")} must be numbers between 0 and 100.`);
      return;
    }
    if (vals.attendance === undefined || vals.assignment === undefined || vals.internal === undefined) {
      errors.push(`Row ${line}: attendance, assignment and internal marks are required.`);
      return;
    }
    const known = [vals.attendance, vals.assignment, vals.internal];
    const avg = Math.round(known.reduce((a, b) => a + b, 0) / known.length);
    rows.push({
      id: rec.id.toUpperCase(),
      name: rec.name,
      email: rec.email || `${rec.name.toLowerCase().replace(/[^a-z]+/g, ".")}@student.eduguard.edu`,
      department: rec.department || defaults.department,
      semester: Number(rec.semester) || 1,
      facultyId: rec.facultyId || defaults.facultyId,
      attendance: vals.attendance,
      assignment: vals.assignment,
      internal: vals.internal,
      quiz: vals.quiz ?? vals.internal,
      previous: vals.previous ?? avg,
    });
  });
  return { rows, errors };
}

export function studentsToCSV(students: Student[], score: (s: Student) => { score: number; level: string }) {
  return toCSV([
    [...CSV_COLUMNS, "Risk Score", "Risk Level"],
    ...students.map((s) => {
      const p = score(s);
      return [
        s.id, s.name, s.email, s.department, s.semester, s.facultyId,
        s.attendance, s.assignment, s.quiz, s.internal, s.previous, p.score, p.level,
      ];
    }),
  ]);
}
