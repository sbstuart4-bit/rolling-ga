import Image from "next/image";
import { MapPin } from "lucide-react";
import type { EventRow } from "@/server/events/queries";
import { formatEventDate, formatEventTime } from "@/lib/format";
import { heroImageFor, type ResolvedTheme } from "@/lib/theme";
import type { EventState } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATE_LABEL: Record<EventState, string> = {
  upcoming: "Upcoming",
  live: "Live now",
  recently_ended: "Just ended",
  archived: "Archived",
};

/**
 * The top of every show surface: the artist's own artwork, edge to edge, with the
 * show's facts set over it. Rolling GA supplies the typographic discipline; the imagery
 * is entirely the artist's.
 */
export function EventHero({
  event,
  theme,
  state,
  stateLabel,
  eyebrow,
  children,
}: {
  event: EventRow;
  theme: ResolvedTheme;
  state: EventState;
  /** Override the default lifecycle pill label (e.g. verified post-show tone). */
  stateLabel?: string;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  const hero = heroImageFor(theme);

  return (
    <header className="relative isolate overflow-hidden">
      {hero ? (
        <Image
          src={hero}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-top"
        />
      ) : (
        <div className="absolute inset-0 -z-10 bg-artist-surface" aria-hidden />
      )}
      <div
        className="absolute inset-0 -z-10 hero-gradient-overlay"
        aria-hidden
      />

      <div className="mx-auto flex min-h-[20rem] max-w-lg flex-col justify-end gap-3 px-4 pb-6 pt-20">
        <div className="flex flex-wrap items-center gap-2">
          <StatePill state={state} label={stateLabel} />
          {eyebrow && <span className="eyebrow text-artist-muted">{eyebrow}</span>}
        </div>

        <div className="space-y-1.5">
          <p className="eyebrow font-artist text-artist-accent">{event.artistName}</p>
          <h1 className="display-xl font-artist text-4xl text-artist-fg md:text-6xl">
            {event.venueCity}
          </h1>
          <p className="text-sm text-artist-muted">
            {event.tourName} &middot; {formatEventDate(event.startsAt, event.timezone)}
          </p>
        </div>

        <p className="flex items-center gap-1.5 text-sm text-artist-muted">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span>
            {event.venueName}, {event.venueRegion ?? event.venueCountry} &middot;{" "}
            {formatEventTime(event.startsAt, event.timezone)}
          </span>
        </p>

        {children}
      </div>
    </header>
  );
}

export function StatePill({
  state,
  label,
  className,
}: {
  state: EventState;
  label?: string;
  className?: string;
}) {
  const live = state === "live";
  const verifiedPostShow = label === "You were there";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em]",
        live
          ? "border-artist-accent/40 bg-artist-accent/15 text-artist-accent"
          : verifiedPostShow
            ? "border-artist-accent/30 bg-artist-accent/10 text-artist-accent"
            : "border-artist-border bg-artist-surface/70 text-artist-muted",
        className,
      )}
    >
      {live && (
        <span className="relative inline-flex size-1.5 rounded-full bg-current status-dot-pulse" />
      )}
      {label ?? STATE_LABEL[state]}
    </span>
  );
}
