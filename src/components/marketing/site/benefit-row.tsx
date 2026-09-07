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
  size = "default",
}: {
  items: readonly MktBenefit[];
  className?: string;
  /** Icons on white sections use dark strokes. */
  light?: boolean;
  size?: "default" | "large";
}) {
  const isLarge = size === "large";

  return (
    <ul
      className={cn(
        "grid gap-10 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4",
        isLarge && "gap-14 sm:gap-10",
        light ? "text-[#0a0a0a]" : "text-mkt-fg",
        className,
      )}
    >
      {items.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className={cn(
            "flex flex-col items-center text-center sm:items-start sm:text-left",
            isLarge && "items-start text-left",
          )}
        >
          <span
            className={cn(
              "flex items-center justify-center rounded-full border",
              isLarge
                ? "mb-5 size-[5.75rem] border-2 sm:mb-5 sm:size-[4.75rem] sm:border lg:size-[4.5rem]"
                : "mb-4 size-12",
              light ? "border-black/15 text-[#0a0a0a]" : "border-white/20 text-mkt-fg",
            )}
          >
            <Icon
              className={isLarge ? "size-11 sm:size-8" : "size-5"}
              strokeWidth={isLarge ? 1.75 : 1.5}
              aria-hidden
            />
          </span>
          <p
            className={cn(
              "font-semibold uppercase leading-snug",
              isLarge
                ? "max-w-[18rem] text-lg tracking-[0.08em] sm:max-w-none sm:text-base sm:tracking-[0.12em]"
                : "text-[0.6875rem] tracking-[0.14em]",
            )}
          >
            {label}
          </p>
        </li>
      ))}
    </ul>
  );
}
