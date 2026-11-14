import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, CalendarCheck, ClipboardCheck, Smile, TriangleAlert, Users } from "lucide-react";
import { useScoped } from "@/lib/access";
import { predictRisk } from "@/lib/risk-model";
import { monthlyAttendance, MONTHS } from "@/lib/seed";
import { DEPARTMENTS } from "@/lib/types";
import { chartColors, PageHeader, Panel, StatCard, timeAgo, tooltipStyle } from "../bits";
import { RiskBadge } from "../risk";

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function useAnalytics() {
  const { scoped } = useScoped();
  return useMemo(() => {
    const rows = scoped.students.map((s) => ({ s, p: predictRisk(s) }));
    const count = (l: string) => rows.filter((r) => r.p.level === l).length;
    const high = count("High");
    const medium = count("Medium");
    const low = count("Low");
    const attendance = avg(rows.map((r) => r.s.attendance));
    const assignment = avg(rows.map((r) => r.s.assignment));
    const trends = rows.map((r) => monthlyAttendance(r.s));
    const monthly = MONTHS.map((m, i) => ({
      month: m,
      attendance: Math.round(avg(trends.map((t) => t[i] ?? 0))),
      atRisk: Math.round(avg(rows.filter((r) => r.p.level === "High").map((r) => monthlyAttendance(r.s)[i] ?? 0))),
    }));
    const byDept = DEPARTMENTS.map((d) => {
      const dr = rows.filter((r) => r.s.department === d);
      return {
        dept: d.replace("Information Tech", "IT").replace("Computer Science", "CS"),
        High: dr.filter((r) => r.p.level === "High").length,
        Medium: dr.filter((r) => r.p.level === "Medium").length,
        Low: dr.filter((r) => r.p.level === "Low").length,
        Attendance: Math.round(avg(dr.map((r) => r.s.attendance))),
        Assignments: Math.round(avg(dr.map((r) => r.s.assignment))),
        Quiz: Math.round(avg(dr.map((r) => r.s.quiz))),
        Internal: Math.round(avg(dr.map((r) => r.s.internal))),
      };
    }).filter((d) => d.High + d.Medium + d.Low > 0);
    return { rows, high, medium, low, attendance, assignment, monthly, byDept };
  }, [scoped.students]);
}

export function RiskPie({ high, medium, low }: { high: number; medium: number; low: number }) {
  const data = [
    { name: "High risk", value: high, color: chartColors.danger },
    { name: "Medium risk", value: medium, color: chartColors.warning },
    { name: "Low risk", value: low, color: chartColors.success },
  ];
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3} stroke="none">
          {data.map((d) => <Cell key={d.name} fill={d.color} />)}
        </Pie>
        <Tooltip {...tooltipStyle} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function AttendanceLine({ data }: { data: { month: string; attendance: number; atRisk: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ left: -20, right: 10, top: 10 }}>
        <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" stroke={chartColors.axis} fontSize={12} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} stroke={chartColors.axis} fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip {...tooltipStyle} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="attendance" name="All students" stroke={chartColors.sky} strokeWidth={3} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="atRisk" name="High-risk students" stroke={chartColors.danger} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AdminDashboard() {
  const a = useAnalytics();
  const { scoped } = useScoped();
  const total = a.rows.length;
  const top = a.rows.filter((r) => r.p.level === "High").sort((x, y) => y.p.score - x.p.score).slice(0, 5);

  return (
    <>
      <PageHeader title="Institution overview" description="Live academic risk across all departments." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total students" value={total} icon={Users} tone="primary" />
        <StatCard label="High risk" value={a.high} hint={`${total ? Math.round((a.high / total) * 100) : 0}% of students`} icon={AlertTriangle} tone="danger" delay={50} />
        <StatCard label="Medium risk" value={a.medium} icon={TriangleAlert} tone="warning" delay={100} />
        <StatCard label="Performing well" value={a.low} hint="Low risk" icon={Smile} tone="success" delay={150} />
        <StatCard label="Overall attendance" value={`${a.attendance.toFixed(1)}%`} icon={CalendarCheck} tone="sky" delay={200} />
        <StatCard label="Avg. assignment submission" value={`${a.assignment.toFixed(1)}%`} icon={ClipboardCheck} tone="primary" delay={250} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Panel title="Risk distribution" className="lg:col-span-2">
          <RiskPie high={a.high} medium={a.medium} low={a.low} />
        </Panel>
        <Panel title="Monthly attendance trend" description="Sample trend data (synthetic)" className="lg:col-span-3">
          <AttendanceLine data={a.monthly} />
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Academic performance by department" description="Average %">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={a.byDept} margin={{ left: -20, top: 10 }}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="dept" stroke={chartColors.axis} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke={chartColors.axis} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} cursor={{ fill: "var(--muted)" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Attendance" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Assignments" fill={chartColors.sky} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Quiz" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Internal" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Risk distribution by department" description="Number of students">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={a.byDept} margin={{ left: -20, top: 10 }}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="dept" stroke={chartColors.axis} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} stroke={chartColors.axis} fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} cursor={{ fill: "var(--muted)" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="High" stackId="r" fill={chartColors.danger} />
              <Bar dataKey="Medium" stackId="r" fill={chartColors.warning} />
              <Bar dataKey="Low" stackId="r" fill={chartColors.success} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Students needing attention" actions={<Link to="/app/alerts" className="text-sm font-medium text-primary hover:underline">View alerts</Link>}>
          <ul className="divide-y">
            {top.map(({ s, p }) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                <Link to="/app/students/$id" params={{ id: s.id }} className="min-w-0">
                  <div className="truncate font-medium hover:text-primary">{s.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{p.reasons[0]?.message ?? s.department}</div>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-display font-bold text-danger">{p.score.toFixed(0)}%</span>
                  <RiskBadge level={p.level} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Recent activity">
          <ul className="space-y-3">
            {scoped.activities.slice(0, 7).map((act) => (
              <li key={act.id} className="flex gap-3 text-sm">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-sky" />
                <div className="flex-1">{act.text}</div>
                <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(act.at)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
