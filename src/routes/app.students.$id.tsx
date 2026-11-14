import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NoAccess, PageHeader, Panel, timeAgo } from "@/components/app/bits";
import { InterventionDialog, InterventionList } from "@/components/app/interventions";
import { PredictionCard } from "@/components/app/prediction-card";
import { Meter } from "@/components/app/risk";
import { StudentFormDialog } from "@/components/app/student-form-dialog";
import { useScoped } from "@/lib/access";
import { downloadStudentReport } from "@/lib/pdf";
import { FEATURES, predictRisk } from "@/lib/risk-model";

export const Route = createFileRoute("/app/students/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Student ${params.id} – EduGuard AI` },
      { name: "description", content: "Student academic profile, risk prediction and interventions." },
      { property: "og:title", content: `Student ${params.id} – EduGuard AI` },
      { property: "og:description", content: "Student risk profile." },
    ],
  }),
  component: StudentDetail,
});

function StudentDetail() {
  const { id } = Route.useParams();
  const { scoped, db, role } = useScoped();
  const [editOpen, setEditOpen] = useState(false);
  const [intOpen, setIntOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const s = scoped.students.find((x) => x.id === id);
  if (role === "student" || !s) return <NoAccess message={!s ? "This student doesn't exist or isn't assigned to you." : undefined} />;

  const p = predictRisk(s);
  const faculty = db.faculty.find((f) => f.id === s.facultyId);
  const interventions = scoped.interventions.filter((i) => i.studentId === s.id);
  const alerts = scoped.alerts.filter((a) => a.studentId === s.id);

  return (
    <>
      <Link to="/app/students" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All students
      </Link>
      <PageHeader
        title={s.name}
        description={`${s.id} · ${s.department} · Semester ${s.semester} · ${faculty?.name ?? ""}`}
        actions={
          <>
            <Button
              variant="outline"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await downloadStudentReport(s, faculty, interventions);
                  toast.success("PDF report downloaded");
                } catch {
                  toast.error("Could not create the PDF");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Download /> {busy ? "Preparing…" : "PDF report"}
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil /> Edit
            </Button>
            <Button onClick={() => setIntOpen(true)}>
              <Plus /> Record intervention
            </Button>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PredictionCard p={p} />
        </div>
        <Panel title="Academic indicators">
          <ul className="space-y-4">
            {FEATURES.map((f) => (
              <li key={f.key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{f.label}</span>
                  <span className="font-semibold">{s[f.key]}%</span>
                </div>
                <Meter value={s[f.key]} level={s[f.key] >= f.threshold ? "Low" : s[f.key] >= f.threshold - 15 ? "Medium" : "High"} />
                <div className="mt-0.5 text-[11px] text-muted-foreground">Target {f.threshold}% · weight {Math.round(f.weight * 100)}%</div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">Last updated {timeAgo(s.updatedAt)} · {s.email}</p>
        </Panel>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Interventions" className="lg:col-span-2">
          <InterventionList items={interventions} />
        </Panel>
        <Panel title="Alert history">
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No alerts for this student.</p>
          ) : (
            <ul className="space-y-3">
              {alerts.map((a) => (
                <li key={a.id} className="rounded-xl border p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-semibold text-danger">{a.score.toFixed(0)}% risk</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(a.createdAt)}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {a.status === "open" ? "Open" : `Resolved ${a.resolvedAt ? timeAgo(a.resolvedAt) : ""}`}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <StudentFormDialog open={editOpen} onOpenChange={setEditOpen} student={s} />
      <InterventionDialog open={intOpen} onOpenChange={setIntOpen} studentId={s.id} />
    </>
  );
}
