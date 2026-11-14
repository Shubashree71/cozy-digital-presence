import { describe, expect, it } from "vitest";
import { scopeDB } from "./access";
import { buildSeed } from "./seed";

const db = buildSeed(0);

describe("role permissions", () => {
  it("students only see their own record", () => {
    const s = scopeDB(db, "student", "STU001");
    expect(s.students.map((x) => x.id)).toEqual(["STU001"]);
    expect(s.alerts).toHaveLength(0);
  });
  it("faculty only see students assigned to them", () => {
    const s = scopeDB(db, "faculty", "FAC01");
    expect(s.students.length).toBeGreaterThan(0);
    expect(s.students.every((x) => x.facultyId === "FAC01")).toBe(true);
    expect(s.alerts.every((a) => s.students.some((x) => x.id === a.studentId))).toBe(true);
  });
  it("admin sees every student", () => {
    expect(scopeDB(db, "admin", "ADMIN").students).toHaveLength(db.students.length);
  });
});
