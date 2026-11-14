/**
 * EduGuard demo risk model.
 *
 * A transparent baseline: a weighted academic score passed through a logistic curve.
 * Its two curve parameters were calibrated so it reproduces the risk categories of the
 * 15 labelled records in the uploaded spreadsheet. It is a demonstration model only and
 * has NOT been scientifically validated.
 */

export type RiskLevel = "Low" | "Medium" | "High";

export type FeatureKey = "attendance" | "assignment" | "quiz" | "internal" | "previous";

export type RiskInput = Partial<Record<FeatureKey, number | null | undefined>>;

export const FEATURES: {
  key: FeatureKey;
  label: string;
  weight: number;
  threshold: number;
}[] = [
  { key: "attendance", label: "Attendance", weight: 0.25, threshold: 75 },
  { key: "assignment", label: "Assignment completion", weight: 0.2, threshold: 70 },
  { key: "quiz", label: "Quiz average", weight: 0.2, threshold: 60 },
  { key: "internal", label: "Internal exam marks", weight: 0.25, threshold: 60 },
  { key: "previous", label: "Previous academic performance", weight: 0.1, threshold: 60 },
];

export const MODEL_INFO = {
  name: "EduGuard Baseline v1 (demo)",
  center: 62.1,
  scale: 18.53,
  note: "Demo model calibrated on 15 sample records. Not scientifically validated — use as a conversation starter, not a verdict.",
};

export const RISK_BANDS = { mediumFrom: 40, highFrom: 70 } as const;

export interface RiskReason {
  feature: FeatureKey;
  label: string;
  value: number;
  threshold: number;
  impact: number; // share of total risk contribution, 0–100
  message: string;
}

export interface RiskPrediction {
  score: number; // 0–100, one decimal
  level: RiskLevel;
  weightedPerformance: number;
  reasons: RiskReason[];
  explanation: string;
  recommendations: string[];
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function riskLevel(score: number): RiskLevel {
  if (score >= RISK_BANDS.highFrom) return "High";
  if (score >= RISK_BANDS.mediumFrom) return "Medium";
  return "Low";
}

const RECS: Record<FeatureKey, string> = {
  attendance: "Monitor attendance weekly and contact the student after any absence.",
  assignment: "Offer assignment support sessions and agree on a submission plan.",
  quiz: "Provide additional learning materials and short practice quizzes.",
  internal: "Arrange remedial classes before the next internal exam.",
  previous: "Assign a mentor to review earlier gaps in core subjects.",
};

export function predictRisk(input: RiskInput): RiskPrediction {
  const present = FEATURES.filter(
    (f) => typeof input[f.key] === "number" && Number.isFinite(input[f.key] as number),
  );
  const totalWeight = present.reduce((s, f) => s + f.weight, 0) || 1;
  const weightedPerformance =
    present.reduce((s, f) => s + clamp(input[f.key] as number) * f.weight, 0) / totalWeight;

  const raw = 100 / (1 + Math.exp(-(MODEL_INFO.center - weightedPerformance) / MODEL_INFO.scale));
  const score = Math.round(raw * 10) / 10;
  const level = riskLevel(score);

  const deficits = present.map((f) => ({
    f,
    value: clamp(input[f.key] as number),
    deficit: (f.weight * (100 - clamp(input[f.key] as number))) / totalWeight,
  }));
  const totalDeficit = deficits.reduce((s, d) => s + d.deficit, 0) || 1;

  const reasons: RiskReason[] = deficits
    .filter((d) => d.value < d.f.threshold)
    .sort((a, b) => b.deficit - a.deficit)
    .map((d) => ({
      feature: d.f.key,
      label: d.f.label,
      value: d.value,
      threshold: d.f.threshold,
      impact: Math.round((d.deficit / totalDeficit) * 100),
      message: `${d.f.label} is ${Math.round(d.value)}% (target ${d.f.threshold}%+)`,
    }));

  let explanation: string;
  if (reasons.length === 0) {
    explanation = `All indicators are at or above target. Weighted academic score is ${weightedPerformance.toFixed(1)}%.`;
  } else {
    const top = reasons.slice(0, 2).map((r) => r.label.toLowerCase());
    explanation = `Weighted academic score is ${weightedPerformance.toFixed(1)}%. Risk is driven mainly by ${top.join(" and ")}${reasons.length > 2 ? `, with ${reasons.length - 2} other indicator(s) below target` : ""}.`;
  }

  const recommendations: string[] = [];
  if (level === "High") recommendations.push("Schedule an individual faculty meeting this week.");
  reasons.forEach((r) => recommendations.push(RECS[r.feature]));
  if (level === "High") recommendations.push("Refer to counseling if no improvement within 2 weeks.");
  if (level === "Medium" && reasons.length === 0)
    recommendations.push("Check in during class and review progress in two weeks.");
  if (level === "Low") recommendations.push("Keep up the current routine — acknowledge good progress.");

  return { score, level, weightedPerformance, reasons, explanation, recommendations };
}
