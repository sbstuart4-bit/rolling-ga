import "server-only";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  artistConsents,
  artists,
  audienceSegments,
  drops,
  events,
  orders,
  tours,
  users,
  venues,
  verifiedAttendance,
} from "@/db/schema";
import { isFanInAudienceSnapshot, SHOW_COHORT_RULE_KIND } from "@/lib/activation/audience";
import type { AudienceRuleParams } from "@/lib/types";
import {
  attributeOrderToEvent,
  resolveLineEventAttribution,
  sumAttributedGmv,
  type CommerceAttributionPhase,
  type EventWindow,
  type OrderAttributionInput,
} from "@/lib/fan-attribution";
import { assertArtistAccess } from "@/server/auth/guards";
import type { AuthContext } from "@/server/auth/session";
import { getEventById } from "@/server/events/queries";

import type {
  CohortFanRow,
  CohortTimelinePhase,
  PostShowWindowMetrics,
  RelationshipOrigin,
} from "@/lib/relationship-intelligence/types";
import { parseCohortStage, type CohortFunnelStage } from "@/lib/relationship-intelligence/types";
import {
  analyzeShowCohort,
  loadCohortFanRows,
} from "@/server/studio/show-cohort-analysis";
import {
  buildEventWindow,
  groupOrdersByUser,
  loadOrderLinesForArtist,
  loadVerifiedEventsByUser,
  PAID,
} from "./fan-relationship-queries-internals";

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
  relationshipStarted: RelationshipOrigin | null;
  lastActivityAt: Date | null;
  timeline: FanTimelineEntry[];
  observedValue: ObservedFanValue;
  isDemoData: boolean;
}

export interface ShowCohortMetrics {
  event: NonNullable<Awaited<ReturnType<typeof getEventById>>>;
  originalVerifiedAttendees: number;
  connectedAfterShow: number;
  connectedFans: number;
  purchasingFans: number;
  postShowPurchasers: number;
  repeatPurchasers: number;
  showNightGmvCents: number;
  postShowGmv30DaysCents: number;
  postShowGmv90DaysCents: number;
  totalObservedGmvCents: number;
  repeatPurchaseRate: number | null;
  observedGmvPerVerifiedFanCents: number | null;
  postShowWindows: PostShowWindowMetrics[];
  timeline: CohortTimelinePhase[];
  isDemoData: boolean;
}

export interface ShowCohortDetail extends ShowCohortMetrics {
  fanRows: CohortFanRow[];
  activeStage: CohortFunnelStage | null;
}

export interface ShowRelationshipSummary {
  eventId: string;
  venueCity: string;
  tourName: string | null;
  startsAt: Date;
  timezone: string;
  connectedFans: number;
  purchasingFans: number;
  postShowPurchasers: number;
  repeatPurchasers: number;
  postShowGmvCents: number;
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
  return buildEventWindow(event);
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
        audienceSegmentId: drops.audienceSegmentId,
        ruleKind: audienceSegments.ruleKind,
        segmentParams: audienceSegments.params,
      })
      .from(drops)
      .leftJoin(audienceSegments, eq(audienceSegments.id, drops.audienceSegmentId))
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
    const orderDropId = order.lines.find((l) => l.dropId)?.dropId ?? null;
    const activationDrop = orderDropId
      ? eventDrops.find((d) => d.id === orderDropId && d.ruleKind === SHOW_COHORT_RULE_KIND)
      : null;
    const phase: CommerceAttributionPhase = orderAttributed
      ? orderPostShow > 0
        ? "post_show"
        : "show_night"
      : "unattributed";

    timeline.push({
      id: `order-${order.orderId}`,
      date: order.placedAt ?? new Date(),
      kind: "purchase",
      label: activationDrop
        ? `Purchased ${lineName} via ${activationDrop.title}`
        : `Purchased ${lineName}`,
      detail: activationDrop ? "Activated post-show purchase" : undefined,
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
    const params = drop.segmentParams as AudienceRuleParams | null;
    if (drop.ruleKind === SHOW_COHORT_RULE_KIND && isFanInAudienceSnapshot(userId, params)) {
      timeline.push({
        id: `eligible-${drop.id}`,
        date: drop.startsAt,
        kind: "drop",
        label: `Eligible for ${drop.title}`,
        isDemo: drop.isDemo ?? false,
      });
    }

    if (!drop.eventId || !verifiedIds.has(drop.eventId)) continue;
    if (drop.ruleKind === SHOW_COHORT_RULE_KIND) continue;
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
  let relationshipStarted: RelationshipOrigin | null = null;
  if (firstVerification) {
    const [tourRow] = await db
      .select({ tourName: tours.name })
      .from(events)
      .innerJoin(tours, eq(tours.id, events.tourId))
      .where(eq(events.id, firstVerification.eventId))
      .limit(1);
    relationshipStarted = {
      eventId: firstVerification.eventId,
      artistName,
      tourName: tourRow?.tourName ?? null,
      venueCity: firstVerification.venueCity,
      startsAt: firstVerification.startsAt,
      timezone: firstVerification.timezone,
    };
  }

  const lastActivityAt =
    timeline.length > 0
      ? timeline.reduce(
          (latest, entry) => (entry.date > latest ? entry.date : latest),
          timeline[0].date,
        )
      : null;

  return {
    userId,
    displayName: user[0].displayName,
    email: user[0].email,
    relationshipStarted,
    lastActivityAt,
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

  const analysis = await analyzeShowCohort(event, Boolean(eventDemoRow?.isDemo));

  return {
    event: analysis.event,
    originalVerifiedAttendees: analysis.funnel.attendees,
    connectedAfterShow: analysis.connectedAfterShow,
    connectedFans: analysis.funnel.connectedFans,
    purchasingFans: analysis.funnel.purchasingFans,
    postShowPurchasers: analysis.funnel.postShowPurchasers,
    repeatPurchasers: analysis.funnel.repeatPurchasers,
    showNightGmvCents: analysis.showNightGmvCents,
    postShowGmv30DaysCents: analysis.postShowGmv30DaysCents,
    postShowGmv90DaysCents: analysis.postShowGmv90DaysCents,
    totalObservedGmvCents: analysis.totalObservedGmvCents,
    repeatPurchaseRate: analysis.repeatPurchaseRate,
    observedGmvPerVerifiedFanCents: analysis.observedGmvPerVerifiedFanCents,
    postShowWindows: analysis.postShowWindows,
    timeline: analysis.timeline,
    isDemoData: analysis.isDemoData,
  };
}

export async function loadShowCohortDetail(
  ctx: AuthContext,
  artistId: string,
  eventId: string,
  stageParam?: string,
): Promise<ShowCohortDetail | null> {
  const metrics = await loadShowCohortMetrics(ctx, artistId, eventId);
  if (!metrics) return null;

  const event = await getEventById(eventId);
  if (!event) return null;

  const [eventDemoRow] = await db
    .select({ isDemo: events.isDemo })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  const analysis = await analyzeShowCohort(event, Boolean(eventDemoRow?.isDemo));
  const activeStage = parseCohortStage(stageParam);
  const fanRows = await loadCohortFanRows(analysis, activeStage);

  return {
    ...metrics,
    fanRows,
    activeStage,
  };
}

export async function listShowRelationshipSummaries(
  ctx: AuthContext,
  artistId: string,
): Promise<ShowRelationshipSummary[]> {
  assertArtistAccess(ctx, artistId);
  const eventIds = await loadArtistEventIds(artistId);
  const summaries: ShowRelationshipSummary[] = [];

  for (const eventId of eventIds) {
    const metrics = await loadShowCohortMetrics(ctx, artistId, eventId);
    if (!metrics) continue;
    summaries.push({
      eventId: metrics.event.id,
      venueCity: metrics.event.venueCity,
      tourName: metrics.event.tourName,
      startsAt: metrics.event.startsAt,
      timezone: metrics.event.timezone,
      connectedFans: metrics.connectedFans,
      purchasingFans: metrics.purchasingFans,
      postShowPurchasers: metrics.postShowPurchasers,
      repeatPurchasers: metrics.repeatPurchasers,
      postShowGmvCents: metrics.postShowGmv90DaysCents,
    });
  }

  return summaries;
}
