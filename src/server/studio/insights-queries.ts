import "server-only";
import { and, count, desc, eq, inArray, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import {
  artistConsents,
  artists,
  drops,
  events,
  orderItems,
  orders,
  products,
  verifiedAttendance,
} from "@/db/schema";
import {
  aggregateContributions,
  classifyCommerceMoment,
  consentRate,
  conversionRate,
  isEndlessAisleProduct,
  isPhysicalCoreProduct,
  perAttendeeMetric,
  type CommerceMoment,
  type ContributionResult,
  type MetricAvailability,
} from "@/lib/insights-economics";
import { resolveEventState } from "@/lib/event-state";
import { assertArtistAccess } from "@/server/auth/guards";
import type { AuthContext } from "@/server/auth/session";
import {
  countVerifiedAttendance,
  getEventById,
  listEventsForArtist,
  type EventRow,
} from "@/server/events/queries";
import {
  groupOrdersFromLines,
  loadPaidOrderLines,
  type OrderLineRow,
} from "@/server/studio/insights-order-lines";

const PAID = eq(orders.status, "paid");

export interface ShippingEconomics {
  carrierCostCents: number;
  fanChargeCents: number;
  artistSubsidyCents: number;
  freeShippingCostCents: number;
  subsidyPerOrderCents: number | null;
  contributionAfterShippingCents: number | null;
  contributionComplete: boolean;
  missingInputs: string[];
}

export interface RollingGaCommerce {
  gmvCents: number;
  merchGmvCents: number;
  orderCount: number;
  unitCount: number;
  aovCents: number;
  conversion: MetricAvailability;
  digitalOnlyCents: number;
  cityExclusiveCents: number;
  flashDropCents: number;
  bundleCents: number;
  eventScopedOrderCount: number;
}

export interface EndlessAisleImpact {
  physicalCoreCents: number;
  endlessAisleCents: number;
  beyondBoothCents: number;
  hasBeyondBoothData: boolean;
  beyondBoothStatement: string | null;
}

export interface FanRelationshipMetrics {
  verifiedAttendees: number;
  connectedFans: number;
  consentRate: MetricAvailability;
  purchasersConnected: number;
  purchasersTotal: number;
  repeatPurchasers: number;
}

export interface DropPerformanceRow {
  dropId: string;
  title: string;
  exclusivityType: string;
  eligibleFans: number;
  viewsAvailable: false;
  orderCount: number;
  unitCount: number;
  gmvCents: number;
  aovCents: number;
  conversion: MetricAvailability;
  contributionCents: number | null;
  contributionComplete: boolean;
  missingInputs: string[];
  startsAt: Date;
  endsAt: Date | null;
  durationMinutes: number | null;
}

export interface MomentPerformance {
  moment: CommerceMoment;
  orderCount: number;
  gmvCents: number;
}

export interface ExecutiveScorecard {
  merchGmvPerAttendee: MetricAvailability;
  contributionPerAttendee: MetricAvailability;
  contributionComplete: boolean;
  missingInputs: string[];
  attendanceUsed: number;
  attendanceLabel: string;
  merchGmvCents: number;
  contributionCents: number | null;
}

export interface EventInsightsSnapshot {
  event: EventRow;
  isDemoData: boolean;
  scorecard: ExecutiveScorecard;
  rollingGa: RollingGaCommerce;
  endlessAisle: EndlessAisleImpact;
  shipping: ShippingEconomics;
  fans: FanRelationshipMetrics;
  drops: DropPerformanceRow[];
  moments: MomentPerformance[];
  baselineConnected: false;
}

export interface PilotShowRow {
  eventId: string;
  venueCity: string;
  startsAt: Date;
  attendance: number;
  verifiedFans: number;
  rollingGaGmvCents: number;
  gmvPerAttendee: MetricAvailability;
  contributionPerAttendee: MetricAvailability;
  aovCents: number;
  digitalOnlyCents: number;
  shippingSubsidyCents: number;
  consentRate: MetricAvailability;
  contributionComplete: boolean;
}

export interface PilotInsightsSnapshot {
  artistName: string;
  shows: PilotShowRow[];
  totals: {
    attendance: number;
    verifiedFans: number;
    rollingGaGmvCents: number;
    gmvPerAttendee: MetricAvailability;
    contributionPerAttendee: MetricAvailability;
    digitalOnlyCents: number;
    shippingSubsidyCents: number;
    contributionComplete: boolean;
  };
  baselineConnected: false;
  isDemoData: boolean;
}

function buildScorecard(
  merchGmvCents: number,
  contribution: ContributionResult,
  attendance: number,
  attendanceLabel: string,
): ExecutiveScorecard {
  return {
    merchGmvPerAttendee: perAttendeeMetric(merchGmvCents, attendance),
    contributionPerAttendee:
      contribution.complete && contribution.contributionCents != null
        ? perAttendeeMetric(contribution.contributionCents, attendance)
        : { status: "incomplete", value: null, missing: contribution.missingInputs },
    contributionComplete: contribution.complete,
    missingInputs: contribution.missingInputs,
    attendanceUsed: attendance,
    attendanceLabel,
    merchGmvCents,
    contributionCents: contribution.contributionCents,
  };
}

function buildEndlessAisle(lines: OrderLineRow[]): EndlessAisleImpact {
  let physicalCoreCents = 0;
  let endlessAisleCents = 0;

  for (const line of lines) {
    const product = {
      isDigital: line.isDigital ?? false,
      category: line.category ?? "apparel",
    };
    if (isPhysicalCoreProduct(product)) physicalCoreCents += line.lineTotalCents;
    if (isEndlessAisleProduct(product)) endlessAisleCents += line.lineTotalCents;
  }

  const beyondBoothCents = endlessAisleCents;
  const hasBeyondBoothData = beyondBoothCents > 0;

  return {
    physicalCoreCents,
    endlessAisleCents,
    beyondBoothCents,
    hasBeyondBoothData,
    beyondBoothStatement: hasBeyondBoothData
      ? `$${(beyondBoothCents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })} generated from products not carried at tonight's physical booth`
      : null,
  };
}

function buildShippingEconomics(
  orderMap: ReturnType<typeof groupOrdersFromLines>,
  contribution: ContributionResult,
): ShippingEconomics {
  let carrier = 0;
  let fan = 0;
  let subsidy = 0;
  let freeShipping = 0;

  for (const order of orderMap.values()) {
    carrier += order.shippingCarrierCostCents;
    fan += order.shippingCustomerChargeCents;
    subsidy += order.shippingArtistSubsidyCents;
    if (order.shippingCustomerChargeCents === 0 && order.shippingCarrierCostCents > 0) {
      freeShipping += order.shippingCarrierCostCents;
    }
  }

  const orderCount = orderMap.size;

  return {
    carrierCostCents: carrier,
    fanChargeCents: fan,
    artistSubsidyCents: subsidy,
    freeShippingCostCents: freeShipping,
    subsidyPerOrderCents: orderCount > 0 ? Math.round(subsidy / orderCount) : null,
    contributionAfterShippingCents: contribution.contributionCents,
    contributionComplete: contribution.complete,
    missingInputs: contribution.missingInputs,
  };
}

async function buildFanMetrics(
  eventId: string,
  artistId: string,
  purchaserUserIds: string[],
): Promise<FanRelationshipMetrics> {
  const verifiedAttendees = await countVerifiedAttendance(eventId);

  const [connectedRows] = await db
    .select({ total: count(sql`distinct ${verifiedAttendance.userId}`) })
    .from(verifiedAttendance)
    .innerJoin(
      artistConsents,
      and(
        eq(artistConsents.userId, verifiedAttendance.userId),
        eq(artistConsents.artistId, artistId),
        eq(artistConsents.consentType, "attendee_offers"),
        eq(artistConsents.status, "granted"),
      ),
    )
    .where(eq(verifiedAttendance.eventId, eventId));

  const connectedFans = Number(connectedRows?.total ?? 0);

  let purchasersConnected = 0;
  if (purchaserUserIds.length > 0) {
    const [row] = await db
      .select({ total: count(sql`distinct ${artistConsents.userId}`) })
      .from(artistConsents)
      .where(
        and(
          eq(artistConsents.artistId, artistId),
          eq(artistConsents.consentType, "attendee_offers"),
          eq(artistConsents.status, "granted"),
          inArray(artistConsents.userId, purchaserUserIds),
        ),
      );
    purchasersConnected = Number(row?.total ?? 0);
  }

  let repeatPurchasers = 0;
  if (purchaserUserIds.length > 0) {
    const repeatRows = await db
      .select({ userId: orders.userId, orderCount: count(orders.id) })
      .from(orders)
      .where(and(eq(orders.artistId, artistId), PAID, inArray(orders.userId, purchaserUserIds)))
      .groupBy(orders.userId);
    repeatPurchasers = repeatRows.filter((r) => Number(r.orderCount) >= 2).length;
  }

  return {
    verifiedAttendees,
    connectedFans,
    consentRate: consentRate(connectedFans, verifiedAttendees),
    purchasersConnected,
    purchasersTotal: purchaserUserIds.length,
    repeatPurchasers,
  };
}

async function buildDropPerformance(
  eventId: string,
  artistId: string,
  eligibleFans: number,
  lines: OrderLineRow[],
): Promise<DropPerformanceRow[]> {
  const eventDrops = await db
    .select()
    .from(drops)
    .where(and(eq(drops.eventId, eventId), eq(drops.artistId, artistId)))
    .orderBy(desc(drops.startsAt));

  return eventDrops.map((drop) => {
    const dropLines = lines.filter((l) => l.dropId === drop.id);
    const orderIds = new Set(dropLines.map((l) => l.orderId));
    const orderCount = orderIds.size;
    const unitCount = dropLines.reduce((s, l) => s + l.quantity, 0);
    const gmvCents = dropLines.reduce((s, l) => s + l.lineTotalCents, 0);
    const aovCents = orderCount > 0 ? Math.round(gmvCents / orderCount) : 0;

    const dropOrders = [...orderIds].map((orderId) => {
      const orderLines = dropLines.filter((l) => l.orderId === orderId);
      return {
        subtotalCents: orderLines.reduce((s, l) => s + l.lineTotalCents, 0),
        shippingCarrierCostCents: 0,
        shippingCustomerChargeCents: 0,
        shippingArtistSubsidyCents: 0,
        lines: orderLines.map((l) => ({
          quantity: l.quantity,
          unitPriceCents: Math.round(l.lineTotalCents / Math.max(1, l.quantity)),
          unitCostCents: l.unitCostCents,
        })),
      };
    });

    const contribution = aggregateContributions(dropOrders);
    const durationMinutes =
      drop.endsAt != null
        ? Math.round((drop.endsAt.getTime() - drop.startsAt.getTime()) / 60_000)
        : null;

    return {
      dropId: drop.id,
      title: drop.title,
      exclusivityType: drop.exclusivityType,
      eligibleFans,
      viewsAvailable: false as const,
      orderCount,
      unitCount,
      gmvCents,
      aovCents,
      conversion: conversionRate(orderCount, eligibleFans),
      contributionCents: contribution.contributionCents,
      contributionComplete: contribution.complete,
      missingInputs: contribution.missingInputs,
      startsAt: drop.startsAt,
      endsAt: drop.endsAt,
      durationMinutes,
    };
  });
}

export async function loadEventInsights(
  ctx: AuthContext,
  artistId: string,
  eventId: string,
): Promise<EventInsightsSnapshot | null> {
  assertArtistAccess(ctx, artistId);
  const event = await getEventById(eventId);
  if (!event || event.artistId !== artistId) return null;

  const lines = await loadPaidOrderLines(eventId, artistId);
  const orderMap = groupOrdersFromLines(lines);

  const merchGmvCents = [...orderMap.values()].reduce((s, o) => s + o.subtotalCents, 0);
  const orderCount = orderMap.size;
  const unitCount = lines.reduce((s, l) => s + l.quantity, 0);

  const contribution = aggregateContributions([...orderMap.values()]);
  const attendance = event.actualAttendance ?? (await countVerifiedAttendance(eventId));
  const attendanceLabel = event.actualAttendance != null ? "actual attendance" : "verified attendees";

  const purchaserUserIds = [...new Set([...orderMap.values()].map((o) => o.userId))];

  let digitalOnlyCents = 0;
  let cityExclusiveCents = 0;
  let flashDropCents = 0;
  let bundleCents = 0;
  let eventScopedOrders = 0;

  for (const line of lines) {
    const product = { isDigital: line.isDigital ?? false, category: line.category ?? "apparel" };
    if (isEndlessAisleProduct(product)) digitalOnlyCents += line.lineTotalCents;
    if (line.productEventId === eventId) cityExclusiveCents += line.lineTotalCents;
    if (line.dropExclusivity === "flash") flashDropCents += line.lineTotalCents;
    if (line.bundleId) bundleCents += line.lineTotalCents;
  }

  for (const order of orderMap.values()) {
    if (order.commerceSource === "event_scoped") eventScopedOrders += 1;
  }

  const verifiedAttendees = await countVerifiedAttendance(eventId);

  const [demoRow] = await db
    .select({ isDemo: events.isDemo })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  // Rebuild moments with flash detection per order
  const timing = resolveEventState(
    {
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      doorsAt: event.doorsAt,
      postShowWindowMinutes: event.postShowWindowMinutes,
      cancelled: event.cancelled,
    },
    event.tourWindowMinutes,
  );
  const momentBuckets = new Map<CommerceMoment, { orderCount: number; gmvCents: number }>();
  for (const moment of ["pre_show", "live", "encore_flash", "post_show", "other"] as CommerceMoment[]) {
    momentBuckets.set(moment, { orderCount: 0, gmvCents: 0 });
  }
  for (const [orderId, order] of orderMap) {
    if (!order.placedAt) continue;
    const orderLines = lines.filter((l) => l.orderId === orderId);
    const hasFlash = orderLines.some((l) => l.dropExclusivity === "flash");
    const moment = classifyCommerceMoment({
      placedAt: order.placedAt,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      postShowClosesAt: timing.postShowClosesAt,
      hasFlashDrop: hasFlash,
    });
    const bucket = momentBuckets.get(moment)!;
    bucket.orderCount += 1;
    bucket.gmvCents += order.subtotalCents;
    momentBuckets.set(moment, bucket);
  }

  const [fans, dropRows] = await Promise.all([
    buildFanMetrics(eventId, artistId, purchaserUserIds),
    buildDropPerformance(eventId, artistId, verifiedAttendees, lines),
  ]);

  return {
    event,
    isDemoData: Boolean(demoRow?.isDemo),
    scorecard: buildScorecard(merchGmvCents, contribution, attendance, attendanceLabel),
    rollingGa: {
      gmvCents: merchGmvCents,
      merchGmvCents,
      orderCount,
      unitCount,
      aovCents: orderCount > 0 ? Math.round(merchGmvCents / orderCount) : 0,
      conversion: conversionRate(orderCount, verifiedAttendees),
      digitalOnlyCents,
      cityExclusiveCents,
      flashDropCents,
      bundleCents,
      eventScopedOrderCount: eventScopedOrders,
    },
    endlessAisle: buildEndlessAisle(lines),
    shipping: buildShippingEconomics(orderMap, contribution),
    fans,
    drops: dropRows,
    moments: [...momentBuckets.entries()]
      .filter(([, v]) => v.orderCount > 0)
      .map(([moment, v]) => ({ moment, ...v })),
    baselineConnected: false,
  };
}

export async function loadPilotInsights(
  ctx: AuthContext,
  artistId: string,
  eventIds: string[],
): Promise<PilotInsightsSnapshot | null> {
  assertArtistAccess(ctx, artistId);
  if (eventIds.length === 0) return null;

  const [artist] = await db
    .select({ name: artists.name })
    .from(artists)
    .where(eq(artists.id, artistId))
    .limit(1);

  const shows: PilotShowRow[] = [];
  let isDemo = false;

  for (const eventId of eventIds.slice(0, 5)) {
    const snapshot = await loadEventInsights(ctx, artistId, eventId);
    if (!snapshot) continue;
    if (snapshot.isDemoData) isDemo = true;

    shows.push({
      eventId,
      venueCity: snapshot.event.venueCity,
      startsAt: snapshot.event.startsAt,
      attendance: snapshot.scorecard.attendanceUsed,
      verifiedFans: snapshot.fans.verifiedAttendees,
      rollingGaGmvCents: snapshot.rollingGa.gmvCents,
      gmvPerAttendee: snapshot.scorecard.merchGmvPerAttendee,
      contributionPerAttendee: snapshot.scorecard.contributionPerAttendee,
      aovCents: snapshot.rollingGa.aovCents,
      digitalOnlyCents: snapshot.rollingGa.digitalOnlyCents,
      shippingSubsidyCents: snapshot.shipping.artistSubsidyCents,
      consentRate: snapshot.fans.consentRate,
      contributionComplete: snapshot.scorecard.contributionComplete,
    });
  }

  const totalAttendance = shows.reduce((s, r) => s + r.attendance, 0);
  const totalVerified = shows.reduce((s, r) => s + r.verifiedFans, 0);
  const totalGmv = shows.reduce((s, r) => s + r.rollingGaGmvCents, 0);
  const totalDigital = shows.reduce((s, r) => s + r.digitalOnlyCents, 0);
  const totalSubsidy = shows.reduce((s, r) => s + r.shippingSubsidyCents, 0);

  const allComplete = shows.every((s) => s.contributionComplete);
  let totalContribution: number | null = null;
  if (allComplete) {
    totalContribution = 0;
    for (const eventId of eventIds.slice(0, 5)) {
      const snap = await loadEventInsights(ctx, artistId, eventId);
      if (snap?.scorecard.contributionCents != null) {
        totalContribution += snap.scorecard.contributionCents;
      }
    }
  }

  return {
    artistName: artist?.name ?? "Artist",
    shows,
    totals: {
      attendance: totalAttendance,
      verifiedFans: totalVerified,
      rollingGaGmvCents: totalGmv,
      gmvPerAttendee: perAttendeeMetric(totalGmv, totalAttendance),
      contributionPerAttendee:
        allComplete && totalContribution != null
          ? perAttendeeMetric(totalContribution, totalAttendance)
          : { status: "incomplete", value: null, missing: ["product cost"] },
      digitalOnlyCents: totalDigital,
      shippingSubsidyCents: totalSubsidy,
      contributionComplete: allComplete,
    },
    baselineConnected: false,
    isDemoData: isDemo,
  };
}

export async function resolveDefaultPilotEventIds(artistId: string): Promise<string[]> {
  const events = await listEventsForArtist(artistId);
  return events.slice(0, 5).map((e) => e.id);
}

export async function loadInsightsOverview(
  ctx: AuthContext,
  artistId: string,
  eventId?: string | null,
) {
  assertArtistAccess(ctx, artistId);

  let targetEventId = eventId;
  if (!targetEventId) {
    const events = await listEventsForArtist(artistId);
    targetEventId = events[0]?.id ?? null;
  }

  if (!targetEventId) return null;

  const [snapshot, pilotEventIds] = await Promise.all([
    loadEventInsights(ctx, artistId, targetEventId),
    resolveDefaultPilotEventIds(artistId),
  ]);

  return { snapshot, pilotEventIds, allEvents: await listEventsForArtist(artistId) };
}
