import { predictRisk } from "./risk-model";
import type { Alert, DB, Faculty, Intervention, Student } from "./types";

export const FACULTY: Faculty[] = [
  { id: "FAC01", name: "Dr. Priya Raman", department: "Computer Science", email: "priya.raman@eduguard.edu" },
  { id: "FAC02", name: "Prof. Arun Menon", department: "Electronics", email: "arun.menon@eduguard.edu" },
  { id: "FAC03", name: "Dr. Kavitha Iyer", department: "Mechanical", email: "kavitha.iyer@eduguard.edu" },
  { id: "FAC04", name: "Prof. Sanjay Rao", department: "Information Tech", email: "sanjay.rao@eduguard.edu" },
];

export const ADMIN_USER = { id: "ADMIN", name: "Dr. Lakshmi Narayanan", title: "Academic Administrator" };

// [id, name, attendance, assignment, internal, quiz, previous]
// The first 15 rows (attendance, assignment, internal) come from the uploaded spreadsheet;
// quiz and previous values were added as sample data.
const SHEET_ROWS: [string, string, number, number, number, number, number][] = [
  ["STU001", "Aarav", 35, 30, 32, 34, 41],
  ["STU002", "Diya", 88, 90, 84, 86, 82],
  ["STU003", "Kabir", 62, 55, 58, 56, 60],
  ["STU004", "Meera", 42, 38, 35, 40, 45],
  ["STU005", "Ishaan", 76, 72, 80, 78, 74],
  ["STU006", "Anaya", 55, 60, 52, 54, 58],
  ["STU007", "Vihaan", 29, 45, 35, 38, 44],
  ["STU008", "Sara", 93, 86, 91, 89, 88],
  ["STU009", "Arjun", 68, 64, 70, 66, 65],
  ["STU010", "Nisha", 38, 32, 40, 37, 42],
  ["STU011", "Rohan", 81, 78, 75, 77, 76],
  ["STU012", "Tara", 49, 52, 46, 48, 52],
  ["STU013", "Dev", 72, 68, 74, 71, 70],
  ["STU014", "Aditi", 33, 28, 36, 31, 40],
  ["STU015", "Neil", 59, 63, 57, 60, 61],
];

const SAMPLE_ROWS: [string, string, number, number, number, number, number][] = [
  ["STU016", "Rahul Kumar", 55, 40, 38, 42, 50],
  ["STU017", "Priya Sharma", 91, 94, 88, 90, 87],
  ["STU018", "Karthik Reddy", 64, 58, 61, 59, 63],
  ["STU019", "Sneha Patel", 84, 80, 79, 82, 78],
  ["STU020", "Aditya Verma", 47, 35, 44, 41, 49],
  ["STU021", "Ananya Gupta", 77, 85, 72, 74, 80],
  ["STU022", "Mohammed Faiz", 58, 66, 55, 52, 57],
  ["STU023", "Lakshmi Pillai", 95, 92, 93, 94, 91],
  ["STU024", "Harsh Malhotra", 40, 44, 39, 36, 46],
  ["STU025", "Divya Nair", 70, 74, 66, 69, 68],
  ["STU026", "Siddharth Joshi", 52, 48, 50, 47, 55],
  ["STU027", "Pooja Desai", 86, 82, 85, 80, 83],
  ["STU028", "Vikram Singh", 61, 52, 49, 53, 58],
  ["STU029", "Fatima Shaikh", 79, 88, 81, 84, 79],
  ["STU030", "Arnav Bose", 36, 41, 34, 38, 43],
];

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "");
}

function daysAgo(d: number, now: number) {
  return new Date(now - d * 86400000).toISOString();
}

export function buildStudents(now = Date.now()): Student[] {
  const rows = [
    ...SHEET_ROWS.map((r) => ({ r, source: "spreadsheet" as const })),
    ...SAMPLE_ROWS.map((r) => ({ r, source: "sample" as const })),
  ];
  return rows.map(({ r, source }, i) => {
    const fac = FACULTY[i % FACULTY.length]!;
    const [id, name, attendance, assignment, internal, quiz, previous] = r;
    return {
      id,
      name,
      email: `${slug(name)}@student.eduguard.edu`,
      department: fac.department,
      semester: 3 + (i % 4),
      facultyId: fac.id,
      attendance,
      assignment,
      quiz,
      internal,
      previous,
      source,
      updatedAt: daysAgo(i % 9, now),
    };
  });
}

export function reasonsFor(s: Student): string[] {
  return predictRisk(s).reasons.map((r) => r.message);
}

export function buildSeed(now = Date.now()): DB {
  const students = buildStudents(now);
  const alerts: Alert[] = [];
  const interventions: Intervention[] = [];
  let n = 1;

  students.forEach((s, i) => {
    const p = predictRisk(s);
    if (p.level === "High") {
      alerts.push({
        id: `ALT${String(n++).padStart(3, "0")}`,
        studentId: s.id,
        facultyId: s.facultyId,
        score: p.score,
        reasons: p.reasons.map((r) => r.message),
        status: "open",
        createdAt: daysAgo(1 + (i % 6), now),
      });
    }
  });

  // A few resolved alerts for history.
  ["STU003", "STU022", "STU028"].forEach((sid, i) => {
    const s = students.find((x) => x.id === sid)!;
    alerts.push({
      id: `ALT${String(n++).padStart(3, "0")}`,
      studentId: sid,
      facultyId: s.facultyId,
      score: 72 + i * 2,
      reasons: reasonsFor(s),
      status: "resolved",
      createdAt: daysAgo(30 + i * 4, now),
      resolvedAt: daysAgo(14 + i * 3, now),
      resolutionNote: "Student improved after remedial classes and weekly check-ins.",
    });
  });

  const plan: [string, Intervention["type"], Intervention["status"], number, string][] = [
    ["STU003", "Remedial classes", "Completed", 74, "Six remedial sessions on core subjects."],
    ["STU022", "Assignment support", "Completed", 72, "Weekly assignment clinic, all pending work submitted."],
    ["STU028", "Attendance follow-up", "Completed", 76, "Parent call and attendance contract."],
    ["STU001", "Counseling session", "In Progress", 0, "First session held, follow-up booked."],
    ["STU007", "Attendance follow-up", "Pending", 0, "Call student and guardian about absences."],
    ["STU016", "Mentoring session", "In Progress", 0, "Paired with senior mentor."],
    ["STU014", "Remedial classes", "Pending", 0, "Enroll in Saturday remedial batch."],
  ];
  plan.forEach(([sid, type, status, baseline, notes], i) => {
    const s = students.find((x) => x.id === sid)!;
    const current = predictRisk(s).score;
    interventions.push({
      id: `INT${String(i + 1).padStart(3, "0")}`,
      studentId: sid,
      facultyId: s.facultyId,
      type,
      status,
      notes,
      baselineScore: baseline || current,
      createdAt: daysAgo(35 - i * 4, now),
      updatedAt: daysAgo(10 - i, now),
    });
  });

  return {
    version: 1,
    faculty: FACULTY,
    students,
    alerts,
    interventions,
    activities: [
      { id: "ACT1", at: daysAgo(0.1, now), text: "Risk scores recalculated for 30 students", kind: "system" },
      { id: "ACT2", at: daysAgo(1, now), text: "High-risk alert raised for Aarav (STU001)", kind: "alert" },
      { id: "ACT3", at: daysAgo(2, now), text: "Counseling session started for Aarav", kind: "intervention" },
      { id: "ACT4", at: daysAgo(3, now), text: "15 records imported from Student_Data_Member_2.xlsx", kind: "import" },
      { id: "ACT5", at: daysAgo(14, now), text: "Alert resolved for Kabir (STU003)", kind: "alert" },
    ],
  };
}

/** Deterministic 6-month sample attendance trend for a student (synthetic). */
export const MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
export function monthlyAttendance(s: Student): number[] {
  let h = 0;
  for (const c of s.id) h = (h * 31 + c.charCodeAt(0)) % 9973;
  const drift = s.attendance < 60 ? -2.2 : s.attendance > 80 ? 0.6 : -0.8;
  return MONTHS.map((_, i) => {
    const wobble = ((h * (i + 3)) % 9) - 4;
    const v = s.attendance - drift * (2.5 - i) + wobble * 0.8;
    return Math.round(Math.max(0, Math.min(100, v)));
  });
}
