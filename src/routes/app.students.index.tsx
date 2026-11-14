import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileDown, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { NoAccess, PageHeader, Panel } from "@/components/app/bits";
import { StudentFormDialog } from "@/components/app/student-form-dialog";
import { StudentFilters, StudentTable, useStudentFilter } from "@/components/app/student-table";
import { useScoped } from "@/lib/access";
import { CSV_COLUMNS, downloadFile, parseStudentsCSV, studentsToCSV, toCSV } from "@/lib/csv";
import { predictRisk } from "@/lib/risk-model";
import { actions } from "@/lib/store";
import type { Student } from "@/lib/types";

export const Route = createFileRoute("/app/students/")({
  head: () => ({
    meta: [
      { title: "Student Management – EduGuard AI" },
      { name: "description", content: "Add, edit, import and export student academic records." },
      { property: "og:title", content: "Student Management – EduGuard AI" },
      { property: "og:description", content: "Manage student academic records." },
    ],
  }),
  component: StudentsPage,
});

function StudentsPage() {
  const { scoped, role, db, userId } = useScoped();
  const { filters, setFilters, rows } = useStudentFilter(scoped.students);
  const [editing, setEditing] = useState<Student | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Student | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (role === "student") return <NoAccess />;
  const isAdmin = role === "admin";
  const me = db.faculty.find((f) => f.id === userId);

  const onImport = async (file: File) => {
    if (!/\.csv$/i.test(file.name)) {
      toast.error("Please choose a .csv file (in Excel: File → Save As → CSV).");
      return;
    }
    setImporting(true);
    try {
      const text = await file.text();
      const { rows: parsed, errors } = parseStudentsCSV(text, {
        department: me?.department ?? db.faculty[0].department,
        facultyId: me?.id ?? db.faculty[0].id,
      });
      if (!parsed.length) {
        toast.error(errors[0] ?? "No valid rows found");
        return;
      }
      const res = actions.importStudents(parsed);
      toast.success(`Imported: ${res.added} added, ${res.updated} updated`);
      if (errors.length) toast.warning(`${errors.length} row(s) skipped`, { description: errors.slice(0, 3).join("\n") });
    } catch {
      toast.error("Could not read that file");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <PageHeader
        title="Student management"
        description={isAdmin ? "All student academic records." : "Records for students assigned to you."}
        actions={
          <>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
            {isAdmin && (
              <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importing}>
                <Upload /> {importing ? "Importing…" : "Import CSV"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                downloadFile("eduguard_students.csv", studentsToCSV(rows.map((r) => r.s), predictRisk));
                toast.success(`Exported ${rows.length} records`);
              }}
            >
              <Download /> Export CSV
            </Button>
            <Button onClick={() => { setEditing(undefined); setFormOpen(true); }}>
              <Plus /> Add student
            </Button>
          </>
        }
      />
      <Panel>
        <div className="mb-4 flex flex-col gap-3">
          <StudentFilters filters={filters} setFilters={setFilters} showDept={isAdmin} />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{rows.length} of {scoped.students.length} students · sorted by risk</span>
            {isAdmin && (
              <button
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                onClick={() => downloadFile("eduguard_template.csv", toCSV([[...CSV_COLUMNS], ["STU031", "New Student", "new.student@student.eduguard.edu", "Computer Science", 3, "FAC01", 80, 75, 70, 72, 74]]))}
              >
                <FileDown className="size-3.5" /> CSV template
              </button>
            )}
          </div>
        </div>
        <StudentTable
          rows={rows}
          showDept={isAdmin}
          actions={(s) => (
            <div className="flex justify-end gap-1">
              <Button size="icon" variant="ghost" aria-label={`Edit ${s.name}`} onClick={() => { setEditing(s); setFormOpen(true); }}>
                <Pencil />
              </Button>
              {isAdmin && (
                <Button size="icon" variant="ghost" aria-label={`Delete ${s.name}`} onClick={() => setToDelete(s)} className="text-destructive hover:text-destructive">
                  <Trash2 />
                </Button>
              )}
            </div>
          )}
        />
      </Panel>

      <StudentFormDialog open={formOpen} onOpenChange={setFormOpen} student={editing} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the student along with their alerts and interventions. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (toDelete) {
                  actions.deleteStudent(toDelete.id);
                  toast.success(`${toDelete.name} deleted`);
                }
                setToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
