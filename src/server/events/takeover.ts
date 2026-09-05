import "server-only";
import { loadEventPage, type EventPageContext } from "./context";

/**
 * Event-scoped commerce surfaces resolve the same cached context as `/event/[slug]/*`.
 * Invalid or missing slugs return null so callers fall back to the generic experience.
 */
export async function resolveEventTakeoverContext(
  eventSlug: string | undefined,
  userId: string,
): Promise<EventPageContext | null> {
  if (!eventSlug) return null;
  return loadEventPage(eventSlug, userId);
}

export function eventShopBackHref(eventSlug: string): string {
  return `/event/${eventSlug}/shop`;
}

/** Keeps cart scoped to the show the fan is shopping from. */
export function resolveCartEventId(
  eventPage: EventPageContext | null,
  fallbackEventId?: string | null,
): string | undefined {
  return eventPage?.event.id ?? fallbackEventId ?? undefined;
}

export function isEventScopedJourney(
  eventPage: EventPageContext | null,
): eventPage is EventPageContext {
  return eventPage !== null;
}
