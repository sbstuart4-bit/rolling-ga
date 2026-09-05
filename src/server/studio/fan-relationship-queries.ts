import "server-only";
import { and, count, desc, eq, inArray, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  artistConsents,
  artists,
  drops,
  events,
  orderItems,
  orders,
  tours,
  users,
  venues,
  verifiedAttendance,
} from "@/db/schema";
import {
  attributeOrderToEvent,
  postShowGmvWithinWindow,
  resolveLineEventAttribution,
  sumAttributedGmv,
  type CommerceAttributionPhase,
  type EventWindow,
  type OrderAttributionInput,
} from "@/lib/fan-attribution";
import { resolveEventState } from "@/lib/event-state";
import { assertArtistAccess } from "@/server/auth/guards";
import type { AuthContext } from "@/server/auth/session";
import { getEventById } from "@/server/events/queries";

const PAID = notInArray(orders.status, ["cancelled", "pending"]);

export interface FanRelationshipAggregateMetrics {
  verifiedFans: number;
  connectedFans: number;
  purchasingFans: number;
  repeatPurchasers: number;
  postShowGmvCents: number;
  avgRevenuePerConnectedFanCents: number | null;
  isDemoData: boolean;
}

export interface FanTimelineEntry {
  id: string;
  date: Date;
  kind: "verification" | "purchase" | "connection" | "drop";
  label: string;
  detail?: string;
  amountCents?: number;
  phase?: CommerceAttributionPhase;
  isDemo?: boolean;
}

export interface ObservedFanValue {
  showNightGmvCents: number;
  postShowGmvCents: number;
  unattributedGmvCents: number;
  totalObservedGmvCents: number;
  orderCount: number;
  showsAttended: number;
}

export interface FanRelationshipProfile {
  userId: string;
  displayName: string;
  email: string;
  relationshipStarted: {
    artistName: string;
    venueCity: string;
    startsAt: Date;
    timezone: string;
  } | null;
  timeline: FanTimelineEntry[];
  observedValue: ObservedFanValue;
  isDemoData: boolean;
}

export interface ShowCohortMetrics {
  event: NonNullable<Awaited<ReturnType<typeof getEventById>>>;
  originalVerifiedAttendees: number;
  connectedAfterShow: number;
  showNightGmvCents: number;
  postShowGmv30DaysCents: number;
  postShowGmv90DaysCents: number;
  totalObservedGmvCents: number;
  repeatPurchaseRate: number | null;
  observedGmvPerVerifiedFanCents: number | null;
  isDemoData: boolean;
}

export interface ConsentedFanRow {
  userId: string;
  displayName: string;
  email: string;
  grantedAt: Date | null;
  observedGmvCents: number;
  showsAttended: number;
}

async function loadArtistEventIds(artistId: string) {
  const rows = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.artistId, artistId));
  return rows.map((r) => r.id);
}

async function loadOrderLinesForArtist(artistId: string, userIds?: string[]) {
  const conditions = [eq(orders.artistId, artistId), PAID];
  if (userIds && userIds.length > 0) {
    conditions.push(inArray(orders.userId, userIds));
  }

  return db
    .select({
      orderId: orders.id,
      userId: orders.userId,
      orderEventId: orders.eventId,
      placedAt: orders.placedAt,
      commerceSource: orders.commerceSource,
      isDemo: orders.isDemo,
      dropId: orderItems.dropId,
      dropEventId: drops.eventId,
      lineTotalCents: orderItems.totalCents,
      nameSnapshot: orderItems.nameSnapshot,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .leftJoin(drops, eq(drops.id, orderItems.dropId))
    .where(and(...conditions))
    .orderBy(desc(orders.placedAt));
}

function groupOrdersByUser(
  lines: Awaited<ReturnType<typeof loadOrderLinesForArtist>>,
): Map<string, OrderAttributionInput[]> {
  const map = new Map<string, Map<string, OrderAttributionInput>>();

  for (const line of lines) {
    const userOrders = map.get(line.userId) ?? new Map<string, OrderAttributionInput>();
    const existing = userOrders.get(line.orderId) ?? {
      orderId: line.orderId,
      orderEventId: line.orderEventId,
      placedAt: line.placedAt,
      commerceSource: line.commerceSource,
      lines: [],
    };
    existing.lines.push({
      dropId: line.dropId,
      dropEventId: line.dropEventId,
      lineTotalCents: line.lineTotalCents,
    });
    userOrders.set(line.orderId, existing);
    map.set(line.userId, userOrders);
  }

  const result = new Map<string, OrderAttributionInput[]>();
  for (const [userId, orderMap] of map) {
    result.set(userId, [...orderMap.values()]);
  }
  return result;
}

async function loadVerifiedEventsByUser(artistId: string, userIds?: string[]) {
  const conditions = [eq(events.artistId, artistId)];
  if (userIds && userIds.length > 0) {
    conditions.push(inArray(verifiedAttendance.userId, userIds));
  }

  const rows = await db
    .select({
      userId: verifiedAttendance.userId,
      eventId: verifiedAttendance.eventId,
      verifiedAt: verifiedAttendance.verifiedAt,
      venueCity: venues.city,
      startsAt: events.startsAt,
      timezone: events.timezone,
      endsAt: events.endsAt,
      postShowWindowMinutes: events.postShowWindowMinutes,
      cancelled: events.cancelled,
      tourWindowMinutes: tours.postShowWindowMinutes,
      isDemo: verifiedAttendance.isDemo,
    })
    .from(verifiedAttendance)
    .innerJoin(events, eq(events.id, verifiedAttendance.eventId))
    .innerJoin(venues, eq(venues.id, events.venueId))
    .innerJoin(tours, eq(tours.id, events.tourId))
    .where(and(...conditions))
    .orderBy(verifiedAttendance.verifiedAt);

  const byUser = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byUser.get(row.userId) ?? [];
    list.push(row);
    byUser.set(row.userId, list);
  }
  return byUser;
}

async function fanHasConsent(userId: string, artistId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: artistConsents.id })
    .from(artistConsents)
    .where(
      and(
        eq(artistConsents.userId, userId),
        eq(artistConsents.artistId, artistId),
        eq(artistConsents.consentType, "attendee_offers"),
        eq(artistConsents.status, "granted"),
      ),
    )
    .limit(1);
  return Boolean(row);
}

function eventWindow(event: {
  eventId?: string;
  id?: string;
  startsAt: Date;
  endsAt: Date;
  postShowWindowMinutes: number | null;
  cancelled: boolean;
  tourWindowMinutes: number | null;
}): EventWindow {
  const timing = resolveEventState(
    {
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      postShowWindowMinutes: event.postShowWindowMinutes,
      cancelled: event.cancelled,
    },
    event.tourWindowMinutes,
  );
  return {
    eventId: event.eventId ?? event.id!,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    postShowClosesAt: timing.postShowClosesAt,
  };
}

function sumPostShowGmvForUser(
  userOrders: OrderAttributionInput[],
  verifiedRows: Awaited<ReturnType<typeof loadVerifiedEventsByUser>> extends Map<string, infer V>
    ? V
    : never,
): number {
  const verifiedIds = new Set(verifiedRows.map((v) => v.eventId));
  let total = 0;

  for (const order of userOrders) {
    for (const line of order.lines) {
      const eventId = resolveLineEventAttribution(order, line, verifiedIds);
      if (!eventId) continue;

      const verification = verifiedRows.find((v) => v.eventId === eventId);
      if (!verification) continue;

      const attributed = attributeOrderToEvent(order, eventWindow(verification), verifiedIds);
      total += sumAttributedGmv(
        attributed.filter((a) => a.lineTotalCents === line.lineTotalCents),
        "post_show",
      );
    }
  }

  return total;
}

export async function loadFanRelationshipMetrics(
  ctx: AuthContext,
  artistId: string,
): Promise<FanRelationshipAggregateMetrics> {
  assertArtistAccess(ctx, artistId);
  const eventIds = await loadArtistEventIds(artistId);

  const [verifiedRow, connectedRow, purchasingRow, repeatRows, orderLines, demoArtist, connectedIds] =
    await Promise.all([
      eventIds.length > 0
        ? db
            .select({ total: count(sql`distinct ${verifiedAttendance.userId}`) })
            .from(verifiedAttendance)
            .where(inArray(verifiedAttendance.eventId, eventIds))
        : Promise.resolve([{ total: 0 }]),
      db
        .select({ total: count(sql`distinct ${artistConsents.userId}`) })
        .from(artistConsents)
        .where(
          and(
            eq(artistConsents.artistId, artistId),
            eq(artistConsents.consentType, "attendee_offers"),
            eq(artistConsents.status, "granted"),
          ),
        ),
      db
        .select({ total: count(sql`distinct ${orders.userId}`) })
        .from(orders)
        .where(and(eq(orders.artistId, artistId), PAID)),
      db
        .select({ userId: orders.userId, orderCount: count(orders.id) })
        .from(orders)
        .where(and(eq(orders.artistId, artistId), PAID))
        .groupBy(orders.userId),
      loadOrderLinesForArtist(artistId),
      db
        .select({ isDemo: sql<boolean>`bool_or(${events.isDemo})` })
        .from(events)
        .where(eq(events.artistId, artistId)),
      db
        .select({ userId: artistConsents.userId })
        .from(artistConsents)
        .where(
          and(
            eq(artistConsents.artistId, artistId),
            eq(artistConsents.consentType, "attendee_offers"),
            eq(artistConsents.status, "granted"),
          ),
        ),
    ]);

  const connectedSet = new Set(connectedIds.map((r) => r.userId));
  const ordersByUser = groupOrdersByUser(orderLines);

  let connectedGmv = 0;
  for (const userId of connectedSet) {
    const userOrders = ordersByUser.get(userId) ?? [];
    connectedGmv += userOrders.reduce(
      (sum, order) => sum + order.lines.reduce((s, l) => s + l.lineTotalCents, 0),
      0,
    );
  }

  const verifiedByUser = await loadVerifiedEventsByUser(artistId);
  let postShowGmv = 0;
  for (const [userId, userOrders] of ordersByUser) {
    const verifications = verifiedByUser.get(userId);
    if (!verifications?.length) continue;
    postShowGmv += sumPostShowGmvForUser(userOrders, verifications);
  }

  const connectedCount = Number(connectedRow[0]?.total ?? 0);

  return {
    verifiedFans: Number(verifiedRow[0]?.total ?? 0),
    connectedFans: connectedCount,
    purchasingFans: Number(purchasingRow[0]?.total ?? 0),
    repeatPurchasers: repeatRows.filter((r) => Number(r.orderCount) >= 2).length,
    postShowGmvCents: postShowGmv,
    avgRevenuePerConnectedFanCents:
      connectedCount > 0 ? Math.round(connectedGmv / connectedCount) : null,
    isDemoData: Boolean(demoArtist[0]?.isDemo),
  };
}

export async function listConsentedFansWithValue(
  ctx: AuthContext,
  artistId: string,
): Promise<ConsentedFanRow[]> {
  assertArtistAccess(ctx, artistId);

  const fans = await db
    .select({
      userId: users.id,
      displayName: users.displayName,
      email: users.email,
      grantedAt: artistConsents.grantedAt,
    })
    .from(artistConsents)
    .innerJoin(users, eq(users.id, artistConsents.userId))
    .where(
      and(
        eq(artistConsents.artistId, artistId),
        eq(artistConsents.consentType, "attendee_offers"),
        eq(artistConsents.status, "granted"),
      ),
    )
    .orderBy(desc(artistConsents.grantedAt))
    .limit(100);

  if (fans.length === 0) return [];

  const userIds = fans.map((f) => f.userId);
  const [orderLines, verifiedByUser] = await Promise.all([
    loadOrderLinesForArtist(artistId, userIds),
    loadVerifiedEventsByUser(artistId, userIds),
  ]);
  const ordersByUser = groupOrdersByUser(orderLines);

  return fans.map((fan) => {
    const userOrders = ordersByUser.get(fan.userId) ?? [];
    const gmv = userOrders.reduce(
      (sum, order) => sum + order.lines.reduce((s, l) => s + l.lineTotalCents, 0),
      0,
    );
    return {
      ...fan,
      observedGmvCents: gmv,
      showsAttended: verifiedByUser.get(fan.userId)?.length ?? 0,
    };
  });
}

export async function loadFanRelationshipProfile(
  ctx: AuthContext,
  artistId: string,
  userId: string,
): Promise<FanRelationshipProfile | null> {
  assertArtistAccess(ctx, artistId);

  const hasConsent = await fanHasConsent(userId, artistId);
  if (!hasConsent) return null;

  const [user, artistRow] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)).limit(1),
    db.select({ name: artists.name }).from(artists).where(eq(artists.id, artistId)).limit(1),
  ]);

  if (!user[0]) return null;
  const artistName = artistRow[0]?.name ?? "Artist";

  const [verifications, consents, orderLines, eventDrops] = await Promise.all([
    db
      .select({
        eventId: verifiedAttendance.eventId,
        verifiedAt: verifiedAttendance.verifiedAt,
        venueCity: venues.city,
        startsAt: events.startsAt,
        timezone: events.timezone,
        endsAt: events.endsAt,
        postShowWindowMinutes: events.postShowWindowMinutes,
        cancelled: events.cancelled,
        tourWindowMinutes: tours.postShowWindowMinutes,
        isDemo: verifiedAttendance.isDemo,
      })
      .from(verifiedAttendance)
      .innerJoin(events, eq(events.id, verifiedAttendance.eventId))
      .innerJoin(venues, eq(venues.id, events.venueId))
      .innerJoin(tours, eq(tours.id, events.tourId))
      .where(and(eq(verifiedAttendance.userId, userId), eq(events.artistId, artistId)))
      .orderBy(verifiedAttendance.verifiedAt),
    db
      .select({
        grantedAt: artistConsents.grantedAt,
        isDemo: artistConsents.isDemo,
      })
      .from(artistConsents)
      .where(
        and(
          eq(artistConsents.userId, userId),
          eq(artistConsents.artistId, artistId),
          eq(artistConsents.consentType, "attendee_offers"),
          eq(artistConsents.status, "granted"),
        ),
      )
      .limit(1),
    loadOrderLinesForArtist(artistId, [userId]),
    db
      .select({
        id: drops.id,
        title: drops.title,
        startsAt: drops.startsAt,
        eventId: drops.eventId,
        exclusivityType: drops.exclusivityType,
        isDemo: drops.isDemo,
      })
      .from(drops)
      .where(eq(drops.artistId, artistId))
      .orderBy(drops.startsAt),
  ]);

  const verifiedIds = new Set(verifications.map((v) => v.eventId));
  const ordersByUser = groupOrdersByUser(orderLines);
  const userOrders = ordersByUser.get(userId) ?? [];

  let showNightGmv = 0;
  let postShowGmv = 0;
  let unattributedGmv = 0;
  const orderIds = new Set<string>();
  const timeline: FanTimelineEntry[] = [];

  for (const v of verifications) {
    timeline.push({
      id: `verify-${v.eventId}`,
      date: v.verifiedAt,
      kind: "verification",
      label: `${v.venueCity} Show ✓`,
      isDemo: v.isDemo ?? false,
    });
  }

  for (const order of userOrders) {
    orderIds.add(order.orderId);
    let orderShowNight = 0;
    let orderPostShow = 0;
    let orderAttributed = false;

    for (const v of verifications) {
      const window = eventWindow(v);
      const attributed = attributeOrderToEvent(order, window, verifiedIds);
      for (const line of attributed) {
        if (line.attributedEventId) {
          orderAttributed = true;
          if (line.phase === "show_night") orderShowNight += line.lineTotalCents;
          else if (line.phase === "post_show") orderPostShow += line.lineTotalCents;
        }
      }
    }

    showNightGmv += orderShowNight;
    postShowGmv += orderPostShow;

    const orderGmv = order.lines.reduce((s, l) => s + l.lineTotalCents, 0);
    if (!orderAttributed) unattributedGmv += orderGmv;

    const lineName =
      orderLines.find((l) => l.orderId === order.orderId)?.nameSnapshot ?? "Purchase";
    const phase: CommerceAttributionPhase = orderAttributed
      ? orderPostShow > 0
        ? "post_show"
        : "show_night"
      : "unattributed";

    timeline.push({
      id: `order-${order.orderId}`,
      date: order.placedAt ?? new Date(),
      kind: "purchase",
      label: `Purchased ${lineName}`,
      amountCents: orderGmv,
      phase,
      isDemo: orderLines.some((l) => l.orderId === order.orderId && l.isDemo),
    });
  }

  if (consents[0]?.grantedAt) {
    timeline.push({
      id: "connection",
      date: consents[0].grantedAt,
      kind: "connection",
      label: `Connected with ${artistName} ✓`,
      isDemo: consents[0].isDemo ?? false,
    });
  }

  for (const drop of eventDrops) {
    if (!drop.eventId || !verifiedIds.has(drop.eventId)) continue;
    const verification = verifications.find((v) => v.eventId === drop.eventId);
    const label =
      drop.exclusivityType === "anniversary"
        ? `${verification?.venueCity ?? "Show"} Attendee Drop`
        : drop.title;

    timeline.push({
      id: `drop-${drop.id}`,
      date: drop.startsAt,
      kind: "drop",
      label,
      isDemo: drop.isDemo ?? false,
    });
  }

  timeline.sort((a, b) => a.date.getTime() - b.date.getTime());

  const firstVerification = verifications[0];

  return {
    userId,
    displayName: user[0].displayName,
    email: user[0].email,
    relationshipStarted: firstVerification
      ? {
          artistName,
          venueCity: firstVerification.venueCity,
          startsAt: firstVerification.startsAt,
          timezone: firstVerification.timezone,
        }
      : null,
    timeline,
    observedValue: {
      showNightGmvCents: showNightGmv,
      postShowGmvCents: postShowGmv,
      unattributedGmvCents: unattributedGmv,
      totalObservedGmvCents: showNightGmv + postShowGmv,
      orderCount: orderIds.size,
      showsAttended: verifications.length,
    },
    isDemoData: Boolean(
      verifications.some((v) => v.isDemo) ||
        orderLines.some((l) => l.isDemo) ||
        consents[0]?.isDemo,
    ),
  };
}

export async function loadShowCohortMetrics(
  ctx: AuthContext,
  artistId: string,
  eventId: string,
): Promise<ShowCohortMetrics | null> {
  assertArtistAccess(ctx, artistId);
  const event = await getEventById(eventId);
  if (!event || event.artistId !== artistId) return null;

  const [eventDemoRow] = await db
    .select({ isDemo: events.isDemo })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  const isDemoData = Boolean(eventDemoRow?.isDemo);

  const window = eventWindow({
    id: event.id,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    postShowWindowMinutes: event.postShowWindowMinutes,
    cancelled: event.cancelled,
    tourWindowMinutes: event.tourWindowMinutes,
  });

  const verifiedRows = await db
    .select({
      userId: verifiedAttendance.userId,
    })
    .from(verifiedAttendance)
    .where(eq(verifiedAttendance.eventId, eventId));

  const verifiedUserIds = verifiedRows.map((r) => r.userId);
  const originalVerified = verifiedUserIds.length;

  const connectedAfterShow = await db
    .select({ total: count(sql`distinct ${artistConsents.userId}`) })
    .from(artistConsents)
    .innerJoin(verifiedAttendance, eq(verifiedAttendance.userId, artistConsents.userId))
    .where(
      and(
        eq(verifiedAttendance.eventId, eventId),
        eq(artistConsents.artistId, artistId),
        eq(artistConsents.consentType, "attendee_offers"),
        eq(artistConsents.status, "granted"),
        sql`${artistConsents.grantedAt} > ${event.endsAt}`,
      ),
    );

  if (verifiedUserIds.length === 0) {
    return {
      event,
      originalVerifiedAttendees: 0,
      connectedAfterShow: Number(connectedAfterShow[0]?.total ?? 0),
      showNightGmvCents: 0,
      postShowGmv30DaysCents: 0,
      postShowGmv90DaysCents: 0,
      totalObservedGmvCents: 0,
      repeatPurchaseRate: null,
      observedGmvPerVerifiedFanCents: null,
      isDemoData,
    };
  }

  const orderLines = await loadOrderLinesForArtist(artistId, verifiedUserIds);
  const ordersByUser = groupOrdersByUser(orderLines);

  let showNightGmv = 0;
  let postShow30 = 0;
  let postShow90 = 0;
  let totalObserved = 0;
  let fansWithRepeat = 0;

  for (const userId of verifiedUserIds) {
    const verifiedSet = new Set([eventId]);
    const userOrders = ordersByUser.get(userId) ?? [];
    let attributedOrderCount = 0;

    const allAttributed: ReturnType<typeof attributeOrderToEvent> = [];
    for (const order of userOrders) {
      const attributed = attributeOrderToEvent(order, window, verifiedSet);
      allAttributed.push(...attributed);
      if (attributed.some((a) => a.attributedEventId === eventId)) {
        attributedOrderCount += 1;
      }
    }

    if (attributedOrderCount >= 2) fansWithRepeat += 1;

    showNightGmv += sumAttributedGmv(allAttributed, "show_night");
    postShow30 += postShowGmvWithinWindow(allAttributed, event.endsAt, 30);
    postShow90 += postShowGmvWithinWindow(allAttributed, event.endsAt, 90);
    totalObserved += sumAttributedGmv(allAttributed);
  }

  return {
    event,
    originalVerifiedAttendees: originalVerified,
    connectedAfterShow: Number(connectedAfterShow[0]?.total ?? 0),
    showNightGmvCents: showNightGmv,
    postShowGmv30DaysCents: postShow30,
    postShowGmv90DaysCents: postShow90,
    totalObservedGmvCents: totalObserved,
    repeatPurchaseRate: originalVerified > 0 ? fansWithRepeat / originalVerified : null,
    observedGmvPerVerifiedFanCents:
      originalVerified > 0 ? Math.round(totalObserved / originalVerified) : null,
    isDemoData,
  };
}
