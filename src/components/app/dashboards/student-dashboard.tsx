import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BookOpenCheck, CalendarCheck, ClipboardCheck, Download, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useScoped } from "@/lib/access";
import { downloadStudentReport } from "@/lib/pdf";
import { FEATURES, predictRisk } from "@/lib/risk-model";
import { monthlyAttendance, MONTHS } from "@/lib/seed";
import { chartColors, NoAccess, PageHeader, Panel, StatCard, tooltipStyle } from "../bits";
import { PredictionCard } from "../prediction-card";

const TIPS: Record<string, string> = {
  attendance: "Aim to attend every class this month — even one extra day a week lifts your attendance quickly.",
  assignment: "Make a weekly checklist of due assignments and submit drafts early to your faculty.",
  quiz: "Review notes for 20 minutes after each lecture and try the practice quizzes.",
  internal: "Join the remedial sessions and ask your faculty for past internal papers.",
  previous: "Revisit earlier core topics with a mentor to close any gaps.",
};

export function StudentDashboard() {
  const { db, scoped, userId } = useScoped();
  const [busy, setBusy] = useState(false);
  const s = scoped.students[0];
  if (!s) return <NoAccess message="We couldn't find your student record. Ask your administrator to add you." />;

  const p = predictRisk(s);
  const peers = db.students.filter((x) => x.department === s.department);
  const avg = (k: keyof typeof s) => Math.round(peers.reduce((a, x) => a + (x[k] as number), 0) / peers.length);
  const compare = FEATURES.map((f) => ({ name: f.label.replace(" performance", "").replace("Assignment completion", "Assignments").replace("Internal exam marks", "Internal"), You: s[f.key], "Dept. average": avg(f.key) }));
  const trend = monthlyAttendance(s).map((v, i) => ({ month: MONTHS[i], attendance: v }));
  const faculty = db.faculty.find((f) => f.id === s.facultyId);
  const tips = p.reasons.length ? p.reasons.map((r) => TIPS[r.feature]) : ["You're on track — keep your current study rhythm and help a classmate."];

  return (
    <>
      <PageHeader
        title={`Hi ${s.name.split(" ")[0]} 👋`}
        description={`${s.department} · Semester ${s.semester} · Mentor: ${faculty?.name ?? "—"}`}
        actions={
          <Button
            variant="outline"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await downloadStudentReport(s, faculty, scoped.interventions);
                toast.success("Report downloaded");
              } catch {
                toast.error("Could not create the PDF");
              } finally {
                setBusy(false);
              }
            }}
          >
            <Download /> {busy ? "Preparing…" : "Download my report"}
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Attendance" value={`${s.attendance}%`} icon={CalendarCheck} tone={s.attendance >= 75 ? "success" : "danger"} />
        <StatCard label="Assignment completion" value={`${s.assignment}%`} icon={ClipboardCheck} tone={s.assignment >= 70 ? "success" : "warning"} delay={50} />
        <StatCard label="Quiz average" value={`${s.quiz}%`} icon={BookOpenCheck} tone={s.quiz >= 60 ? "success" : "warning"} delay={100} />
        <StatCard label="Internal marks" value={`${s.internal}%`} icon={FileText} tone={s.internal >= 60 ? "success" : "warning"} delay={150} />
      </div>
      <div className="mt-6">
        <PredictionCard p={p} title="My current risk status" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="My performance vs department" description="%">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={compare} margin={{ left: -20, top: 10 }}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke={chartColors.axis} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke={chartColors.axis} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} cursor={{ fill: "var(--muted)" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="You" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Dept. average" fill={chartColors.sky} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="My attendance trend" description="Sample trend data (synthetic)">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend} margin={{ left: -20, top: 10, right: 10 }}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke={chartColors.axis} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke={chartColors.axis} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="attendance" stroke={chartColors.sky} strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>
      <Panel title="Personalized improvement suggestions" className="mt-6">
        <ul className="grid gap-3 sm:grid-cols-2">
          {tips.map((t) => (
            <li key={t} className="flex gap-3 rounded-xl bg-muted p-4 text-sm">
              <Sparkles className="size-4 shrink-0 text-sky" /> {t}
            </li>
          ))}
        </ul>
        {scoped.interventions.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold">Support planned for you</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {scoped.interventions.map((i) => (
                <li key={i.id}>• {i.type} — {i.status}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">Only you and your faculty can see this page. Signed in as {userId}.</p>
      </Panel>
    </>
  );
}
