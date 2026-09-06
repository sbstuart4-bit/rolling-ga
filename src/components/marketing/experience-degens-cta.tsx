"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * The one button on the site. Built as a credential rather than a SaaS pill:
 * square corners, bone or lime laminate, hard black type.
 *
 * Lives inside the form so it can report the redirect into the guided journey —
 * that redirect runs a scenario setup, so silence would read as a dead click.
 */
export function ExperienceDegensButton({
  size = "default",
  compact = false,
  className,
}: {
  size?: "default" | "large";
  /** Header instance: the same action, shortened so it does not shout. */
  compact?: boolean;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const label = compact ? "The Degens \u2014 Detroit" : "Experience The Degens \u2014 Detroit";

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "group inline-flex items-center gap-3 bg-world-accent text-world-accent-fg transition-opacity",
        "font-semibold uppercase tracking-[0.14em] disabled:opacity-70",
        compact
          ? "px-4 py-2.5 text-[0.6875rem] tracking-[0.12em]"
          : size === "large"
            ? "px-7 py-4 text-[0.8125rem]"
            : "px-6 py-3.5 text-[0.75rem]",
        className,
      )}
    >
      {pending ? "Setting the scene\u2026" : label}
      <span
        aria-hidden
        className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
      >
        &rarr;
      </span>
    </button>
  );
}
