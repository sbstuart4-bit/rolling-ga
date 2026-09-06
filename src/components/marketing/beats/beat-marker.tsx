import { cn } from "@/lib/utils";

/**
 * Editorial furniture instead of section chrome: a hairline, a number, a label.
 * It gives the page structure a reader can feel without introducing a card.
 */
export function BeatMarker({
  n,
  label,
  className,
}: {
  n: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline gap-5 border-t border-world-rule pt-4", className)}>
      <span className="mk-kicker text-world-accent">{n}</span>
      <span className="mk-kicker text-world-muted">{label}</span>
    </div>
  );
}
