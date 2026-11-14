import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, Loader, Plus, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoAccess, PageHeader, Panel, StatCard } from "@/components/app/bits";
import { InterventionDialog, InterventionList } from "@/components/app/interventions";
import { useScoped } from "@/lib/access";
import { predictRisk } from "@/lib/risk-model";

export const Route = createFileRoute("/app/interventions")({
  head: () => ({
    meta: [
      { title: "Intervention Tracking – EduGuard AI" },
      { name: "description", content: "Track counseling, remedial classes and mentoring, and whether risk improves." },
      { property: "og:title", content: "Intervention Tracking – EduGuard AI" },
      { property: "og:description", content: "Track support actions for at-risk students." },
    ],
  }),
  component: InterventionsPage,
});

function InterventionsPage() {
  const { scoped, db, role } = useScoped();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("all");
  if (role === "student") return <NoAccess />;

  const all = [...scoped.interventions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const items = tab === "all" ? all : all.filter((i) => i.status === tab);
  const by = (s: string) => all.filter((i) => i.status === s).length;
  const completed = all.filter((i) => i.status === "Completed");
  const improved = completed.filter((i) => {
    const s = db.students.find((x) => x.id === i.studentId);
    return s && predictRisk(s).score < i.baselineScore - 1;
  }).length;

  return (
    <>
      <PageHeader
        title="Intervention tracking"
        description="Record actions taken and see whether student risk improves afterwards."
        actions={<Button onClick={() => setOpen(true)}><Plus /> Record intervention</Button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending" value={by("Pending")} icon={Clock} tone="primary" />
        <StatCard label="In progress" value={by("In Progress")} icon={Loader} tone="sky" delay={50} />
        <StatCard label="Completed" value={by("Completed")} icon={CheckCircle2} tone="success" delay={100} />
        <StatCard label="Improved after completion" value={completed.length ? `${Math.round((improved / completed.length) * 100)}%` : "—"} hint={`${improved} of ${completed.length} completed`} icon={TrendingDown} tone="success" delay={150} />
      </div>
      <Panel className="mt-6">
        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList>
            <TabsTrigger value="all">All ({all.length})</TabsTrigger>
            <TabsTrigger value="Pending">Pending</TabsTrigger>
            <TabsTrigger value="In Progress">In progress</TabsTrigger>
            <TabsTrigger value="Completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        <InterventionList items={items} showStudent />
      </Panel>
      <InterventionDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
