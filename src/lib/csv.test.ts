import { describe, expect, it } from "vitest";
import { parseStudentsCSV } from "./csv";

const D = { department: "Computer Science", facultyId: "FAC01" };

describe("CSV import", () => {
  it("accepts the spreadsheet's column names", () => {
    const csv =
      "Student ID,Student Name,Attendance (%),Assignment Completion (%),Internal Marks (%),Overall Performance (%),Risk Category\nSTU001,Aarav,35,30,32,32.3,High Risk";
    const r = parseStudentsCSV(csv, D);
    expect(r.errors).toEqual([]);
    expect(r.rows[0]).toMatchObject({ id: "STU001", name: "Aarav", attendance: 35, assignment: 30, internal: 32 });
  });
  it("rejects percentages above 100", () => {
    const r = parseStudentsCSV("Student ID,Student Name,Attendance,Assignment,Internal\nS1,A,120,50,50", D);
    expect(r.rows).toHaveLength(0);
    expect(r.errors).toHaveLength(1);
  });
});
