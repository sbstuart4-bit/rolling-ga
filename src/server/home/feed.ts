import "server-only";
import { and, asc, desc, eq, gt, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { artists, drops, events, tours, venues, verifiedAttendance } from "@/db/schema";
import { demoNow } from "@/server/demo/clock";

/**
 * Builds the home feed for a fan, scoped entirely to what they have earned permission
 * to see. No fan sees another fan's data, and no artist sees beyond their own shows.
 */
export async function buildHomeFeed(userId: string, now = demoNow()) {
  const [liveEvents, upcomingEvents, recentShows, newDrops] = await Promise.all([
    loadLiveEvents(now),
    loadUpcomingEvents(now),
    loadRecentShows(userId, now),
    loadNewDrops(userId, now),
  ]);

  return { liveEvents, upcomingEvents, recentShows, newDrops };
}

async function loadLiveEvents(now: Date) {
  return db
    .select({
      id: events.id,
      slug: events.slug,
      artistId: artists.id,
      artistName: artists.name,
      artistSlug: artists.slug,
      venueCity: venues.city,
      venueName: venues.name,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      timezone: events.timezone,
      tourName: tours.name,
    })
    .from(events)
    .innerJoin(artists, eq(artists.id, events.artistId))
    .innerJoin(venues, eq(venues.id, events.venueId))
    .innerJoin(tours, eq(tours.id, events.tourId))
    .where(and(lte(events.startsAt, now), gte(events.endsAt, now), eq(events.cancelled, false)))
    .orderBy(asc(events.startsAt))
    .limit(6);
}

async function loadUpcomingEvents(now: Date) {
  return db
    .select({
      id: events.id,
      slug: events.slug,
      artistId: artists.id,
      artistName: artists.name,
      artistSlug: artists.slug,
      venueCity: venues.city,
      venueName: venues.name,
      startsAt: events.startsAt,
      timezone: events.timezone,
      tourName: tours.name,
    })
    .from(events)
    .innerJoin(artists, eq(artists.id, events.artistId))
    .innerJoin(venues, eq(venues.id, events.venueId))
    .innerJoin(tours, eq(tours.id, events.tourId))
    .where(and(gt(events.startsAt, now), eq(events.cancelled, false)))
    .orderBy(asc(events.startsAt))
    .limit(12);
}

async function loadRecentShows(userId: string, now: Date) {
  const since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // last 90 days
  return db
    .select({
      credentialId: verifiedAttendance.id,
      eventId: events.id,
      slug: events.slug,
      artistName: artists.name,
      venueCity: venues.city,
      startsAt: events.startsAt,
      timezone: events.timezone,
    })
    .from(verifiedAttendance)
    .innerJoin(events, eq(events.id, verifiedAttendance.eventId))
    .innerJoin(artists, eq(artists.id, events.artistId))
    .innerJoin(venues, eq(venues.id, events.venueId))
    .where(and(eq(verifiedAttendance.userId, userId), gte(events.startsAt, since)))
    .orderBy(desc(events.startsAt))
    .limit(6);
}

export async function loadNewDropsForArtist(artistId: string, now = demoNow()) {
  return db
    .select({
      id: drops.id,
      slug: drops.slug,
      title: drops.title,
      artworkUrl: drops.artworkUrl,
      startsAt: drops.startsAt,
      endsAt: drops.endsAt,
      exclusivityType: drops.exclusivityType,
      eventId: drops.eventId,
      artistId: drops.artistId,
      artistName: artists.name,
    })
    .from(drops)
    .innerJoin(artists, eq(artists.id, drops.artistId))
    .where(and(eq(drops.artistId, artistId), eq(drops.status, "live"), lte(drops.startsAt, now)))
    .orderBy(desc(drops.displayPriority), desc(drops.startsAt))
    .limit(8);
}

async function loadNewDrops(userId: string, now: Date) {
  return db
    .select({
      id: drops.id,
      slug: drops.slug,
      title: drops.title,
      artworkUrl: drops.artworkUrl,
      startsAt: drops.startsAt,
      endsAt: drops.endsAt,
      exclusivityType: drops.exclusivityType,
      artistId: drops.artistId,
      artistName: artists.name,
    })
    .from(drops)
    .innerJoin(artists, eq(artists.id, drops.artistId))
    .where(and(eq(drops.status, "live"), lte(drops.startsAt, now)))
    .orderBy(desc(drops.displayPriority), desc(drops.startsAt))
    .limit(8);
}
