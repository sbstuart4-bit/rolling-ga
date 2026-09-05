import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SplitCompare({
  left,
  right,
  leftLabel,
  rightLabel,
  className,
}: {
  left: ReactNode;
  right: ReactNode;
  leftLabel: string;
  rightLabel: string;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 md:gap-6", className)}>
      <ComparePanel label={leftLabel}>{left}</ComparePanel>
      <ComparePanel label={rightLabel} accent>
        {right}
      </ComparePanel>
    </div>
  );
}

function ComparePanel({
  label,
  children,
  accent = false,
}: {
  label: string;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "deck-card overflow-hidden rounded-2xl",
        accent ? "border-primary/30 bg-primary/5" : "border-white/10 bg-[#101012]",
      )}
    >
      <p
        className={cn(
          "border-b px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em]",
          accent ? "border-primary/20 text-primary" : "border-white/8 text-muted-foreground",
        )}
      >
        {label}
      </p>
      <div className="p-4">{children}</div>
    </div>
  );
}
