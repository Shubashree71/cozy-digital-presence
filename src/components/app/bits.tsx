import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ShieldOff } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const statIcon = cva("flex size-11 items-center justify-center rounded-xl", {
  variants: {
    tone: {
      primary: "bg-secondary text-primary",
      sky: "bg-accent text-sky",
      success: "bg-success-soft text-success",
      warning: "bg-warning-soft text-warning",
      danger: "bg-danger-soft text-danger",
    },
  },
  defaultVariants: { tone: "primary" },
});

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  delay = 0,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: LucideIcon;
  delay?: number;
} & VariantProps<typeof statIcon>) {
  return (
    <div className="surface animate-fade-up p-5" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={statIcon({ tone })}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("surface animate-fade-up p-5", className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function NoAccess({ message }: { message?: string | undefined }) {
  return (
    <div className="surface mx-auto mt-10 max-w-md p-8 text-center">
      <ShieldOff className="mx-auto size-10 text-muted-foreground" />
      <h2 className="mt-3 text-lg font-semibold">No access</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {message ?? "Your role doesn't have permission to view this page."}
      </p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="mt-3 font-medium">{title}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

export const chartColors = {
  primary: "var(--chart-1)",
  sky: "var(--chart-2)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  grid: "var(--border)",
  axis: "var(--muted-foreground)",
};

export const tooltipStyle = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    color: "var(--popover-foreground)",
    fontSize: 12,
  },
  labelStyle: { color: "var(--popover-foreground)", fontWeight: 600 },
};

export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? "yesterday" : `${d}d ago`;
}
