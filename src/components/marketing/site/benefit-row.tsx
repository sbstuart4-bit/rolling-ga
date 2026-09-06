import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MktBenefit {
  icon: LucideIcon;
  label: string;
}

/** Four-icon benefit row under the homepage hero — mockup pattern. */
export function MktBenefitRow({
  items,
  className,
  light,
}: {
  items: readonly MktBenefit[];
  className?: string;
  /** Icons on white sections use dark strokes. */
  light?: boolean;
}) {
  return (
    <ul
      className={cn(
        "grid gap-8 sm:grid-cols-2 lg:grid-cols-4",
        light ? "text-[#0a0a0a]" : "text-mkt-fg",
        className,
      )}
    >
      {items.map(({ icon: Icon, label }) => (
        <li key={label} className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <span
            className={cn(
              "mb-4 flex size-12 items-center justify-center rounded-full border",
              light ? "border-black/15 text-[#0a0a0a]" : "border-white/20 text-mkt-fg",
            )}
          >
            <Icon className="size-5" strokeWidth={1.5} aria-hidden />
          </span>
          <p className="text-[0.6875rem] font-semibold uppercase leading-snug tracking-[0.14em]">
            {label}
          </p>
        </li>
      ))}
    </ul>
  );
}
