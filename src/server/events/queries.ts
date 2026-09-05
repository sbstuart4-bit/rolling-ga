import "server-only";
import { and, asc, desc, eq, gt, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  artists,
  eventContent,
  eventVerificationTokens,
  events,
  tours,
  venues,
  verifiedAttendance,
} from "@/db/schema";
import { resolveEventState, verificationWindow, type EventStateResult } from "@/lib/event-state";
import { demoNow } from "@/server/demo/clock";

const eventSelection = {
  id: events.id,
  slug: events.slug,
  title: events.title,
  doorsAt: events.doorsAt,
  startsAt: events.startsAt,
  endsAt: events.endsAt,
  timezone: events.timezone,
  expectedAttendance: events.expectedAttendance,
  actualAttendance: events.actualAttendance,
  localMessage: events.localMessage,
  postShowWindowMinutes: events.postShowWindowMinutes,
  verificationOpensAt: events.verificationOpensAt,
  verificationClosesAt: events.verificationClosesAt,
  cancelled: events.cancelled,
  artistId: artists.id,
  artistName: artists.name,
  artistSlug: artists.slug,
  tourId: tours.id,
  tourName: tours.name,
  tourSlug: tours.slug,
  tourWindowMinutes: tours.postShowWindowMinutes,
  venueId: venues.id,
  venueName: venues.name,
  venueCity: venues.city,
  venueRegion: venues.region,
  venueCountry: venues.country,
  venueCapacity: venues.capacity,
  venueLat: venues.lat,
  venueLng: venues.lng,
} as const;

/** One show joined to its artist, tour and venue — the shape every show surface reads. */
export type EventRow = Awaited<ReturnType<typeof selectEvents>>[number];

export interface EventContext {
  event: EventRow;
  timing: EventStateResult;
}

function selectEvents() {
  return db
    .select(eventSelection)
    .from(events)
    .innerJoin(artists, eq(artists.id, events.artistId))
    .innerJoin(tours, eq(tours.id, events.tourId))
    .innerJoin(venues, eq(venues.id, events.venueId));
}

export function withTiming<T extends { startsAt: Date; endsAt: Date; doorsAt: Date | null; postShowWindowMinutes: number | null; cancelled: boolean; tourWindowMinutes: number }>(
  event: T,
  now = demoNow(),
): { event: T; timing: EventStateResult } {
  return {
    event,
    timing: resolveEventState(
      {
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        doorsAt: event.doorsAt,
        postShowWindowMinutes: event.postShowWindowMinutes,
        cancelled: event.cancelled,
      },
      event.tourWindowMinutes,
      now,
    ),
  };
}

export async function getEventBySlug(slug: string) {
  const [event] = await selectEvents().where(eq(events.slug, slug)).limit(1);
  return event ?? null;
}

export async function getEventById(eventId: string) {
  const [event] = await selectEvents().where(eq(events.id, eventId)).limit(1);
  return event ?? null;
}

export async function listEventsForArtist(artistId: string) {
  return selectEvents().where(eq(events.artistId, artistId)).orderBy(asc(events.startsAt));
}

export async function listEventsForTour(tourId: string) {
  return selectEvents().where(eq(events.tourId, tourId)).orderBy(asc(events.startsAt));
}

/** Shows currently between start and end. Drives the LIVE NOW row and the ops console. */
export async function listLiveEvents(now = demoNow()) {
  return selectEvents()
    .where(and(lte(events.startsAt, now), gte(events.endsAt, now), eq(events.cancelled, false)))
    .orderBy(asc(events.startsAt));
}

export async function listUpcomingEvents(limit = 12, now = demoNow()) {
  return selectEvents()
    .where(and(gt(events.startsAt, now), eq(events.cancelled, false)))
    .orderBy(asc(events.startsAt))
    .limit(limit);
}

/**
 * Artist-scoped variants of the two lists above.
 *
 * The unscoped versions exist for the Rolling GA ops console, which is deliberately
 * cross-tenant. Anything inside the Artist Studio must use these instead so a team
 * member never sees another artist's shows.
 */
export async function listLiveEventsForArtist(artistId: string, now = demoNow()) {
  return selectEvents()
    .where(
      and(
        eq(events.artistId, artistId),
        lte(events.startsAt, now),
        gte(events.endsAt, now),
        eq(events.cancelled, false),
      ),
    )
    .orderBy(asc(events.startsAt));
}

export async function listUpcomingEventsForArtist(artistId: string, limit = 12, now = demoNow()) {
  return selectEvents()
    .where(and(eq(events.artistId, artistId), gt(events.startsAt, now), eq(events.cancelled, false)))
    .orderBy(asc(events.startsAt))
    .limit(limit);
}

/** Shows that ended today, whether or not their post-show window is still open. */
export async function listEventsEndedSince(since: Date, now = demoNow()) {
  return selectEvents()
    .where(and(lte(events.endsAt, now), gte(events.endsAt, since)))
    .orderBy(desc(events.endsAt));
}

export type TokenResolution =
  | { ok: true; eventId: string; slug: string; tokenId: string }
  | { ok: false; reason: "unknown" | "rotated" | "expired"; slug?: string };

/**
 * Resolves a scanned QR token. Distinguishing "unknown", "rotated" and "expired" is
 * what lets the scan screen say something useful instead of a generic failure.
 */
export async function resolveVerificationToken(
  token: string,
  now = demoNow(),
): Promise<TokenResolution> {
  const [row] = await db
    .select({
      tokenId: eventVerificationTokens.id,
      active: eventVerificationTokens.active,
      expiresAt: eventVerificationTokens.expiresAt,
      eventId: events.id,
      slug: events.slug,
    })
    .from(eventVerificationTokens)
    .innerJoin(events, eq(events.id, eventVerificationTokens.eventId))
    .where(eq(eventVerificationTokens.token, token))
    .limit(1);

  if (!row) return { ok: false, reason: "unknown" };
  if (!row.active) return { ok: false, reason: "rotated", slug: row.slug };
  if (row.expiresAt && row.expiresAt < now) return { ok: false, reason: "expired", slug: row.slug };

  return { ok: true, eventId: row.eventId, slug: row.slug, tokenId: row.tokenId };
}

export async function getActiveEventToken(eventId: string) {
  const [row] = await db
    .select()
    .from(eventVerificationTokens)
    .where(
      and(
        eq(eventVerificationTokens.eventId, eventId),
        eq(eventVerificationTokens.active, true),
      ),
    )
    .orderBy(desc(eventVerificationTokens.issuedAt))
    .limit(1);

  return row ?? null;
}

/** Attendee-only content is withheld unless the reader actually holds a credential. */
export async function listEventContent(eventId: string, isVerifiedAttendee: boolean) {
  const rows = await db
    .select()
    .from(eventContent)
    .where(eq(eventContent.eventId, eventId))
    .orderBy(asc(eventContent.displayOrder));

  return rows.filter((row) => (row.attendeesOnly ? isVerifiedAttendee : true));
}

export async function countVerifiedAttendance(eventId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`count(*)` })
    .from(verifiedAttendance)
    .where(eq(verifiedAttendance.eventId, eventId));
  return Number(row?.total ?? 0);
}

export function verificationWindowFor(event: {
  startsAt: Date;
  endsAt: Date;
  doorsAt: Date | null;
  postShowWindowMinutes: number | null;
  verificationOpensAt: Date | null;
  verificationClosesAt: Date | null;
  tourWindowMinutes: number;
}) {
  return verificationWindow(event, event.tourWindowMinutes);
}
