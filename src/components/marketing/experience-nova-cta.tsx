"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * Primary marketing CTA — launches the Marisol Reyes guided demo when the gate
 * allows, otherwise falls back to /demo.
 */
export function ExperienceNovaButton({
  size = "default",
  compact = false,
  label,
  className,
}: {
  size?: "default" | "large";
  compact?: boolean;
  label?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const resolvedLabel =
    label ?? (compact ? "See the Artist Demo" : "See the Artist Demo");

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-full bg-mkt-purple font-semibold uppercase tracking-[0.12em] text-mkt-purple-fg transition-opacity hover:opacity-90 disabled:opacity-70",
        compact
          ? "px-5 py-2.5 text-[0.6875rem]"
          : size === "large"
            ? "px-8 py-4 text-sm"
            : "px-7 py-3.5 text-xs",
        className,
      )}
    >
      {pending ? "Loading\u2026" : resolvedLabel}
      {!pending ? (
        <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
          &rarr;
        </span>
      ) : null}
    </button>
  );
}
