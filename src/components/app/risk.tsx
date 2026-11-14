import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/risk-model";

export const riskBadge = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      level: {
        Low: "bg-success-soft text-success",
        Medium: "bg-warning-soft text-warning",
        High: "bg-danger-soft text-danger",
      },
    },
  },
);

export const riskDot = cva("inline-block size-2 rounded-full", {
  variants: { level: { Low: "bg-success", Medium: "bg-warning", High: "bg-danger" } },
});

export const riskText = cva("", {
  variants: { level: { Low: "text-success", Medium: "text-warning", High: "text-danger" } },
});

export const riskBar = cva("h-full rounded-full transition-all", {
  variants: { level: { Low: "bg-success", Medium: "bg-warning", High: "bg-danger" } },
});

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  return (
    <span className={cn(riskBadge({ level }), className)}>
      <span className={riskDot({ level })} />
      {level} risk
    </span>
  );
}

export function Meter({ value, level }: { value: number; level?: RiskLevel }) {
  const l: RiskLevel = level ?? (value >= 75 ? "Low" : value >= 60 ? "Medium" : "High");
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={riskBar({ level: l })} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

/** Semicircle gauge for a 0–100 risk score. */
export function RiskMeter({ score, level, size = 240 }: { score: number; level: RiskLevel; size?: number }) {
  const r = 90;
  const cx = 110;
  const cy = 110;
  const arc = (from: number, to: number) => {
    const a0 = Math.PI * (1 - from / 100);
    const a1 = Math.PI * (1 - to / 100);
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy - r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy - r * Math.sin(a1);
    return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
  };
  const angle = Math.PI * (1 - Math.min(100, Math.max(0, score)) / 100);
  const nx = cx + (r - 18) * Math.cos(angle);
  const ny = cy - (r - 18) * Math.sin(angle);
  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg viewBox="0 0 220 130" width={size} role="img" aria-label={`Risk score ${score} of 100`}>
        <path d={arc(0, 39.5)} className="stroke-success" strokeWidth={18} fill="none" strokeLinecap="round" />
        <path d={arc(40.5, 69.5)} className="stroke-warning" strokeWidth={18} fill="none" />
        <path d={arc(70.5, 100)} className="stroke-danger" strokeWidth={18} fill="none" strokeLinecap="round" />
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          className="stroke-foreground transition-all duration-700"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={8} className="fill-foreground" />
      </svg>
      <div className="-mt-2 text-center">
        <div className={cn("font-display text-4xl font-bold", riskText({ level }))}>{score.toFixed(0)}%</div>
        <div className={cn("text-sm font-semibold uppercase tracking-wider", riskText({ level }))}>
          {level} risk
        </div>
      </div>
    </div>
  );
}
