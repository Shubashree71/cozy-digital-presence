import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, GraduationCap, ShieldCheck, UserCog, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ADMIN_USER } from "@/lib/seed";
import { setSession } from "@/lib/session";
import { useDB } from "@/lib/store";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login – EduGuard AI" },
      { name: "description", content: "Choose a role to explore the EduGuard AI student early warning demo." },
      { property: "og:title", content: "Login – EduGuard AI" },
      { property: "og:description", content: "Sign in as an administrator, faculty member or student." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

const ROLES: { role: Role; title: string; text: string; icon: typeof Users }[] = [
  { role: "admin", title: "Administrator", text: "Institution-wide analytics, all students, all alerts.", icon: UserCog },
  { role: "faculty", title: "Faculty", text: "Your assigned students, alerts and interventions.", icon: Users },
  { role: "student", title: "Student", text: "Your own performance and improvement tips.", icon: GraduationCap },
];

function Login() {
  const db = useDB();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("admin");
  const [facultyId, setFacultyId] = useState(db.faculty[0].id);
  const [studentId, setStudentId] = useState("STU001");
  const [loading, setLoading] = useState(false);

  const enter = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    const userId = role === "admin" ? ADMIN_USER.id : role === "faculty" ? facultyId : studentId;
    setSession({ role, userId });
    toast.success(`Signed in as ${ROLES.find((r) => r.role === role)!.title}`);
    navigate({ to: "/app/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4 py-10">
      <div className="surface w-full max-w-lg animate-fade-up p-6 sm:p-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </div>
          <span className="font-display text-lg font-bold">EduGuard AI</span>
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Demo sign-in — pick a role to explore. No password needed.</p>

        <div className="mt-6 grid gap-3" role="radiogroup" aria-label="Role">
          {ROLES.map((r) => (
            <button
              key={r.role}
              type="button"
              role="radio"
              aria-checked={role === r.role}
              onClick={() => setRole(r.role)}
              className={cn(
                "flex items-center gap-4 rounded-xl border p-4 text-left transition-all",
                role === r.role ? "border-primary bg-secondary ring-2 ring-ring/40" : "hover:bg-muted",
              )}
            >
              <div className={cn("flex size-10 items-center justify-center rounded-lg", role === r.role ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                <r.icon className="size-5" />
              </div>
              <div>
                <div className="font-semibold">{r.title}</div>
                <div className="text-xs text-muted-foreground">{r.text}</div>
              </div>
            </button>
          ))}
        </div>

        {role === "faculty" && (
          <div className="mt-5 space-y-1.5">
            <Label>Faculty member</Label>
            <Select value={facultyId} onValueChange={setFacultyId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {db.faculty.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name} — {f.department}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {role === "student" && (
          <div className="mt-5 space-y-1.5">
            <Label>Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {db.students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} ({s.id})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button variant="hero" size="lg" className="mt-6 w-full" onClick={enter} disabled={loading}>
          {loading ? "Signing in…" : "Continue"} <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
