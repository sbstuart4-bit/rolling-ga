import { Check } from "lucide-react";
import { formatDateTime, formatEventDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Credential page hero — glowing check, headline, and show metadata.
 * Fresh verification gets the full celebration; return visits stay calmer but upgraded.
 */
export function CredentialCelebrationHeader({
  artistName,
  city,
  venueName,
  startsAt,
  timezone,
  verifiedAt,
  fresh,
  className,
}: {
  artistName: string;
  city: string;
  venueName: string;
  startsAt: Date;
  timezone: string;
  verifiedAt: Date;
  fresh: boolean;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "relative space-y-5 pb-2 text-center",
        fresh && "celebration-enter",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/4 rounded-full bg-artist-accent blur-3xl",
          fresh
            ? "celebration-glow size-64 opacity-100"
            : "size-48 opacity-30",
        )}
        aria-hidden
      />

      <div
        className={cn(
          "relative flex justify-center pt-2",
          fresh && "celebration-enter-item",
        )}
      >
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full border-2 border-artist-accent bg-artist-accent/10",
            fresh
              ? "size-20 shadow-[0_0_40px_color-mix(in_srgb,var(--artist-accent)_45%,transparent),0_0_80px_color-mix(in_srgb,var(--artist-accent)_15%,transparent)]"
              : "size-14 shadow-[0_0_24px_color-mix(in_srgb,var(--artist-accent)_30%,transparent)]",
          )}
        >
          <Check
            className={cn(
              "stroke-[2.5] text-artist-accent",
              fresh ? "size-9" : "size-6",
            )}
            aria-hidden
          />
        </div>
      </div>

      <div className={cn("space-y-3", fresh && "celebration-enter-item")}>
        <h1
          className={cn(
            "display-xl font-artist text-artist-fg",
            fresh ? "text-5xl md:text-6xl" : "text-4xl md:text-5xl",
          )}
        >
          {fresh ? "You\u2019re in." : "You were there."}
        </h1>
        <p className="text-sm text-artist-muted text-balance">
          {fresh
            ? "Tonight\u2019s experience is unlocked."
            : `Verified ${formatDateTime(verifiedAt, timezone)}.`}
        </p>
      </div>

      <div
        className={cn(
          "mx-auto max-w-xs rounded-xl border border-artist-accent/30 bg-artist-surface/60 px-5 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
          fresh && "celebration-enter-item",
        )}
      >
        <p className="eyebrow text-artist-accent">{artistName}</p>
        <p className="display-xl mt-1 font-artist text-2xl text-artist-fg">{city}</p>
        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-artist-muted">
          {venueName} &middot; {formatEventDateShort(startsAt, timezone)}
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-artist-accent/35 bg-artist-accent/15 px-2.5 py-1">
          <Check className="size-3 stroke-[2.5] text-artist-accent" aria-hidden />
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-artist-accent">
            Verified attendee
          </span>
        </div>
      </div>
    </header>
  );
}
