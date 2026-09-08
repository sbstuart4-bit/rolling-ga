import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  artists,
  drops,
  events,
  orderFulfillmentExceptions,
  orderItems,
  orders,
  shipments,
  tours,
  users,
  venues,
} from "@/db/schema";
import {
  aggregateDeliveryPerformance,
  buildFulfillmentTimeline,
  classifyDeliveryPromiseState,
  computePromisedDeliveryAt,
  countFulfillmentPipeline,
  resolveFulfillmentStatus,
} from "@/lib/fulfillment";
import {
  attentionReasonLabel,
  computeAttentionPriority,
  deriveShowOperationalHealth,
  deriveShowOperationalState,
  formatShowTimingLabel,
  isShowRelevant,
  sortAttentionItems,
} from "@/lib/ops";
import type {
  OpsAttentionItem,
  OpsCommandCenterSnapshot,
  OpsShowFilter,
  OpsShowMetrics,
} from "@/lib/ops";
import { loadGlobalProductionPressure } from "@/server/ops/production-queries";
import { loadGlobalPackingPressure } from "@/server/ops/packing-queries";
import type { DeliveryPromiseState, FulfillmentStatus } from "@/lib/types";
import { canOperateFulfillment } from "@/server/auth/guards";
import type { AuthContext } from "@/server/auth/session";
import { demoNow } from "@/server/demo/clock";
import type { FulfillmentOrderDetail, FulfillmentOrderRow } from "@/server/studio/fulfillment-queries";

function assertOpsAccess(ctx: AuthContext): void {
  if (!canOperateFulfillment(ctx)) {
    throw new Error("Ops access denied");
  }
}

function classifyOrderCommerceMoment(
  placedAt: Date | null,
  eventStartsAt: Date | null,
  eventEndsAt: Date | null,
): "show_night" | "post_show" | "other" {
  if (!placedAt || !eventStartsAt || !eventEndsAt) return "other";
  const t = placedAt.getTime();
  if (t >= eventStartsAt.getTime() && t <= eventEndsAt.getTime()) return "show_night";
  if (t > eventEndsAt.getTime()) return "post_show";
  return "other";
}

interface RawFulfillmentOrder {
  id: string;
  orderNumber: string;
  artistId: string;
  artistName: string;
  eventId: string | null;
  status: string;
  fulfillmentStatus: FulfillmentStatus | null;
  promisedDeliveryAt: Date | null;
  actualDeliveredAt: Date | null;
  placedAt: Date | null;
  totalCents: number;
  shippingName: string | null;
  estimatedDeliveryTo: Date | null;
  estimatedDeliveryFrom: Date | null;
  userDisplayName: string;
  userEmail: string;
  eventStartsAt: Date | null;
  eventEndsAt: Date | null;
  timezone: string | null;
  venueCity: string | null;
  tourName: string | null;
  unitCount: number;
}

async function loadAllFulfillmentOrders(): Promise<RawFulfillmentOrder[]> {
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      artistId: orders.artistId,
      artistName: artists.name,
      eventId: orders.eventId,
      status: orders.status,
      fulfillmentStatus: orders.fulfillmentStatus,
      promisedDeliveryAt: orders.promisedDeliveryAt,
      actualDeliveredAt: orders.actualDeliveredAt,
      placedAt: orders.placedAt,
      totalCents: orders.totalCents,
      shippingName: orders.shippingName,
      estimatedDeliveryTo: orders.estimatedDeliveryTo,
      estimatedDeliveryFrom: orders.estimatedDeliveryFrom,
      userDisplayName: users.displayName,
      userEmail: users.email,
      eventStartsAt: events.startsAt,
      eventEndsAt: events.endsAt,
      timezone: events.timezone,
      venueCity: venues.city,
      tourName: tours.name,
      unitCount: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`.mapWith(Number),
    })
    .from(orders)
    .innerJoin(artists, eq(artists.id, orders.artistId))
    .innerJoin(users, eq(users.id, orders.userId))
    .leftJoin(events, eq(events.id, orders.eventId))
    .leftJoin(venues, eq(venues.id, events.venueId))
    .leftJoin(tours, eq(tours.id, events.tourId))
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(sql`${orders.status} NOT IN ('pending', 'cancelled')`)
    .groupBy(
      orders.id,
      artists.name,
      users.displayName,
      users.email,
      events.startsAt,
      events.endsAt,
      events.timezone,
      venues.city,
      tours.name,
    )
    .orderBy(desc(orders.placedAt));

  return rows.filter((row) => row.eventId != null);
}

function buildOrderRow(
  row: RawFulfillmentOrder,
  now: Date,
  exceptions: { orderId: string; type: string; createdAt: Date; id?: string }[],
  dropTitles: Map<string, string>,
): FulfillmentOrderRow | null {
  const fulfillmentStatus = resolveFulfillmentStatus(row.fulfillmentStatus, row.status as never);
  if (!fulfillmentStatus) return null;

  const promisedDeliveryAt =
    row.promisedDeliveryAt ??
    (row.placedAt
      ? computePromisedDeliveryAt({
          placedAt: row.placedAt,
          eventStartsAt: row.eventStartsAt,
          eventEndsAt: row.eventEndsAt,
          timezone: row.timezone ?? "America/New_York",
          estimatedDeliveryTo: row.estimatedDeliveryTo,
          estimatedDeliveryFrom: row.estimatedDeliveryFrom,
        })
      : null);

  const openException = exceptions.find((e) => e.orderId === row.id);

  return {
    orderId: row.id,
    orderNumber: row.orderNumber,
    fanName: row.shippingName ?? row.userDisplayName,
    fanEmail: row.userEmail,
    placedAt: row.placedAt,
    commerceStatus: row.status,
    fulfillmentStatus,
    promisedDeliveryAt,
    actualDeliveredAt: row.actualDeliveredAt,
    promiseState: classifyDeliveryPromiseState({
      promisedDeliveryAt,
      actualDeliveredAt: row.actualDeliveredAt,
      placedAt: row.placedAt,
      fulfillmentStatus,
      now,
    }),
    totalCents: row.totalCents,
    originLabel: `${row.tourName ?? "Show"} · ${row.venueCity ?? "—"}`,
    commerceMoment: classifyOrderCommerceMoment(
      row.placedAt,
      row.eventStartsAt,
      row.eventEndsAt,
    ),
    hasOpenException: Boolean(openException),
    activationDropTitle: dropTitles.get(row.id) ?? null,
  };
}

async function loadOpenExceptions(orderIds: string[]) {
  if (orderIds.length === 0) return [];
  return db
    .select({
      id: orderFulfillmentExceptions.id,
      orderId: orderFulfillmentExceptions.orderId,
      type: orderFulfillmentExceptions.type,
      note: orderFulfillmentExceptions.note,
      createdAt: orderFulfillmentExceptions.createdAt,
    })
    .from(orderFulfillmentExceptions)
    .where(
      and(
        inArray(orderFulfillmentExceptions.orderId, orderIds),
        inArray(orderFulfillmentExceptions.status, ["open", "in_progress"]),
      ),
    );
}

async function loadActivationDropTitles(orderIds: string[]) {
  if (orderIds.length === 0) return new Map<string, string>();
  const lines = await db
    .select({
      orderId: orderItems.orderId,
      dropTitle: drops.title,
      audienceSegmentId: drops.audienceSegmentId,
    })
    .from(orderItems)
    .leftJoin(drops, eq(drops.id, orderItems.dropId))
    .where(inArray(orderItems.orderId, orderIds));

  const map = new Map<string, string>();
  for (const line of lines) {
    if (line.dropTitle && line.audienceSegmentId) {
      map.set(line.orderId, line.dropTitle);
    }
  }
  return map;
}

function buildShowMetrics(
  eventId: string,
  eventMeta: {
    artistId: string;
    artistName: string;
    tourName: string | null;
    venueCity: string;
    startsAt: Date;
    endsAt: Date;
    timezone: string;
  },
  orderRows: FulfillmentOrderRow[],
  rawUnits: number,
  now: Date,
  productionPressure?: {
    unitsWaiting: number;
    unitsAtRisk: number;
    ordersBlocked: number;
  },
  packingPressure?: {
    readyToPack: number;
    readyForHandoff: number;
    mustLeaveNext: number;
  },
): OpsShowMetrics {
  const fulfillmentStatuses = orderRows.map((o) => o.fulfillmentStatus);
  const pipeline = countFulfillmentPipeline(fulfillmentStatuses);
  const performance = aggregateDeliveryPerformance(
    orderRows.map((o) => ({
      promisedDeliveryAt: o.promisedDeliveryAt,
      actualDeliveredAt: o.actualDeliveredAt,
      placedAt: o.placedAt,
      fulfillmentStatus: o.fulfillmentStatus,
      hasOpenException: o.hasOpenException,
    })),
    now,
  );

  const operationalState = deriveShowOperationalState({
    startsAt: eventMeta.startsAt,
    endsAt: eventMeta.endsAt,
    now,
    pipeline,
    performance,
    orderCount: orderRows.length,
  });

  const health = deriveShowOperationalHealth(performance);
  const timingLabel = formatShowTimingLabel({
    startsAt: eventMeta.startsAt,
    endsAt: eventMeta.endsAt,
    now,
    operationalState,
  });

  const ordersInMotion =
    pipeline.received +
    pipeline.production +
    pipeline.packed +
    pipeline.shipped +
    pipeline.exception;

  const needsAttentionCount =
    performance.pastPromiseCount + performance.atRiskCount + performance.openExceptions;

  const undeliveredDeadlines = orderRows
    .filter(
      (o) =>
        o.fulfillmentStatus !== "delivered" &&
        o.promisedDeliveryAt &&
        (o.promiseState === "within_promise" || o.promiseState === "at_risk"),
    )
    .map((o) => o.promisedDeliveryAt!)
    .sort((a, b) => a.getTime() - b.getTime());

  return {
    eventId,
    artistId: eventMeta.artistId,
    artistName: eventMeta.artistName,
    tourName: eventMeta.tourName,
    venueCity: eventMeta.venueCity,
    startsAt: eventMeta.startsAt,
    endsAt: eventMeta.endsAt,
    timezone: eventMeta.timezone,
    operationalState,
    health,
    timingLabel,
    orderCount: orderRows.length,
    unitCount: rawUnits,
    ordersInMotion,
    pipeline,
    performance,
    needsAttentionCount,
    nextPromiseDeadline: undeliveredDeadlines[0] ?? null,
    productionUnitsWaiting: productionPressure?.unitsWaiting ?? 0,
    productionUnitsAtRisk: productionPressure?.unitsAtRisk ?? 0,
    productionOrdersBlocked: productionPressure?.ordersBlocked ?? 0,
    packingReadyToPack: packingPressure?.readyToPack ?? 0,
    packingReadyForHandoff: packingPressure?.readyForHandoff ?? 0,
    packingMustLeaveNext: packingPressure?.mustLeaveNext ?? 0,
  };
}

function buildAttentionFromOrders(
  orderRows: FulfillmentOrderRow[],
  metaByOrder: Map<string, { artistName: string; eventId: string; showLabel: string }>,
  exceptions: { orderId: string; type: string; createdAt: Date; id?: string }[],
): OpsAttentionItem[] {
  const items: OpsAttentionItem[] = [];

  for (const order of orderRows) {
    const needsAttention =
      order.hasOpenException ||
      order.promiseState === "past_promise" ||
      order.promiseState === "at_risk" ||
      order.fulfillmentStatus === "exception";

    if (!needsAttention) continue;

    const meta = metaByOrder.get(order.orderId);
    if (!meta) continue;

    const exception = exceptions.find((e) => e.orderId === order.orderId);

    items.push({
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      artistName: meta.artistName,
      showLabel: meta.showLabel,
      eventId: meta.eventId,
      reasonLabel: attentionReasonLabel({
        promiseState: order.promiseState,
        hasOpenException: order.hasOpenException,
        exceptionType: exception?.type ?? null,
        fulfillmentStatus: order.fulfillmentStatus,
      }),
      promiseState: order.promiseState,
      promisedDeliveryAt: order.promisedDeliveryAt,
      fulfillmentStatus: order.fulfillmentStatus,
      hasOpenException: order.hasOpenException,
      exceptionId: exception?.id ?? null,
      exceptionType: exception?.type ?? null,
      openedAt: exception?.createdAt ?? null,
      priority: computeAttentionPriority({
        promiseState: order.promiseState,
        hasOpenException: order.hasOpenException,
        fulfillmentStatus: order.fulfillmentStatus,
      }),
    });
  }

  return sortAttentionItems(items);
}

export async function loadOpsCommandCenter(
  ctx: AuthContext,
  filter: OpsShowFilter = "all",
): Promise<OpsCommandCenterSnapshot> {
  assertOpsAccess(ctx);
  const now = demoNow();

  const rawOrders = await loadAllFulfillmentOrders();
  const orderIds = rawOrders.map((r) => r.id);
  const [exceptions, dropTitles] = await Promise.all([
    loadOpenExceptions(orderIds),
    loadActivationDropTitles(orderIds),
  ]);

  const orderRowsByEvent = new Map<string, FulfillmentOrderRow[]>();
  const unitsByEvent = new Map<string, number>();
  const metaByOrder = new Map<string, { artistName: string; eventId: string; showLabel: string }>();
  const eventMeta = new Map<
    string,
    {
      artistId: string;
      artistName: string;
      tourName: string | null;
      venueCity: string;
      startsAt: Date;
      endsAt: Date;
      timezone: string;
    }
  >();

  const allOrderRows: FulfillmentOrderRow[] = [];

  for (const raw of rawOrders) {
    if (!raw.eventId || !raw.eventStartsAt || !raw.eventEndsAt) continue;

    const row = buildOrderRow(raw, now, exceptions, dropTitles);
    if (!row) continue;

    allOrderRows.push(row);
    const list = orderRowsByEvent.get(raw.eventId) ?? [];
    list.push(row);
    orderRowsByEvent.set(raw.eventId, list);
    unitsByEvent.set(raw.eventId, (unitsByEvent.get(raw.eventId) ?? 0) + raw.unitCount);

    metaByOrder.set(row.orderId, {
      artistName: raw.artistName,
      eventId: raw.eventId,
      showLabel: `${raw.venueCity ?? "—"} · ${raw.tourName ?? "Show"}`,
    });

    if (!eventMeta.has(raw.eventId)) {
      eventMeta.set(raw.eventId, {
        artistId: raw.artistId,
        artistName: raw.artistName,
        tourName: raw.tourName,
        venueCity: raw.venueCity ?? "—",
        startsAt: raw.eventStartsAt,
        endsAt: raw.eventEndsAt,
        timezone: raw.timezone ?? "America/New_York",
      });
    }
  }

  const shows: OpsShowMetrics[] = [];
  const [productionPressure, packingPressure] = await Promise.all([
    loadGlobalProductionPressure(ctx),
    loadGlobalPackingPressure(ctx),
  ]);

  for (const [eventId, meta] of eventMeta) {
    const orderRows = orderRowsByEvent.get(eventId) ?? [];
    const pressure = productionPressure.get(eventId);
    const packPressure = packingPressure.get(eventId);
    const metrics = buildShowMetrics(
      eventId,
      meta,
      orderRows,
      unitsByEvent.get(eventId) ?? 0,
      now,
      pressure,
      packPressure,
    );

    if (
      !isShowRelevant({
        startsAt: meta.startsAt,
        endsAt: meta.endsAt,
        now,
        orderCount: orderRows.length,
        pipeline: metrics.pipeline,
      })
    ) {
      continue;
    }

    shows.push(metrics);
  }

  const stateRank: Record<string, number> = {
    at_risk: 0,
    live: 1,
    fulfilling: 2,
    upcoming: 3,
    complete: 4,
  };

  shows.sort((a, b) => {
    const rankDiff = (stateRank[a.operationalState] ?? 5) - (stateRank[b.operationalState] ?? 5);
    if (rankDiff !== 0) return rankDiff;
    if (b.needsAttentionCount !== a.needsAttentionCount) {
      return b.needsAttentionCount - a.needsAttentionCount;
    }
    return b.endsAt.getTime() - a.endsAt.getTime();
  });

  const filteredShows =
    filter === "all"
      ? shows
      : shows.filter((show) => {
          if (filter === "live") return show.operationalState === "live";
          if (filter === "fulfilling") {
            return show.operationalState === "fulfilling" || show.operationalState === "at_risk";
          }
          if (filter === "at_risk") return show.operationalState === "at_risk";
          if (filter === "complete") return show.operationalState === "complete";
          return true;
        });

  const attention = buildAttentionFromOrders(allOrderRows, metaByOrder, exceptions);

  const globalOrdersInFulfillment = shows.reduce((sum, s) => sum + s.ordersInMotion, 0);
  const globalDelivered = shows.reduce((sum, s) => sum + s.pipeline.delivered, 0);
  const globalAtRisk = shows.reduce((sum, s) => sum + s.performance.atRiskCount, 0);
  const globalPastPromise = shows.reduce((sum, s) => sum + s.performance.pastPromiseCount, 0);
  const globalExceptions = shows.reduce((sum, s) => sum + s.performance.openExceptions, 0);

  return {
    generatedAt: now,
    global: {
      activeShows: shows.filter((s) => s.operationalState !== "complete" && s.operationalState !== "upcoming").length,
      totalOrders: shows.reduce((sum, s) => sum + s.orderCount, 0),
      ordersInFulfillment: globalOrdersInFulfillment,
      delivered: globalDelivered,
      atRisk: globalAtRisk,
      pastPromise: globalPastPromise,
      openExceptions: globalExceptions,
      needsAttention: attention.length,
    },
    shows: filteredShows,
    attention: attention.slice(0, 25),
  };
}

export async function loadOpsShowDetail(
  ctx: AuthContext,
  eventId: string,
): Promise<{ show: OpsShowMetrics; orders: FulfillmentOrderRow[]; attention: OpsAttentionItem[] } | null> {
  assertOpsAccess(ctx);
  const snapshot = await loadOpsCommandCenter(ctx, "all");
  const show = snapshot.shows.find((s) => s.eventId === eventId);

  if (!show) {
    const [event] = await db
      .select({
        id: events.id,
        artistId: events.artistId,
        artistName: artists.name,
        tourName: tours.name,
        venueCity: venues.city,
        startsAt: events.startsAt,
        endsAt: events.endsAt,
        timezone: events.timezone,
      })
      .from(events)
      .innerJoin(artists, eq(artists.id, events.artistId))
      .leftJoin(venues, eq(venues.id, events.venueId))
      .leftJoin(tours, eq(tours.id, events.tourId))
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) return null;

    const now = demoNow();
    const emptyShow = buildShowMetrics(
      eventId,
      {
        artistId: event.artistId,
        artistName: event.artistName,
        tourName: event.tourName,
        venueCity: event.venueCity ?? "—",
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        timezone: event.timezone,
      },
      [],
      0,
      now,
    );
    return { show: emptyShow, orders: [], attention: [] };
  }

  const now = demoNow();
  const rawOrders = (await loadAllFulfillmentOrders()).filter((r) => r.eventId === eventId);
  const orderIds = rawOrders.map((r) => r.id);
  const [exceptions, dropTitles] = await Promise.all([
    loadOpenExceptions(orderIds),
    loadActivationDropTitles(orderIds),
  ]);

  const orders = rawOrders
    .map((raw) => buildOrderRow(raw, now, exceptions, dropTitles))
    .filter((r): r is FulfillmentOrderRow => r != null);

  const metaByOrder = new Map(
    rawOrders.map((raw) => [
      raw.id,
      {
        artistName: raw.artistName,
        eventId: raw.eventId!,
        showLabel: `${raw.venueCity ?? "—"} · ${raw.tourName ?? "Show"}`,
      },
    ]),
  );

  const attention = buildAttentionFromOrders(orders, metaByOrder, exceptions);

  return { show, orders, attention };
}

export async function loadOpsFulfillmentOrderDetail(
  ctx: AuthContext,
  orderId: string,
): Promise<(FulfillmentOrderDetail & { artistName: string; eventId: string | null }) | null> {
  assertOpsAccess(ctx);

  const [row] = await db
    .select({
      id: orders.id,
      artistId: orders.artistId,
      artistName: artists.name,
      eventId: orders.eventId,
      orderNumber: orders.orderNumber,
      status: orders.status,
      fulfillmentStatus: orders.fulfillmentStatus,
      promisedDeliveryAt: orders.promisedDeliveryAt,
      actualDeliveredAt: orders.actualDeliveredAt,
      fulfillmentReceivedAt: orders.fulfillmentReceivedAt,
      productionStartedAt: orders.productionStartedAt,
      fulfillmentPackedAt: orders.fulfillmentPackedAt,
      fulfillmentShippedAt: orders.fulfillmentShippedAt,
      placedAt: orders.placedAt,
      totalCents: orders.totalCents,
      shippingName: orders.shippingName,
      estimatedDeliveryTo: orders.estimatedDeliveryTo,
      estimatedDeliveryFrom: orders.estimatedDeliveryFrom,
      isDemo: orders.isDemo,
      userDisplayName: users.displayName,
      userEmail: users.email,
      eventStartsAt: events.startsAt,
      eventEndsAt: events.endsAt,
      timezone: events.timezone,
      venueCity: venues.city,
      tourName: tours.name,
    })
    .from(orders)
    .innerJoin(artists, eq(artists.id, orders.artistId))
    .innerJoin(users, eq(users.id, orders.userId))
    .leftJoin(events, eq(events.id, orders.eventId))
    .leftJoin(venues, eq(venues.id, events.venueId))
    .leftJoin(tours, eq(tours.id, events.tourId))
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!row) return null;

  const fulfillmentStatus = resolveFulfillmentStatus(row.fulfillmentStatus, row.status as never);
  const now = demoNow();

  const promisedDeliveryAt =
    row.promisedDeliveryAt ??
    (row.placedAt
      ? computePromisedDeliveryAt({
          placedAt: row.placedAt,
          eventStartsAt: row.eventStartsAt,
          eventEndsAt: row.eventEndsAt,
          timezone: row.timezone ?? "America/New_York",
          estimatedDeliveryTo: row.estimatedDeliveryTo,
          estimatedDeliveryFrom: row.estimatedDeliveryFrom,
        })
      : null);

  const [items, shipmentRows, exceptions, activationLine] = await Promise.all([
    db
      .select({
        name: orderItems.nameSnapshot,
        size: orderItems.sizeSnapshot,
        quantity: orderItems.quantity,
        totalCents: orderItems.totalCents,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId)),
    db.select().from(shipments).where(eq(shipments.orderId, orderId)).limit(1),
    db
      .select()
      .from(orderFulfillmentExceptions)
      .where(eq(orderFulfillmentExceptions.orderId, orderId)),
    db
      .select({ dropTitle: drops.title, audienceSegmentId: drops.audienceSegmentId })
      .from(orderItems)
      .innerJoin(drops, eq(drops.id, orderItems.dropId))
      .where(and(eq(orderItems.orderId, orderId), sql`${drops.audienceSegmentId} IS NOT NULL`))
      .limit(1),
  ]);

  const shipment = shipmentRows[0];

  return {
    artistName: row.artistName,
    eventId: row.eventId,
    orderId: row.id,
    orderNumber: row.orderNumber,
    fanName: row.shippingName ?? row.userDisplayName,
    fanEmail: row.userEmail,
    placedAt: row.placedAt,
    commerceStatus: row.status,
    fulfillmentStatus,
    promisedDeliveryAt,
    actualDeliveredAt: row.actualDeliveredAt,
    promiseState: classifyDeliveryPromiseState({
      promisedDeliveryAt,
      actualDeliveredAt: row.actualDeliveredAt,
      placedAt: row.placedAt,
      fulfillmentStatus,
      now,
    }),
    totalCents: row.totalCents,
    originLabel: `${row.tourName ?? "Show"} · ${row.venueCity ?? "—"}`,
    commerceMoment: classifyOrderCommerceMoment(
      row.placedAt,
      row.eventStartsAt,
      row.eventEndsAt,
    ),
    activationDropTitle:
      activationLine[0]?.audienceSegmentId ? activationLine[0].dropTitle : null,
    items: items.map((i) => ({
      name: i.name,
      size: i.size,
      quantity: i.quantity,
      totalCents: i.totalCents,
    })),
    timeline: buildFulfillmentTimeline({
      fulfillmentReceivedAt: row.fulfillmentReceivedAt,
      productionStartedAt: row.productionStartedAt,
      fulfillmentPackedAt: row.fulfillmentPackedAt,
      fulfillmentShippedAt: row.fulfillmentShippedAt,
      actualDeliveredAt: row.actualDeliveredAt,
      placedAt: row.placedAt,
    }),
    shipment: shipment
      ? {
          carrier: shipment.carrier,
          service: shipment.service,
          trackingNumber: shipment.trackingNumber,
          status: shipment.status,
          shippedAt: shipment.shippedAt,
          deliveredAt: shipment.deliveredAt,
        }
      : null,
    exceptions: exceptions.map((e) => ({
      id: e.id,
      type: e.type,
      status: e.status,
      note: e.note,
      createdAt: e.createdAt,
      resolvedAt: e.resolvedAt,
    })),
    isDemoData: row.isDemo ?? false,
  };
}

export async function reconcileOpsWithStudioBrooklyn(
  ctx: AuthContext,
  artistId: string,
  eventId: string,
  studioSnapshot: {
    pipeline: { total: number };
    performance: { openExceptions: number; atRiskCount: number; pastPromiseCount: number };
  },
): Promise<boolean> {
  assertOpsAccess(ctx);
  const ops = await loadOpsShowDetail(ctx, eventId);
  if (!ops) return false;
  return (
    ops.show.orderCount === studioSnapshot.pipeline.total &&
    ops.show.performance.openExceptions === studioSnapshot.performance.openExceptions &&
    ops.show.performance.atRiskCount === studioSnapshot.performance.atRiskCount &&
    ops.show.performance.pastPromiseCount === studioSnapshot.performance.pastPromiseCount
  );
}
