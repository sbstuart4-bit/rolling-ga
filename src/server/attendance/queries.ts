import "server-only";
import { and, count, countDistinct, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { artists, events, tours, venues, verifiedAttendance } from "@/db/schema";
import type { VerificationMethod } from "@/lib/types";

const passportSelection = {
  credentialId: verifiedAttendance.id,
  method: verifiedAttendance.method,
  verifiedAt: verifiedAttendance.verifiedAt,
  eventId: events.id,
  slug: events.slug,
  startsAt: events.startsAt,
  endsAt: events.endsAt,
  timezone: events.timezone,
  localMessage: events.localMessage,
  postShowWindowMinutes: events.postShowWindowMinutes,
  cancelled: events.cancelled,
  artistId: artists.id,
  artistName: artists.name,
  artistSlug: artists.slug,
  tourId: tours.id,
  tourName: tours.name,
  tourWindowMinutes: tours.postShowWindowMinutes,
  venueName: venues.name,
  venueCity: venues.city,
  venueRegion: venues.region,
} as const;

function selectPassport() {
  return db
    .select(passportSelection)
    .from(verifiedAttendance)
    .innerJoin(events, eq(events.id, verifiedAttendance.eventId))
    .innerJoin(artists, eq(artists.id, events.artistId))
    .innerJoin(tours, eq(tours.id, events.tourId))
    .innerJoin(venues, eq(venues.id, events.venueId));
}

/** A single row of the concert passport: one credential joined to the show it belongs to. */
export type PassportEntry = Awaited<ReturnType<typeof selectPassport>>[number];

/** Every show a fan has proven they attended, newest first. */
export async function listPassport(userId: string): Promise<PassportEntry[]> {
  return selectPassport()
    .where(eq(verifiedAttendance.userId, userId))
    .orderBy(desc(events.startsAt));
}

export async function getCredential(
  userId: string,
  eventId: string,
): Promise<PassportEntry | null> {
  const [row] = await selectPassport()
    .where(and(eq(verifiedAttendance.userId, userId), eq(verifiedAttendance.eventId, eventId)))
    .limit(1);

  return row ?? null;
}

/** Looked up by credential id for the shareable view, which has no session. */
export async function getCredentialById(credentialId: string): Promise<PassportEntry | null> {
  const [row] = await selectPassport().where(eq(verifiedAttendance.id, credentialId)).limit(1);
  return row ?? null;
}

export interface PassportStats {
  shows: number;
  artists: number;
  cities: number;
  venues: number;
  firstShow: Date | null;
}

/**
 * The passport summary. Computed in SQL rather than by counting rows in memory so it
 * stays correct for a fan with hundreds of shows.
 */
export async function getPassportStats(userId: string): Promise<PassportStats> {
  const [row] = await db
    .select({
      shows: count(verifiedAttendance.id),
      artists: countDistinct(events.artistId),
      cities: countDistinct(venues.city),
      venues: countDistinct(events.venueId),
      firstShow: sql<number | null>`min(${events.startsAt})`,
    })
    .from(verifiedAttendance)
    .innerJoin(events, eq(events.id, verifiedAttendance.eventId))
    .innerJoin(venues, eq(venues.id, events.venueId))
    .where(eq(verifiedAttendance.userId, userId));

  return {
    shows: Number(row?.shows ?? 0),
    artists: Number(row?.artists ?? 0),
    cities: Number(row?.cities ?? 0),
    venues: Number(row?.venues ?? 0),
    firstShow: row?.firstShow ? new Date(Number(row.firstShow) * 1000) : null,
  };
}

/** Artist ids a fan has verified attendance for. Drives eligibility and the home feed. */
export async function listAttendedArtistIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ artistId: events.artistId })
    .from(verifiedAttendance)
    .innerJoin(events, eq(events.id, verifiedAttendance.eventId))
    .where(eq(verifiedAttendance.userId, userId));

  return [...new Set(rows.map((r) => r.artistId))];
}

/** Event ids a fan holds credentials for. Used by event-specific product eligibility. */
export async function listAttendedEventIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ eventId: verifiedAttendance.eventId })
    .from(verifiedAttendance)
    .where(eq(verifiedAttendance.userId, userId));

  return rows.map((r) => r.eventId);
}

export async function listAttendedTourIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ tourId: events.tourId })
    .from(verifiedAttendance)
    .innerJoin(events, eq(events.id, verifiedAttendance.eventId))
    .where(eq(verifiedAttendance.userId, userId));

  return [...new Set(rows.map((r) => r.tourId))];
}

export const VERIFICATION_METHOD_LABELS: Record<VerificationMethod, string> = {
  event_qr: "QR at the venue",
  geofence: "Location",
  staff_override: "Venue staff",
  ticket_barcode: "Ticket barcode",
  ticketmaster: "Ticketmaster",
  axs: "AXS",
  nfc: "NFC tap",
  wallet: "Wallet pass",
};
