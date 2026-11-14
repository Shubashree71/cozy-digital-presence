import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { NoAccess, PageHeader, Panel } from "@/components/app/bits";
import { PredictionCard } from "@/components/app/prediction-card";
import { useScoped } from "@/lib/access";
import { FEATURES, MODEL_INFO, predictRisk, type FeatureKey } from "@/lib/risk-model";
import { actions } from "@/lib/store";

export const Route = createFileRoute("/app/predict")({
  head: () => ({
    meta: [
      { title: "AI Early Warning – EduGuard AI" },
      { name: "description", content: "Predict a student's academic risk score, see why, and get recommended interventions." },
      { property: "og:title", content: "AI Early Warning – EduGuard AI" },
      { property: "og:description", content: "Academic risk prediction with explanations." },
    ],
  }),
  component: PredictPage,
});

type Values = Record<FeatureKey, number>;
const EXAMPLE: Values = { attendance: 55, assignment: 40, quiz: 42, internal: 38, previous: 50 };

function PredictPage() {
  const { scoped, role } = useScoped();
  const [studentId, setStudentId] = useState("custom");
  const [values, setValues] = useState<Values>(EXAMPLE);
  const p = useMemo(() => predictRisk(values), [values]);
  if (role === "student") return <NoAccess />;

  const pick = (id: string) => {
    setStudentId(id);
    const s = scoped.students.find((x) => x.id === id);
    if (s) setValues({ attendance: s.attendance, assignment: s.assignment, quiz: s.quiz, internal: s.internal, previous: s.previous });
    else setValues(EXAMPLE);
  };
  const student = scoped.students.find((x) => x.id === studentId);

  return (
    <>
      <PageHeader title="AI Early Warning System" description="Adjust the five academic signals to see the predicted risk, the reasons and suggested actions." />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Panel title="Student data">
          <div className="space-y-1.5">
            <Label>Load a student</Label>
            <Select value={studentId} onValueChange={pick}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Example: Rahul Kumar (what-if)</SelectItem>
                {scoped.students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.id})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-6 space-y-6">
            {FEATURES.map((f) => (
              <div key={f.key}>
                <div className="mb-2 flex justify-between text-sm">
                  <Label>{f.label}</Label>
                  <span className="font-semibold">{values[f.key]}%</span>
                </div>
                <Slider
                  value={[values[f.key]]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(v) => setValues((x) => ({ ...x, [f.key]: v[0] ?? 0 }))}
                  aria-label={f.label}
                />
              </div>
            ))}
          </div>
          {student && (
            <Button
              className="mt-6 w-full"
              onClick={() => {
                actions.updateStudent(student.id, values);
                toast.success(`Saved to ${student.name}'s record`);
                if (p.level === "High") toast.warning(`High-risk alert raised for ${student.name}`);
              }}
            >
              <Save /> Save to {student.name}'s record
            </Button>
          )}
          <div className="mt-6 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
            <div className="font-semibold text-foreground">{MODEL_INFO.name}</div>
            Weights: {FEATURES.map((f) => `${f.label.split(" ")[0]} ${Math.round(f.weight * 100)}%`).join(", ")}.
            Low 0–39 · Medium 40–69 · High 70–100.
          </div>
        </Panel>
        <PredictionCard p={p} title={student ? `Prediction for ${student.name}` : "Prediction"} />
      </div>
    </>
  );
}
