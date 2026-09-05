import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DeckStat({
  value,
  label,
  detail,
  featured = false,
  className,
  trailing,
}: {
  value: ReactNode;
  label: string;
  detail?: string;
  featured?: boolean;
  className?: string;
  trailing?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "deck-card rounded-2xl p-6",
        featured ? "border-primary/40 bg-primary/10" : "border-white/10 bg-[#161618]",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-display text-5xl leading-none tabular sm:text-6xl">{value}</p>
        {trailing}
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      {detail ? <p className="mt-2 text-sm text-muted-foreground">{detail}</p> : null}
    </div>
  );
}
