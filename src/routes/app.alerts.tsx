import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BellOff, BellRing, CheckCircle2, History } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, NoAccess, PageHeader, Panel, StatCard, timeAgo } from "@/components/app/bits";
import { RiskBadge } from "@/components/app/risk";
import { useScoped } from "@/lib/access";
import { riskLevel } from "@/lib/risk-model";
import { actions } from "@/lib/store";
import type { Alert } from "@/lib/types";

export const Route = createFileRoute("/app/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts – EduGuard AI" },
      { name: "description", content: "Automatic high-risk student alerts for faculty, with resolution history." },
      { property: "og:title", content: "Alerts – EduGuard AI" },
      { property: "og:description", content: "High-risk student alerts." },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const { scoped, db, role } = useScoped();
  const [tab, setTab] = useState<"open" | "resolved">("open");
  const [resolving, setResolving] = useState<Alert | null>(null);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  if (role === "student") return <NoAccess />;

  const list = scoped.alerts.filter((a) => a.status === tab).sort((a, b) => (b.resolvedAt ?? b.createdAt).localeCompare(a.resolvedAt ?? a.createdAt));
  const open = scoped.alerts.filter((a) => a.status === "open").length;
  const resolved = scoped.alerts.length - open;

  const confirm = () => {
    if (note.trim().length < 3) return setErr("Add a short note about what was done");
    if (resolving) {
      actions.resolveAlert(resolving.id, note.trim());
      toast.success("Alert marked as resolved");
    }
    setResolving(null);
  };

  return (
    <>
      <PageHeader title="Alerts & notifications" description="Alerts are raised automatically when a student enters the high-risk band (70%+)." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open alerts" value={open} icon={BellRing} tone="danger" />
        <StatCard label="Resolved" value={resolved} icon={CheckCircle2} tone="success" delay={50} />
        <StatCard label="Total raised" value={scoped.alerts.length} icon={History} tone="primary" delay={100} />
      </div>
      <Panel className="mt-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mb-4">
          <TabsList>
            <TabsTrigger value="open">Open ({open})</TabsTrigger>
            <TabsTrigger value="resolved">History ({resolved})</TabsTrigger>
          </TabsList>
        </Tabs>
        {list.length === 0 ? (
          <EmptyState icon={BellOff} title={tab === "open" ? "No open alerts" : "No resolved alerts yet"} />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {list.map((a) => {
              const s = db.students.find((x) => x.id === a.studentId);
              const f = db.faculty.find((x) => x.id === a.facultyId);
              return (
                <li key={a.id} className="rounded-2xl border p-4 transition-shadow hover:shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to="/app/students/$id" params={{ id: a.studentId }} className="font-semibold hover:text-primary hover:underline">
                        {s?.name ?? a.studentId}
                      </Link>
                      <div className="text-xs text-muted-foreground">{a.studentId} · raised {timeAgo(a.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-2xl font-bold text-danger">{a.score.toFixed(0)}%</div>
                      <RiskBadge level={riskLevel(a.score)} />
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm">
                    {a.reasons.map((r) => (
                      <li key={r} className="flex gap-2 text-muted-foreground">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-danger" /> {r}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                    <span className="text-xs text-muted-foreground">Notified: {f?.name ?? a.facultyId}</span>
                    {a.status === "open" ? (
                      <Button size="sm" variant="outline" onClick={() => { setResolving(a); setNote(""); setErr(""); }}>
                        <CheckCircle2 /> Mark resolved
                      </Button>
                    ) : (
                      <span className="text-xs text-success">Resolved {a.resolvedAt ? timeAgo(a.resolvedAt) : ""}</span>
                    )}
                  </div>
                  {a.resolutionNote && <p className="mt-2 rounded-lg bg-muted p-2 text-xs">{a.resolutionNote}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
      <Dialog open={!!resolving} onOpenChange={(o) => !o && setResolving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve alert</DialogTitle>
            <DialogDescription>Briefly note what was done for this student. It's kept in the alert history.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="res-note">Resolution note</Label>
            <Textarea id="res-note" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="Met with student, enrolled in remedial classes…" />
            {err && <p className="text-sm text-destructive">{err}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolving(null)}>Cancel</Button>
            <Button onClick={confirm}>Mark resolved</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
