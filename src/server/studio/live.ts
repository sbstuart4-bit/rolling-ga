import "server-only";
import { and, count, desc, eq, inArray, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import {
  dropProducts,
  drops,
  events,
  orderItems,
  orders,
  products,
  artistConsents,
  verifiedAttendance,
} from "@/db/schema";
import { resolveEventState } from "@/lib/event-state";
import { assertArtistAccess } from "@/server/auth/guards";
import type { AuthContext } from "@/server/auth/session";
import { demoNow } from "@/server/demo/clock";
import {
  countVerifiedAttendance,
  getEventById,
  listLiveEventsForArtist,
  withTiming,
} from "@/server/events/queries";

export interface LiveDropSummary {
  id: string;
  title: string;
  slug: string;
  status: string;
  startsAt: Date;
  endsAt: Date | null;
  quantityLimit: number | null;
  quantitySold: number;
  exclusivityType: string;
  productNames: string[];
}

export interface TopProductSummary {
  name: string;
  unitsSold: number;
  revenueCents: number;
}

export interface LiveCommandCenterSnapshot {
  event: NonNullable<Awaited<ReturnType<typeof getEventById>>>;
  timing: ReturnType<typeof withTiming>["timing"];
  expectedAttendance: number | null;
  verifiedAttendees: number;
  connectedFans: number;
  purchasingFans: number;
  orderCount: number;
  gmvCents: number;
  aovCents: number;
  activeDrop: LiveDropSummary | null;
  timelineDrops: LiveDropSummary[];
  topProducts: TopProductSummary[];
  isDemoData: boolean;
}

async function loadDropSummariesForEvent(eventId: string, artistId: string): Promise<LiveDropSummary[]> {
  const rows = await db
    .select({
      id: drops.id,
      title: drops.title,
      slug: drops.slug,
      status: drops.status,
      startsAt: drops.startsAt,
      endsAt: drops.endsAt,
      quantityLimit: drops.quantityLimit,
      quantitySold: drops.quantitySold,
      exclusivityType: drops.exclusivityType,
      isDemo: drops.isDemo,
    })
    .from(drops)
    .where(and(eq(drops.eventId, eventId), eq(drops.artistId, artistId)))
    .orderBy(desc(drops.startsAt));

  if (rows.length === 0) return [];

  const dropIds = rows.map((row) => row.id);
  const productLinks = await db
    .select({
      dropId: dropProducts.dropId,
      name: products.name,
    })
    .from(dropProducts)
    .innerJoin(products, eq(products.id, dropProducts.productId))
    .where(inArray(dropProducts.dropId, dropIds));

  const namesByDrop = new Map<string, string[]>();
  for (const link of productLinks) {
    const list = namesByDrop.get(link.dropId) ?? [];
    list.push(link.name);
    namesByDrop.set(link.dropId, list);
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    quantityLimit: row.quantityLimit,
    quantitySold: row.quantitySold,
    exclusivityType: row.exclusivityType,
    productNames: namesByDrop.get(row.id) ?? [],
  }));
}

export async function loadLiveCommandCenterSnapshot(
  ctx: AuthContext,
  artistId: string,
  eventId: string,
): Promise<LiveCommandCenterSnapshot | null> {
  assertArtistAccess(ctx, artistId);

  const event = await getEventById(eventId);
  if (!event || event.artistId !== artistId) return null;

  const now = demoNow();
  const timing = withTiming(event, now).timing;

  const [verifiedAttendees, orderStats, topProductRows, dropSummaries, connectedFansRow, purchasingFansRow] =
    await Promise.all([
    countVerifiedAttendance(event.id),
    db
      .select({
        orderCount: count(orders.id),
        gmvCents: sum(orders.totalCents),
      })
      .from(orders)
      .where(
        and(eq(orders.eventId, event.id), eq(orders.artistId, artistId), eq(orders.status, "paid")),
      ),
    db
      .select({
        name: orderItems.nameSnapshot,
        unitsSold: sum(orderItems.quantity),
        revenueCents: sum(orderItems.totalCents),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(
        and(eq(orders.eventId, event.id), eq(orders.artistId, artistId), eq(orders.status, "paid")),
      )
      .groupBy(orderItems.nameSnapshot)
      .orderBy(desc(sum(orderItems.quantity)))
      .limit(5),
    loadDropSummariesForEvent(event.id, artistId),
    db
      .select({ total: count(sql`distinct ${artistConsents.userId}`) })
      .from(artistConsents)
      .innerJoin(verifiedAttendance, eq(verifiedAttendance.userId, artistConsents.userId))
      .where(
        and(
          eq(verifiedAttendance.eventId, event.id),
          eq(artistConsents.artistId, artistId),
          eq(artistConsents.consentType, "attendee_offers"),
          eq(artistConsents.status, "granted"),
        ),
      ),
    db
      .select({ total: count(sql`distinct ${orders.userId}`) })
      .from(orders)
      .innerJoin(verifiedAttendance, eq(verifiedAttendance.userId, orders.userId))
      .where(
        and(
          eq(verifiedAttendance.eventId, event.id),
          eq(orders.eventId, event.id),
          eq(orders.artistId, artistId),
          eq(orders.status, "paid"),
        ),
      ),
  ]);

  const orderCount = Number(orderStats[0]?.orderCount ?? 0);
  const gmvCents = Number(orderStats[0]?.gmvCents ?? 0);
  const aovCents = orderCount > 0 ? Math.round(gmvCents / orderCount) : 0;

  const activeDrop =
    dropSummaries.find((drop) => drop.status === "live") ??
    dropSummaries.find((drop) => drop.status === "scheduled") ??
    null;

  const [demoEvent] = await db
    .select({ isDemo: events.isDemo })
    .from(events)
    .where(eq(events.id, event.id))
    .limit(1);

  return {
    event,
    timing,
    expectedAttendance: event.expectedAttendance,
    verifiedAttendees,
    connectedFans: Number(connectedFansRow[0]?.total ?? 0),
    purchasingFans: Number(purchasingFansRow[0]?.total ?? 0),
    orderCount,
    gmvCents,
    aovCents,
    activeDrop,
    timelineDrops: dropSummaries.filter((drop) =>
      ["live", "scheduled", "ended"].includes(drop.status),
    ),
    topProducts: topProductRows.map((row) => ({
      name: row.name,
      unitsSold: Number(row.unitsSold ?? 0),
      revenueCents: Number(row.revenueCents ?? 0),
    })),
    isDemoData: Boolean(demoEvent?.isDemo),
  };
}

/** Picks tonight's primary show: live first, then recently ended, then next upcoming. */
export async function resolvePrimaryLiveEventId(
  artistId: string,
  now = demoNow(),
): Promise<string | null> {
  const live = await listLiveEventsForArtist(artistId, now);
  if (live[0]) return live[0].id;

  const recentEvents = await db
    .select({
      id: events.id,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      doorsAt: events.doorsAt,
      postShowWindowMinutes: events.postShowWindowMinutes,
      cancelled: events.cancelled,
      tourWindowMinutes: sql<number | null>`null`,
    })
    .from(events)
    .where(and(eq(events.artistId, artistId), eq(events.cancelled, false)))
    .orderBy(desc(events.endsAt))
    .limit(20);

  for (const row of recentEvents) {
    const timing = resolveEventState(
      {
        startsAt: row.startsAt,
        endsAt: row.endsAt,
        doorsAt: row.doorsAt,
        postShowWindowMinutes: row.postShowWindowMinutes,
        cancelled: row.cancelled,
      },
      null,
      now,
    );
    if (timing.state === "recently_ended") return row.id;
  }

  const [upcoming] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.artistId, artistId), eq(events.cancelled, false), sql`${events.startsAt} > ${now}`))
    .orderBy(events.startsAt)
    .limit(1);

  return upcoming?.id ?? null;
}

export async function countEligibleVerifiedAttendees(eventId: string, artistId: string): Promise<number> {
  const event = await getEventById(eventId);
  if (!event || event.artistId !== artistId) return 0;

  const [row] = await db
    .select({ total: count(verifiedAttendance.id) })
    .from(verifiedAttendance)
    .where(eq(verifiedAttendance.eventId, eventId));

  return Number(row?.total ?? 0);
}

export function computeDropEndTime(input: {
  startsAt: Date;
  durationMode: "minutes" | "until_post_show_close";
  durationMinutes?: number;
  event: {
    endsAt: Date;
    postShowWindowMinutes: number | null;
    tourWindowMinutes?: number | null;
  };
}): Date {
  if (input.durationMode === "until_post_show_close") {
    const timing = resolveEventState(
      {
        startsAt: input.event.endsAt,
        endsAt: input.event.endsAt,
        postShowWindowMinutes: input.event.postShowWindowMinutes,
      },
      input.event.tourWindowMinutes,
      input.startsAt,
    );
    return timing.postShowClosesAt ?? new Date(input.startsAt.getTime() + 8 * 60 * 60_000);
  }

  const minutes = input.durationMinutes ?? 45;
  return new Date(input.startsAt.getTime() + minutes * 60_000);
}
