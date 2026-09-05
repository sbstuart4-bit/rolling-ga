import "server-only";
import { and, asc, count, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import {
  drops,
  eventThemes,
  eventVerificationTokens,
  events,
  products,
  tours,
  venues,
} from "@/db/schema";
import { assertArtistAccess } from "@/server/auth/guards";
import type { AuthContext } from "@/server/auth/session";
import { demoNow } from "@/server/demo/clock";
import {
  getEventById,
  listEventsForTour,
  withTiming,
  type EventRow,
} from "@/server/events/queries";
import { resolveEventTheme, resolveTourTheme } from "@/server/theme/resolve";
import type { ResolvedTheme } from "@/lib/theme";

export interface EventReadiness {
  eventId: string;
  lifecycleState: string;
  takeoverConfigured: boolean;
  takeoverSource: "event" | "tour" | "artist" | "none";
  merchConfigured: boolean;
  merchProductCount: number;
  scheduledDropCount: number;
  verificationConfigured: boolean;
  postShowConfigured: boolean;
  postShowMinutes: number;
  postShowSource: "event" | "tour";
}

export interface TourDashboard {
  tour: typeof tours.$inferSelect;
  events: EventRow[];
  readiness: EventReadiness[];
}

export async function getTourById(tourId: string) {
  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  return tour ?? null;
}

export function assertTourAccess(ctx: AuthContext, tourId: string, artistId: string) {
  assertArtistAccess(ctx, artistId);
}

export async function requireTourForArtist(tourId: string, artistId: string) {
  const tour = await getTourById(tourId);
  if (!tour || tour.artistId !== artistId) return null;
  return tour;
}

export async function resolvePrimaryTourId(artistId: string): Promise<string | null> {
  const [tour] = await db
    .select({ id: tours.id })
    .from(tours)
    .where(eq(tours.artistId, artistId))
    .orderBy(asc(tours.name))
    .limit(1);
  return tour?.id ?? null;
}

async function loadReadinessForEvents(
  eventRows: EventRow[],
  tourPostShowMinutes: number,
): Promise<EventReadiness[]> {
  if (eventRows.length === 0) return [];

  const eventIds = eventRows.map((event) => event.id);
  const now = demoNow();

  const [themeRows, productCounts, dropCounts, tokenCounts] = await Promise.all([
    db.select().from(eventThemes).where(inArray(eventThemes.eventId, eventIds)),
    db
      .select({ eventId: products.eventId, total: count(products.id) })
      .from(products)
      .where(and(inArray(products.eventId, eventIds), eq(products.active, true)))
      .groupBy(products.eventId),
    db
      .select({ eventId: drops.eventId, total: count(drops.id) })
      .from(drops)
      .where(
        and(
          inArray(drops.eventId, eventIds),
          or(eq(drops.status, "scheduled"), eq(drops.status, "live")),
        ),
      )
      .groupBy(drops.eventId),
    db
      .select({ eventId: eventVerificationTokens.eventId, total: count(eventVerificationTokens.id) })
      .from(eventVerificationTokens)
      .where(inArray(eventVerificationTokens.eventId, eventIds))
      .groupBy(eventVerificationTokens.eventId),
  ]);

  const themeByEvent = new Map(themeRows.map((row) => [row.eventId, row]));
  const productsByEvent = new Map(productCounts.map((row) => [row.eventId!, Number(row.total)]));
  const dropsByEvent = new Map(dropCounts.map((row) => [row.eventId!, Number(row.total)]));
  const tokensByEvent = new Map(tokenCounts.map((row) => [row.eventId, Number(row.total)]));

  return eventRows.map((event) => {
    const timing = withTiming(event, now).timing;
    const override = themeByEvent.get(event.id);
    const hasOverride = Boolean(
      override &&
        (override.cityArtworkUrl ||
          override.heroImageUrl ||
          override.logoUrl ||
          override.background ||
          override.accent ||
          override.showMessaging),
    );

    let takeoverSource: EventReadiness["takeoverSource"] = "none";
    if (hasOverride) takeoverSource = "event";
    else if (
      event.tourWindowMinutes != null ||
      event.artistName /* tour has theme if any tour field - simplified check via tour join */
    ) {
      takeoverSource = "tour";
    }

    const postShowMinutes = event.postShowWindowMinutes ?? tourPostShowMinutes;
    const postShowSource = event.postShowWindowMinutes != null ? "event" : "tour";

    return {
      eventId: event.id,
      lifecycleState: timing.state,
      takeoverConfigured: hasOverride || Boolean(event.tourName),
      takeoverSource,
      merchConfigured: (productsByEvent.get(event.id) ?? 0) > 0,
      merchProductCount: productsByEvent.get(event.id) ?? 0,
      scheduledDropCount: dropsByEvent.get(event.id) ?? 0,
      verificationConfigured:
        Boolean(event.verificationOpensAt && event.verificationClosesAt) ||
        (tokensByEvent.get(event.id) ?? 0) > 0,
      postShowConfigured: postShowMinutes > 0,
      postShowMinutes,
      postShowSource,
    };
  });
}

export async function loadTourDashboard(
  ctx: AuthContext,
  artistId: string,
  tourId: string,
): Promise<TourDashboard | null> {
  assertTourAccess(ctx, tourId, artistId);
  const tour = await requireTourForArtist(tourId, artistId);
  if (!tour) return null;

  const events = await listEventsForTour(tourId);
  const readiness = await loadReadinessForEvents(events, tour.postShowWindowMinutes);

  return { tour, events, readiness };
}

export async function loadEventConfigBundle(
  ctx: AuthContext,
  artistId: string,
  eventId: string,
) {
  assertArtistAccess(ctx, artistId);
  const event = await getEventById(eventId);
  if (!event || event.artistId !== artistId) return null;

  const tour = await getTourById(event.tourId);
  if (!tour || tour.artistId !== artistId) return null;

  const [override] = await db
    .select()
    .from(eventThemes)
    .where(eq(eventThemes.eventId, eventId))
    .limit(1);

  const [resolvedTheme, tourTheme] = await Promise.all([
    resolveEventTheme(eventId),
    resolveTourTheme(event.tourId),
  ]);

  const timing = withTiming(event, demoNow()).timing;

  return {
    event,
    tour,
    override: override ?? null,
    resolvedTheme,
    tourTheme,
    timing,
  };
}

export async function listVenuesForStudio() {
  return db.select().from(venues).orderBy(asc(venues.city));
}

export async function effectiveThemeForEventPreview(eventId: string): Promise<ResolvedTheme> {
  return resolveEventTheme(eventId);
}
