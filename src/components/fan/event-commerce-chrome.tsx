import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { EventRow } from "@/server/events/queries";
import type { ResolvedTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/**
 * Shared masthead for event-scoped commerce surfaces.
 * Assumes it renders inside an ArtistTakeover (artist-* tokens available).
 */
export function EventCommerceHeader({
  event,
  theme,
  title,
  subtitle,
  backHref,
  backLabel = "← Back to show shop",
  trailing,
}: {
  event: Pick<EventRow, "artistName" | "venueCity" | "tourName">;
  theme: ResolvedTheme;
  title?: string;
  subtitle?: ReactNode;
  backHref?: string;
  backLabel?: string;
  trailing?: ReactNode;
}) {
  return (
    <header className="border-b border-artist-border px-4 py-5">
      <div className="mx-auto max-w-lg space-y-3">
        {backHref && (
          <Link
            href={backHref}
            className="inline-block text-sm text-artist-muted transition-colors hover:text-artist-fg"
          >
            {backLabel}
          </Link>
        )}

        <div className="flex items-start gap-4">
          {theme.logoUrl && (
            <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-artist-border bg-artist-surface">
              <Image src={theme.logoUrl} alt="" fill sizes="48px" className="object-contain p-1" />
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-1">
            <p className="eyebrow text-artist-muted">
              {event.artistName} · {event.venueCity}
            </p>
            {title && (
              <h1 className="display-xl font-artist text-2xl text-artist-fg md:text-3xl">{title}</h1>
            )}
            {subtitle && (
              <div className="text-sm text-artist-muted text-balance">{subtitle}</div>
            )}
            {!title && !subtitle && (
              <p className="text-sm text-artist-muted">{event.tourName}</p>
            )}
          </div>

          {trailing && <div className="shrink-0">{trailing}</div>}
        </div>
      </div>
    </header>
  );
}

/** Consistent content column for shop, drop, and product pages inside a takeover. */
export function EventCommerceBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("utility-layout mx-auto max-w-lg", className)}>
      {children}
    </div>
  );
}
