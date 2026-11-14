import { predictRisk, MODEL_INFO } from "./risk-model";
import type { Faculty, Intervention, Student } from "./types";

export async function downloadStudentReport(
  s: Student,
  faculty: Faculty | undefined,
  interventions: Intervention[],
) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const p = predictRisk(s);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const navy: [number, number, number] = [27, 45, 102];
  const tone: Record<"High" | "Medium" | "Low", [number, number, number]> = {
    High: [214, 58, 47],
    Medium: [230, 140, 30],
    Low: [34, 150, 90],
  };

  doc.setFillColor(...navy);
  doc.rect(0, 0, 595, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("EduGuard AI", 40, 42);
  doc.setFontSize(11);
  doc.text("Student Performance Report", 40, 64);
  doc.text(new Date().toLocaleDateString(), 555, 64, { align: "right" });

  doc.setTextColor(30, 30, 50);
  doc.setFontSize(16);
  doc.text(`${s.name} (${s.id})`, 40, 130);
  doc.setFontSize(10);
  doc.text(
    `${s.department} · Semester ${s.semester} · Faculty: ${faculty?.name ?? s.facultyId}`,
    40,
    148,
  );

  doc.setFillColor(...tone[p.level]);
  doc.roundedRect(40, 165, 515, 54, 8, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text(`Risk score: ${p.score.toFixed(1)} / 100`, 56, 190);
  doc.text(`Risk level: ${p.level.toUpperCase()}`, 56, 208);

  autoTable(doc, {
    startY: 238,
    head: [["Indicator", "Value", "Target"]],
    body: [
      ["Attendance", `${s.attendance}%`, "75%+"],
      ["Assignment completion", `${s.assignment}%`, "70%+"],
      ["Quiz average", `${s.quiz}%`, "60%+"],
      ["Internal exam marks", `${s.internal}%`, "60%+"],
      ["Previous performance", `${s.previous}%`, "60%+"],
    ],
    headStyles: { fillColor: navy },
    styles: { fontSize: 10 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let y = (doc as any).lastAutoTable.finalY + 24;
  doc.setTextColor(30, 30, 50);
  doc.setFontSize(12);
  doc.text("Prediction explanation", 40, y);
  doc.setFontSize(10);
  y += 16;
  doc.splitTextToSize(p.explanation, 515).forEach((line: string) => {
    doc.text(line, 40, y);
    y += 14;
  });
  y += 8;
  doc.setFontSize(12);
  doc.text("Recommended interventions", 40, y);
  doc.setFontSize(10);
  y += 16;
  p.recommendations.forEach((r) => {
    doc.text(`• ${r}`, 48, y);
    y += 14;
  });

  if (interventions.length) {
    autoTable(doc, {
      startY: y + 10,
      head: [["Intervention", "Status", "Started", "Notes"]],
      body: interventions.map((i) => [
        i.type,
        i.status,
        new Date(i.createdAt).toLocaleDateString(),
        i.notes,
      ]),
      headStyles: { fillColor: navy },
      styles: { fontSize: 9 },
    });
  }

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 140);
  doc.text(`${MODEL_INFO.name}. ${MODEL_INFO.note}`, 40, 810, { maxWidth: 515 });

  doc.save(`EduGuard_Report_${s.id}.pdf`);
}
