import { Link } from "@tanstack/react-router";
import { AlertTriangle, BellRing, ClipboardList, Users } from "lucide-react";
import { useScoped } from "@/lib/access";
import { PageHeader, Panel, StatCard, timeAgo } from "../bits";
import { StudentFilters, StudentTable, useStudentFilter } from "../student-table";
import { RiskPie, useAnalytics } from "./admin-dashboard";

export function FacultyDashboard() {
  const { scoped, displayName } = useScoped();
  const a = useAnalytics();
  const { filters, setFilters, rows } = useStudentFilter(scoped.students);
  const openAlerts = scoped.alerts.filter((x) => x.status === "open");
  const activeInt = scoped.interventions.filter((i) => i.status !== "Completed").length;

  return (
    <>
      <PageHeader title={`Hello, ${displayName.split(" ").slice(0, 2).join(" ")}`} description="Your assigned students and their current risk." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assigned students" value={a.rows.length} icon={Users} tone="primary" />
        <StatCard label="High risk" value={a.high} icon={AlertTriangle} tone="danger" delay={50} />
        <StatCard label="Open alerts" value={openAlerts.length} icon={BellRing} tone="warning" delay={100} />
        <StatCard label="Active interventions" value={activeInt} icon={ClipboardList} tone="sky" delay={150} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="My students" className="lg:col-span-3">
          <div className="mb-4">
            <StudentFilters filters={filters} setFilters={setFilters} showDept={false} />
          </div>
          <StudentTable rows={rows} showDept={false} />
        </Panel>
        <Panel title="Risk distribution">
          <RiskPie high={a.high} medium={a.medium} low={a.low} />
        </Panel>
        <Panel title="Open alerts" className="lg:col-span-2" actions={<Link to="/app/alerts" className="text-sm font-medium text-primary hover:underline">Manage</Link>}>
          {openAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open alerts. 🎉</p>
          ) : (
            <ul className="divide-y">
              {openAlerts.slice(0, 5).map((al) => {
                const s = scoped.students.find((x) => x.id === al.studentId);
                return (
                  <li key={al.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="font-medium">{s?.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{al.reasons.slice(0, 2).join(" · ")}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-display font-bold text-danger">{al.score.toFixed(0)}%</div>
                      <div className="text-xs text-muted-foreground">{timeAgo(al.createdAt)}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
