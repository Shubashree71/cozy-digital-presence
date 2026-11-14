import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/components/app/dashboards/admin-dashboard";
import { FacultyDashboard } from "@/components/app/dashboards/faculty-dashboard";
import { StudentDashboard } from "@/components/app/dashboards/student-dashboard";
import { useScoped } from "@/lib/access";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard – EduGuard AI" },
      { name: "description", content: "Student risk overview, attendance trends and academic performance." },
      { property: "og:title", content: "Dashboard – EduGuard AI" },
      { property: "og:description", content: "Student risk overview and analytics." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { role } = useScoped();
  if (role === "admin") return <AdminDashboard />;
  if (role === "faculty") return <FacultyDashboard />;
  return <StudentDashboard />;
}
