import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useScoped } from "@/lib/access";
import { predictRisk } from "@/lib/risk-model";
import { actions } from "@/lib/store";
import { DEPARTMENTS, type Student } from "@/lib/types";
import { RiskBadge } from "./risk";

const pct = z.coerce.number({ invalid_type_error: "Enter a number" }).min(0, "0–100").max(100, "0–100");
const schema = z.object({
  id: z.string().trim().min(2, "Required").max(20).regex(/^[A-Za-z0-9-]+$/, "Letters, numbers, dashes"),
  name: z.string().trim().min(2, "Required").max(80),
  email: z.string().trim().email("Invalid email").max(120),
  department: z.string().min(1, "Required"),
  semester: z.coerce.number().int().min(1, "1–8").max(8, "1–8"),
  facultyId: z.string().min(1, "Required"),
  attendance: pct,
  assignment: pct,
  quiz: pct,
  internal: pct,
  previous: pct,
});

type Form = Record<keyof z.infer<typeof schema>, string>;

const empty = (facultyId: string, department: string): Form => ({
  id: "",
  name: "",
  email: "",
  department,
  semester: "1",
  facultyId,
  attendance: "",
  assignment: "",
  quiz: "",
  internal: "",
  previous: "",
});

export function StudentFormDialog({
  open,
  onOpenChange,
  student,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  student?: Student | undefined;
}) {
  const { db, role, userId } = useScoped();
  const myFaculty = db.faculty.find((f) => f.id === userId);
  const fallback = db.faculty[0]!;
  const [form, setForm] = useState<Form>(() => empty(myFaculty?.id ?? fallback.id, myFaculty?.department ?? DEPARTMENTS[0]));
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (student) {
      setForm(Object.fromEntries(Object.entries(student).map(([k, v]) => [k, String(v)])) as Form);
    } else {
      const f = myFaculty ?? fallback;
      setForm(empty(f.id, f.department));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, student?.id]);

  const set = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const parsed = schema.safeParse(form);
  const preview = parsed.success ? predictRisk(parsed.data) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) {
      const errs: Partial<Record<keyof Form, string>> = {};
      r.error.issues.forEach((i) => (errs[i.path[0] as keyof Form] = i.message));
      setErrors(errs);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSaving(true);
    await new Promise((res) => setTimeout(res, 350));
    try {
      if (student) {
        actions.updateStudent(student.id, r.data);
        toast.success(`${r.data.name}'s record updated`);
      } else {
        actions.addStudent({ ...r.data, id: r.data.id.toUpperCase() });
        toast.success(`${r.data.name} added`);
      }
      const p = predictRisk(r.data);
      if (p.level === "High") toast.warning(`High-risk alert raised for ${r.data.name} (${p.score.toFixed(0)}%)`);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const field = (k: keyof Form, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`f-${k}`}>{label}</Label>
      <Input
        id={`f-${k}`}
        value={form[k]}
        onChange={(e) => set(k)(e.target.value)}
        aria-invalid={!!errors[k]}
        className={errors[k] ? "border-destructive" : ""}
        {...props}
      />
      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{student ? `Edit ${student.name}` : "Add student"}</DialogTitle>
          <DialogDescription>All academic values are percentages from 0 to 100.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("id", "Student ID", { disabled: !!student, placeholder: "STU031" })}
            {field("name", "Student name", { placeholder: "Full name" })}
            {field("email", "Email", { type: "email", placeholder: "name@student.eduguard.edu" })}
            {field("semester", "Semester", { type: "number", min: 1, max: 8 })}
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={form.department} onValueChange={set("department")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assigned faculty</Label>
              <Select value={form.facultyId} onValueChange={set("facultyId")} disabled={role === "faculty"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {db.faculty.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {field("attendance", "Attendance %", { type: "number", inputMode: "decimal" })}
            {field("assignment", "Assignment completion %", { type: "number" })}
            {field("quiz", "Quiz average %", { type: "number" })}
            {field("internal", "Internal marks %", { type: "number" })}
            {field("previous", "Previous performance %", { type: "number" })}
          </div>
          <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 text-sm">
            <span className="text-muted-foreground">Predicted risk</span>
            {preview ? (
              <span className="flex items-center gap-2 font-semibold">
                {preview.score.toFixed(0)}% <RiskBadge level={preview.level} />
              </span>
            ) : (
              <span className="text-muted-foreground">Fill in all fields</span>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : student ? "Save changes" : "Add student"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
