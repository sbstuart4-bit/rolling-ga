import Link from "next/link";
import type { ReactNode } from "react";
import { ArtistTakeover } from "@/components/artist/artist-takeover";
import { EventCommerceHeader } from "@/components/fan/event-commerce-chrome";
import type { EventPageContext } from "@/server/events/context";
import { eventShopBackHref } from "@/server/events/takeover";

/**
 * Applies the artist takeover when a fan arrived from an event-scoped journey (`?e=`).
 * When context is absent, children render unchanged inside the generic fan shell.
 */
export function EventScopedTakeover({
  eventPage,
  children,
  title,
  subtitle,
  backHref,
  backLabel = "← Back to show shop",
  headerTrailing,
}: {
  eventPage: EventPageContext | null;
  children: ReactNode;
  title?: string;
  subtitle?: ReactNode;
  backHref?: string;
  backLabel?: string;
  headerTrailing?: ReactNode;
}) {
  if (!eventPage) return <>{children}</>;

  return (
    <ArtistTakeover
      theme={eventPage.theme}
      className="min-h-full"
    >
      <EventCommerceHeader
        event={eventPage.event}
        theme={eventPage.theme}
        title={title}
        subtitle={subtitle}
        backHref={backHref ?? eventShopBackHref(eventPage.event.slug)}
        backLabel={backLabel}
        trailing={headerTrailing}
      />
      {children}
    </ArtistTakeover>
  );
}

export function EventShopBackLink({ eventSlug }: { eventSlug: string }) {
  return (
    <Link
      href={eventShopBackHref(eventSlug)}
      className="mb-4 inline-block text-sm text-artist-muted hover:text-artist-fg"
    >
      ← Back to show shop
    </Link>
  );
}
