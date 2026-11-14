import { Info, Lightbulb, TrendingDown } from "lucide-react";
import { MODEL_INFO, type RiskPrediction } from "@/lib/risk-model";
import { Panel } from "./bits";
import { RiskMeter } from "./risk";

export function PredictionCard({ p, title = "AI risk prediction" }: { p: RiskPrediction; title?: string }) {
  return (
    <Panel title={title} description={MODEL_INFO.name}>
      <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
        <div className="mx-auto">
          <RiskMeter score={p.score} level={p.level} />
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Info className="size-4 text-sky" /> Why this prediction
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.explanation}</p>
          </div>
          {p.reasons.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <TrendingDown className="size-4 text-danger" /> Risk factors
              </h3>
              <ul className="mt-2 space-y-2">
                {p.reasons.map((r) => (
                  <li key={r.feature}>
                    <div className="flex justify-between text-xs">
                      <span>{r.message}</span>
                      <span className="font-semibold text-muted-foreground">{r.impact}% of risk</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-danger/80" style={{ width: `${r.impact}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className="mt-5 rounded-xl bg-secondary p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-secondary-foreground">
          <Lightbulb className="size-4" /> Recommended interventions
        </h3>
        <ul className="mt-2 grid gap-1.5 text-sm text-secondary-foreground sm:grid-cols-2">
          {p.recommendations.map((r) => (
            <li key={r} className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              {r}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">{MODEL_INFO.note}</p>
    </Panel>
  );
}
