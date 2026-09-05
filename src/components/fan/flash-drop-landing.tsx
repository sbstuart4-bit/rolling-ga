import { FlashDropHeroCountdown } from "@/components/fan/flash-drop-hero-countdown";
import { cn } from "@/lib/utils";

/**
 * Cinematic header for an active flash drop — encore moment before the product list.
 */
export function FlashDropLanding({
  dropTitle,
  heroProductName,
  endsAt,
  scoped,
  className,
}: {
  dropTitle: string;
  heroProductName?: string | null;
  endsAt: string;
  scoped: boolean;
  className?: string;
}) {
  const headline = heroProductName ?? dropTitle;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border px-5 py-10 text-center",
        scoped
          ? "moment-surface border-artist-accent/30 bg-artist-bg"
          : "border-warning/30 bg-muted/20",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-80",
          scoped
            ? "bg-[radial-gradient(circle_at_50%_30%,rgba(255,46,138,0.14),transparent_65%)]"
            : "bg-[radial-gradient(circle_at_50%_30%,rgba(255,46,138,0.1),transparent_65%)]",
        )}
        aria-hidden
      />

      <div className="relative space-y-5">
        <div className="flex justify-center">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]",
              scoped
                ? "border-artist-accent/40 bg-artist-accent/10 text-artist-accent"
                : "border-warning/40 bg-warning/10 text-warning",
            )}
          >
            <span className="relative flex size-1.5">
              <span
                className={cn(
                  "absolute inline-flex size-full animate-ping rounded-full opacity-70",
                  scoped ? "bg-artist-accent" : "bg-warning",
                )}
              />
              <span
                className={cn(
                  "relative inline-flex size-1.5 rounded-full",
                  scoped ? "bg-artist-accent" : "bg-warning",
                )}
              />
            </span>
            Encore drop unlocked
          </span>
        </div>

        <div className="space-y-2">
          <h2
            className={cn(
              "display-xl font-artist text-3xl leading-none tracking-wide md:text-4xl",
              scoped ? "text-artist-fg" : "text-foreground",
            )}
          >
            {headline}
          </h2>
          {heroProductName && heroProductName !== dropTitle && (
            <p className={cn("text-sm", scoped ? "text-artist-muted" : "text-muted-foreground")}>
              {dropTitle}
            </p>
          )}
        </div>

        <p className={cn("text-xs tracking-wide", scoped ? "text-artist-muted" : "text-muted-foreground")}>
          Available to verified attendees
        </p>

        <FlashDropHeroCountdown endsAt={endsAt} />

        <p className={cn("text-xs", scoped ? "text-artist-muted" : "text-muted-foreground")}>
          This drop closes when the timer hits zero.
        </p>
      </div>
    </section>
  );
}
