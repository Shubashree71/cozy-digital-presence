import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { getSession } from "@/lib/session";

export const Route = createFileRoute("/app")({
  ssr: false,
  beforeLoad: () => {
    if (!getSession()) throw redirect({ to: "/login" });
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
