import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { artists, drops, events, venues } from "@/db/schema";
import type { CommerceSource } from "@/lib/types";
import { getEventBySlug } from "@/server/events/queries";

export interface CommerceEventContext {
  eventId: string;
  eventSlug: string;
  artistId: string;
  artistName: string;
  venueName: string;
  venueCity: string;
  startsAt: Date;
  timezone: string;
}

/**
 * Display context for cart, checkout, and confirmation surfaces.
 * Joins the normalized event row — no duplicated blobs.
 */
export async function getCommerceEventContext(
  eventId: string | null | undefined,
): Promise<CommerceEventContext | null> {
  if (!eventId) return null;

  const [row] = await db
    .select({
      eventId: events.id,
      eventSlug: events.slug,
      artistId: artists.id,
      artistName: artists.name,
      venueName: venues.name,
      venueCity: venues.city,
      startsAt: events.startsAt,
      timezone: events.timezone,
    })
    .from(events)
    .innerJoin(artists, eq(artists.id, events.artistId))
    .innerJoin(venues, eq(venues.id, events.venueId))
    .where(eq(events.id, eventId))
    .limit(1);

  return row ?? null;
}

export function commerceSourceForEvent(eventId: string | null | undefined): CommerceSource {
  return eventId ? "event_scoped" : "generic";
}

/**
 * Resolves and validates event context posted from an event-scoped journey.
 *
 * Invalid slugs are ignored rather than trusted. A mismatched artist, product, or drop
 * rejects the add so attribution cannot be spoofed.
 */
export async function resolveValidatedCommerceEvent(input: {
  eventId?: string | null;
  eventSlug?: string | null;
  artistId: string;
  productId: string;
  dropId?: string | null;
}): Promise<{ eventId: string | null; error?: string }> {
  let resolvedEventId = input.eventId?.trim() || null;

  if (input.eventSlug?.trim()) {
    const fromSlug = await getEventBySlug(input.eventSlug.trim());
    if (!fromSlug) {
      resolvedEventId = null;
    } else if (fromSlug.artistId !== input.artistId) {
      return { eventId: null, error: "That show doesn't match this artist." };
    } else if (resolvedEventId && resolvedEventId !== fromSlug.id) {
      return { eventId: null, error: "Event context could not be verified." };
    } else {
      resolvedEventId = fromSlug.id;
    }
  }

  if (!resolvedEventId) return { eventId: null };

  const [event] = await db
    .select({ id: events.id, artistId: events.artistId })
    .from(events)
    .where(eq(events.id, resolvedEventId))
    .limit(1);

  if (!event) return { eventId: null };
  if (event.artistId !== input.artistId) {
    return { eventId: null, error: "That product isn't sold at this show." };
  }

  if (input.dropId) {
    const [drop] = await db
      .select({ eventId: drops.eventId, artistId: drops.artistId })
      .from(drops)
      .where(eq(drops.id, input.dropId))
      .limit(1);

    if (!drop) return { eventId: null, error: "That drop could not be found." };
    if (drop.artistId !== input.artistId) {
      return { eventId: null, error: "That drop doesn't belong to this artist." };
    }
    if (drop.eventId && drop.eventId !== resolvedEventId) {
      return { eventId: null, error: "That drop isn't part of this show." };
    }
  }

  return { eventId: resolvedEventId };
}

/** Primary event for a cart: cart header, else first line with source attribution. */
export function primaryCartEventId(
  cartEventId: string | null | undefined,
  lineSourceEventIds: Array<string | null | undefined>,
): string | null {
  if (cartEventId) return cartEventId;
  return lineSourceEventIds.find((id) => id) ?? null;
}
