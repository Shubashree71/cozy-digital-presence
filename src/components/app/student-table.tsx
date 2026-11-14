import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { predictRisk, type RiskLevel } from "@/lib/risk-model";
import { DEPARTMENTS, type Student } from "@/lib/types";
import { EmptyState } from "./bits";
import { Meter, RiskBadge, riskText } from "./risk";

export type Filters = { q: string; dept: string; risk: "all" | RiskLevel };

export function useStudentFilter(students: Student[]) {
  const [filters, setFilters] = useState<Filters>({ q: "", dept: "all", risk: "all" });
  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return students
      .map((s) => ({ s, p: predictRisk(s) }))
      .filter(({ s, p }) => {
        if (q && !s.name.toLowerCase().includes(q) && !s.id.toLowerCase().includes(q)) return false;
        if (filters.dept !== "all" && s.department !== filters.dept) return false;
        if (filters.risk !== "all" && p.level !== filters.risk) return false;
        return true;
      })
      .sort((a, b) => b.p.score - a.p.score);
  }, [students, filters]);
  return { filters, setFilters, rows };
}

export function StudentFilters({
  filters,
  setFilters,
  showDept = true,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  showDept?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or ID…"
          className="pl-9"
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          aria-label="Search students"
        />
      </div>
      {showDept && (
        <Select value={filters.dept} onValueChange={(v) => setFilters({ ...filters, dept: v })}>
          <SelectTrigger className="sm:w-48" aria-label="Department"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      <Select value={filters.risk} onValueChange={(v) => setFilters({ ...filters, risk: v as Filters["risk"] })}>
        <SelectTrigger className="sm:w-40" aria-label="Risk level"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All risk levels</SelectItem>
          <SelectItem value="High">High risk</SelectItem>
          <SelectItem value="Medium">Medium risk</SelectItem>
          <SelectItem value="Low">Low risk</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function StudentTable({
  rows,
  actions,
  showDept = true,
}: {
  rows: { s: Student; p: ReturnType<typeof predictRisk> }[];
  actions?: (s: Student) => ReactNode;
  showDept?: boolean;
}) {
  if (rows.length === 0) return <EmptyState icon={Users} title="No students match" text="Try a different search or filter." />;
  return (
    <div className="-mx-5 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5">Student</TableHead>
            {showDept && <TableHead>Department</TableHead>}
            <TableHead className="w-28">Attendance</TableHead>
            <TableHead className="w-28">Assignments</TableHead>
            <TableHead className="w-24">Quiz avg</TableHead>
            <TableHead className="w-24">Internal</TableHead>
            <TableHead>Risk score</TableHead>
            <TableHead>Status</TableHead>
            {actions && <TableHead className="pr-5 text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ s, p }) => (
            <TableRow key={s.id}>
              <TableCell className="pl-5">
                <Link to="/app/students/$id" params={{ id: s.id }} className="group">
                  <div className="font-semibold group-hover:text-primary group-hover:underline">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.id} · Sem {s.semester}</div>
                </Link>
              </TableCell>
              {showDept && <TableCell className="text-sm text-muted-foreground">{s.department}</TableCell>}
              <TableCell>
                <div className="text-sm font-medium">{s.attendance}%</div>
                <Meter value={s.attendance} />
              </TableCell>
              <TableCell>
                <div className="text-sm font-medium">{s.assignment}%</div>
                <Meter value={s.assignment} />
              </TableCell>
              <TableCell className="text-sm">{s.quiz}%</TableCell>
              <TableCell className="text-sm">{s.internal}%</TableCell>
              <TableCell>
                <span className={`font-display text-base font-bold ${riskText({ level: p.level })}`}>{p.score.toFixed(0)}%</span>
              </TableCell>
              <TableCell><RiskBadge level={p.level} /></TableCell>
              {actions && <TableCell className="pr-5 text-right">{actions(s)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
