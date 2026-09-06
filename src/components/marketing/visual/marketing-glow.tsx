import { cn } from "@/lib/utils";

/**
 * A single soft wash of stage light from the top of a section.
 *
 * This used to be a pair of pulsing purple orbs. It is kept as a named
 * component because the de-emphasised marketing pages still call it, but it now
 * borrows the surrounding world's accent at low opacity and does not animate —
 * light falling into a room, not a SaaS gradient.
 */
export function MarketingGlow({
  className,
  variant = "primary",
}: {
  className?: string;
  variant?: "primary" | "accent" | "warm";
}) {
  const wash = {
    primary:
      "radial-gradient(ellipse 60% 42% at 50% -8%, color-mix(in srgb, var(--world-accent) 9%, transparent), transparent 70%)",
    accent:
      "radial-gradient(ellipse 55% 40% at 22% -6%, color-mix(in srgb, var(--world-accent) 11%, transparent), transparent 70%)",
    warm: "radial-gradient(ellipse 58% 40% at 50% 106%, color-mix(in srgb, var(--world-red) 10%, transparent), transparent 70%)",
  } as const;

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{ background: wash[variant] }}
    />
  );
}
