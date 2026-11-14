import { describe, expect, it } from "vitest";
import { predictRisk, riskLevel } from "./risk-model";

// Rows from Student_Data_Member_2_Clear-1_1.xlsx: [attendance, assignment, internal, category]
const SHEET: [string, number, number, number, "Low" | "Medium" | "High"][] = [
  ["Aarav", 35, 30, 32, "High"],
  ["Diya", 88, 90, 84, "Low"],
  ["Kabir", 62, 55, 58, "Medium"],
  ["Meera", 42, 38, 35, "High"],
  ["Ishaan", 76, 72, 80, "Low"],
  ["Anaya", 55, 60, 52, "Medium"],
  ["Vihaan", 29, 45, 35, "High"],
  ["Sara", 93, 86, 91, "Low"],
  ["Arjun", 68, 64, 70, "Medium"],
  ["Nisha", 38, 32, 40, "High"],
  ["Rohan", 81, 78, 75, "Low"],
  ["Tara", 49, 52, 46, "Medium"],
  ["Dev", 72, 68, 74, "Low"],
  ["Aditi", 33, 28, 36, "High"],
  ["Neil", 59, 63, 57, "Medium"],
];

describe("risk bands", () => {
  it("0–39 is Low", () => {
    expect(riskLevel(0)).toBe("Low");
    expect(riskLevel(39.9)).toBe("Low");
  });
  it("40–69 is Medium", () => {
    expect(riskLevel(40)).toBe("Medium");
    expect(riskLevel(69.9)).toBe("Medium");
  });
  it("70–100 is High", () => {
    expect(riskLevel(70)).toBe("High");
    expect(riskLevel(100)).toBe("High");
  });
});

describe("demo model", () => {
  it.each(SHEET)("matches the spreadsheet category for %s", (_n, attendance, assignment, internal, level) => {
    expect(predictRisk({ attendance, assignment, internal }).level).toBe(level);
  });

  it("rates the Rahul Kumar example as High risk", () => {
    const p = predictRisk({ attendance: 55, assignment: 40, quiz: 42, internal: 38 });
    expect(p.level).toBe("High");
    expect(p.reasons.map((r) => r.feature)).toContain("attendance");
  });
});
