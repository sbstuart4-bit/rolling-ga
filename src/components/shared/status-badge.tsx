import { cn } from "@/lib/utils";
import type { StatusLevel } from "@/lib/types";

const styles: Record<StatusLevel, string> = {
  green: "bg-success/15 text-success border-success/25",
  yellow: "bg-warning/20 text-warning-foreground border-warning/30 dark:text-warning",
  red: "bg-danger/15 text-danger border-danger/25",
};

const dotStyles: Record<StatusLevel, string> = {
  green: "bg-success",
  yellow: "bg-warning",
  red: "bg-danger",
};

const labels: Record<StatusLevel, string> = {
  green: "Excellent",
  yellow: "Moderate Risk",
  red: "High Risk",
};

export function StatusBadge({
  status,
  label,
  className,
  pulse = false,
}: {
  status: StatusLevel;
  label?: string;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        styles[status],
        className
      )}
    >
      <span
        className={cn(
          "relative size-1.5 rounded-full",
          dotStyles[status],
          pulse && "status-dot-pulse"
        )}
        style={{ color: `var(--${status === "green" ? "success" : status === "yellow" ? "warning" : "danger"})` }}
      />
      {label ?? labels[status]}
    </span>
  );
}

export function StatusDot({ status, className, pulse }: { status: StatusLevel; className?: string; pulse?: boolean }) {
  return (
    <span
      className={cn("relative inline-block size-2.5 rounded-full", dotStyles[status], pulse && "status-dot-pulse", className)}
      style={{ color: `var(--${status === "green" ? "success" : status === "yellow" ? "warning" : "danger"})` }}
    />
  );
}
