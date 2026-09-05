import Link from "next/link";
import { formatEventDate } from "@/lib/format";
import type { CommerceEventContext } from "@/server/commerce/attribution";

/**
 * Subtle show context for cart and checkout — Rolling GA chrome, not ArtistTakeover.
 */
export function EventCommerceContextCard({
  context,
  variant = "default",
}: {
  context: CommerceEventContext;
  variant?: "default" | "compact";
}) {
  const dateLabel = formatEventDate(context.startsAt, context.timezone);

  if (variant === "compact") {
    return (
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
        <p className="text-muted-foreground">
          From tonight&apos;s show:{" "}
          <span className="font-medium text-foreground">
            {context.artistName} at {context.venueCity}
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      <p className="eyebrow mb-2 text-primary">Tonight&apos;s Drop</p>
      <div className="space-y-0.5">
        <p className="font-medium">{context.artistName}</p>
        <p className="text-sm text-muted-foreground">
          {context.venueName} · {context.venueCity} · {dateLabel}
        </p>
      </div>
    </div>
  );
}

export function EventReturnLink({
  context,
  branded = false,
}: {
  context: CommerceEventContext;
  branded?: boolean;
}) {
  return (
    <Link
      href={`/event/${context.eventSlug}`}
      className={
        branded
          ? "inline-flex h-13 w-full items-center justify-center rounded-xl bg-artist-accent px-4 text-base font-semibold text-artist-accent-fg hover:bg-artist-accent/90"
          : "inline-flex h-13 w-full items-center justify-center rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground hover:bg-primary/90"
      }
    >
      Back to tonight&apos;s experience
    </Link>
  );
}
