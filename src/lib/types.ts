export type Role = "admin" | "faculty" | "student";

export interface Faculty {
  id: string;
  name: string;
  department: string;
  email: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  department: string;
  semester: number;
  facultyId: string;
  attendance: number;
  assignment: number;
  quiz: number;
  internal: number;
  previous: number;
  source: "spreadsheet" | "sample" | "manual" | "import";
  updatedAt: string;
}

export type AlertStatus = "open" | "resolved";

export interface Alert {
  id: string;
  studentId: string;
  facultyId: string;
  score: number;
  reasons: string[];
  status: AlertStatus;
  createdAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

export const INTERVENTION_TYPES = [
  "Counseling session",
  "Remedial classes",
  "Assignment support",
  "Attendance follow-up",
  "Mentoring session",
] as const;
export type InterventionType = (typeof INTERVENTION_TYPES)[number];

export type InterventionStatus = "Pending" | "In Progress" | "Completed";

export interface Intervention {
  id: string;
  studentId: string;
  facultyId: string;
  type: InterventionType;
  notes: string;
  status: InterventionStatus;
  baselineScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  at: string;
  text: string;
  kind: "alert" | "student" | "intervention" | "import" | "system";
}

export interface DB {
  version: 1;
  faculty: Faculty[];
  students: Student[];
  alerts: Alert[];
  interventions: Intervention[];
  activities: Activity[];
}

export const DEPARTMENTS = [
  "Computer Science",
  "Electronics",
  "Mechanical",
  "Information Tech",
] as const;
