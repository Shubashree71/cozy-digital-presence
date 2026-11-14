import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, ClipboardList, Minus, Trash2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useScoped } from "@/lib/access";
import { predictRisk } from "@/lib/risk-model";
import { actions } from "@/lib/store";
import { INTERVENTION_TYPES, type Intervention, type InterventionStatus, type InterventionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EmptyState, timeAgo } from "./bits";
import { cva } from "class-variance-authority";

const STATUSES: InterventionStatus[] = ["Pending", "In Progress", "Completed"];

const statusPill = cva("rounded-full px-2.5 py-0.5 text-xs font-semibold", {
  variants: {
    status: {
      Pending: "bg-muted text-muted-foreground",
      "In Progress": "bg-accent text-sky",
      Completed: "bg-success-soft text-success",
    },
  },
});

export function InterventionDialog({
  open,
  onOpenChange,
  studentId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  studentId?: string;
}) {
  const { scoped, role, userId } = useScoped();
  const [sid, setSid] = useState(studentId ?? "");
  const [type, setType] = useState<InterventionType>("Counseling session");
  const [status, setStatus] = useState<InterventionStatus>("Pending");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSid(studentId ?? "");
      setType("Counseling session");
      setStatus("Pending");
      setNotes("");
      setErr(null);
    }
  }, [open, studentId]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sid) return setErr("Choose a student");
    if (notes.trim().length < 3) return setErr("Add a short note (at least 3 characters)");
    if (notes.length > 500) return setErr("Notes must be under 500 characters");
    const s = scoped.students.find((x) => x.id === sid)!;
    actions.addIntervention({
      studentId: sid,
      facultyId: role === "faculty" ? userId : s.facultyId,
      type,
      status,
      notes: notes.trim(),
    });
    toast.success(`${type} recorded for ${s.name}`);
    onOpenChange(false);
  };

  const sorted = [...scoped.students].sort((a, b) => predictRisk(b).score - predictRisk(a).score);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record intervention</DialogTitle>
          <DialogDescription>The student's current risk score is saved so you can see if it improves.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {!studentId && (
            <div className="space-y-1.5">
              <Label>Student</Label>
              <Select value={sid} onValueChange={setSid}>
                <SelectTrigger><SelectValue placeholder="Choose a student" /></SelectTrigger>
                <SelectContent>
                  {sorted.map((s) => {
                    const p = predictRisk(s);
                    return <SelectItem key={s.id} value={s.id}>{s.name} ({s.id}) — {p.score.toFixed(0)}% {p.level}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Action</Label>
              <Select value={type} onValueChange={(v) => setType(v as InterventionType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INTERVENTION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as InterventionStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="int-notes">Notes</Label>
            <Textarea id="int-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was agreed, next steps…" rows={3} maxLength={500} />
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Improvement({ it }: { it: Intervention }) {
  const { db } = useScoped();
  const s = db.students.find((x) => x.id === it.studentId);
  if (!s) return null;
  const now = predictRisk(s).score;
  const delta = Math.round((now - it.baselineScore) * 10) / 10;
  if (Math.abs(delta) < 1)
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="size-3.5" /> No change yet ({now.toFixed(0)}%)
      </span>
    );
  const better = delta < 0;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", better ? "text-success" : "text-danger")}>
      {better ? <ArrowDownRight className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}
      Risk {it.baselineScore.toFixed(0)}% → {now.toFixed(0)}% ({better ? "improved" : "worse"})
    </span>
  );
}

export function InterventionList({ items, showStudent = false }: { items: Intervention[]; showStudent?: boolean }) {
  const { db } = useScoped();
  if (!items.length) return <EmptyState icon={ClipboardList} title="No interventions yet" text="Record a counseling session, remedial class or mentoring session." />;
  return (
    <ul className="space-y-3">
      {items.map((it) => {
        const s = db.students.find((x) => x.id === it.studentId);
        return (
          <li key={it.id} className="rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{it.type}</span>
                  <span className={statusPill({ status: it.status })}>{it.status}</span>
                </div>
                {showStudent && s && (
                  <Link to="/app/students/$id" params={{ id: s.id }} className="text-sm text-primary hover:underline">
                    {s.name} ({s.id})
                  </Link>
                )}
                <p className="mt-1 text-sm text-muted-foreground">{it.notes}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <Improvement it={it} />
                  <span className="text-xs text-muted-foreground">Started {timeAgo(it.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Select
                  value={it.status}
                  onValueChange={(v) => {
                    actions.updateIntervention(it.id, { status: v as InterventionStatus });
                    toast.success(`Marked ${v}`);
                  }}
                >
                  <SelectTrigger className="h-8 w-36 text-xs" aria-label="Change status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Delete intervention"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    actions.deleteIntervention(it.id);
                    toast.success("Intervention removed");
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
