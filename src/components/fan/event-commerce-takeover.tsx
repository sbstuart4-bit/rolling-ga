import type { ReactNode } from "react";
import { EventScopedTakeover } from "@/components/fan/event-scoped-takeover";
import type { CommerceEventContext } from "@/server/commerce/attribution";
import { loadEventPageFromCommerceContext } from "@/server/events/commerce-chrome";

/**
 * Wraps cart, checkout, and confirmation in the artist's visual world when the cart
 * is attributed to a show. Falls back to generic Rolling GA chrome when not.
 */
export async function EventCommerceTakeover({
  eventContext,
  userId,
  children,
  title,
  subtitle,
  backHref,
  backLabel = "← Back to show shop",
}: {
  eventContext: CommerceEventContext | null | undefined;
  userId: string;
  children: ReactNode;
  title?: string;
  subtitle?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  const eventPage = await loadEventPageFromCommerceContext(eventContext, userId);

  if (!eventPage) return <>{children}</>;

  return (
    <EventScopedTakeover
      eventPage={eventPage}
      title={title}
      subtitle={subtitle}
      backHref={backHref ?? `/event/${eventPage.event.slug}/shop`}
      backLabel={backLabel}
    >
      {children}
    </EventScopedTakeover>
  );
}
