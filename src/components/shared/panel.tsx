import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  noPadding = false,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card shadow-soft", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            {title && <h3 className="text-sm font-semibold text-foreground">{title}</h3>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={noPadding ? "" : "p-5"}>{children}</div>
    </section>
  );
}
