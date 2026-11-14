import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  BrainCircuit,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  RotateCcw,
  ShieldCheck,
  Sun,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useScoped } from "@/lib/access";
import { setSession } from "@/lib/session";
import { actions } from "@/lib/store";
import { useDarkMode } from "@/lib/theme";
import type { Role } from "@/lib/types";

type NavItem = { to: string; label: string; icon: typeof Users; roles: Role[] };

const NAV: NavItem[] = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "faculty", "student"] },
  { to: "/app/students", label: "Students", icon: Users, roles: ["admin", "faculty"] },
  { to: "/app/predict", label: "AI Early Warning", icon: BrainCircuit, roles: ["admin", "faculty"] },
  { to: "/app/alerts", label: "Alerts", icon: Bell, roles: ["admin", "faculty"] },
  { to: "/app/interventions", label: "Interventions", icon: ClipboardList, roles: ["admin", "faculty"] },
];

function NavList({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const { role, scoped } = useScoped();
  const openAlerts = scoped.alerts.filter((a) => a.status === "open").length;
  return (
    <nav className="flex flex-col gap-1">
      {NAV.filter((n) => n.roles.includes(role)).map((n) => (
        <Link
          key={n.to}
          to={n.to}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
          activeOptions={{ includeSearch: false }}
        >
          <n.icon className="size-4" />
          <span className="flex-1">{n.label}</span>
          {n.to === "/app/alerts" && openAlerts > 0 && (
            <span className="rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
              {openAlerts}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  return (
    <div className="flex h-full flex-col bg-sidebar p-4 text-sidebar-foreground">
      <Link to="/" className="mb-8 flex items-center gap-2.5 px-2 pt-1">
        <div className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <div className="font-display text-base font-bold text-sidebar-accent-foreground">EduGuard AI</div>
          <div className="text-[11px] text-sidebar-foreground/60">Early Warning System</div>
        </div>
      </Link>
      <NavList onNavigate={onNavigate} />
      <div className="mt-auto rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3 text-xs text-sidebar-foreground/70">
        <div className="mb-1 flex items-center gap-1.5 font-semibold text-sidebar-accent-foreground">
          <GraduationCap className="size-3.5" /> Demo mode
        </div>
        Predictions use a clearly labeled demo model. Data is saved in this browser.
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [dark, toggleDark] = useDarkMode();
  const { displayName, subtitle, role } = useScoped();
  const navigate = useNavigate();

  const signOut = () => {
    setSession(null);
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarBody />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 border-0 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu />
          </Button>
          <div className="flex-1" />
          {role === "admin" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                actions.resetDemo();
                toast.success("Demo data restored");
              }}
              className="hidden sm:inline-flex"
            >
              <RotateCcw /> Reset demo
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={toggleDark} aria-label="Toggle dark mode">
            {dark ? <Sun /> : <Moon />}
          </Button>
          <div className="flex items-center gap-3 border-l pl-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
              {displayName.replace(/^(Dr\.|Prof\.)\s*/, "").charAt(0)}
            </div>
            <div className="hidden leading-tight sm:block">
              <div className="text-sm font-semibold">{displayName}</div>
              <div className="text-xs text-muted-foreground">{subtitle}</div>
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut /> <span className="hidden sm:inline">Switch role</span>
            </Button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
