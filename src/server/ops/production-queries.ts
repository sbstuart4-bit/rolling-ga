import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  artists,
  drops,
  events,
  orderFulfillmentExceptions,
  orderItems,
  orders,
  productionWork,
  tours,
  venues,
} from "@/db/schema";
import {
  classifyDeliveryPromiseState,
  computePromisedDeliveryAt,
  resolveFulfillmentStatus,
} from "@/lib/fulfillment";
import {
  aggregateVariantGroups,
  compareProductionPriority,
  computeProductionPriority,
  deriveOrderProductionStatus,
  ordersBlockedByEvent,
  summarizeProductionByShow,
  type OrderProductionStatus,
  type ProductionBlockedOrder,
  type ProductionQueueFilter,
  type ProductionQueueSnapshot,
  type ProductionShowSummary,
  type ProductionVariantGroup,
  type ProductionWorkRow,
  type ProductionWorkUnit,
} from "@/lib/production";
import type { DeliveryPromiseState, FulfillmentStatus } from "@/lib/types";
import { canOperateFulfillment } from "@/server/auth/guards";
import type { AuthContext } from "@/server/auth/session";
import { demoNow } from "@/server/demo/clock";

function assertProductionAccess(ctx: AuthContext): void {
  if (!canOperateFulfillment(ctx)) {
    throw new Error("Production access denied");
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

async function loadProductionUnits(eventId?: string | null): Promise<ProductionWorkUnit[]> {
  const now = demoNow();

  const rows = await db
    .select({
      id: productionWork.id,
      orderItemId: productionWork.orderItemId,
      orderId: productionWork.orderId,
      orderNumber: orders.orderNumber,
      artistId: productionWork.artistId,
      artistName: artists.name,
      eventId: productionWork.eventId,
      venueCity: venues.city,
      tourName: tours.name,
      productId: productionWork.productId,
      productName: productionWork.nameSnapshot,
      variantId: productionWork.variantId,
      size: productionWork.sizeSnapshot,
      unitIndex: productionWork.unitIndex,
      status: productionWork.status,
      requirementMode: productionWork.requirementMode,
      queuedAt: productionWork.queuedAt,
      startedAt: productionWork.startedAt,
      completedAt: productionWork.completedAt,
      placedAt: orders.placedAt,
      commerceStatus: orders.status,
      fulfillmentStatus: orders.fulfillmentStatus,
      promisedDeliveryAt: orders.promisedDeliveryAt,
      actualDeliveredAt: orders.actualDeliveredAt,
      eventStartsAt: events.startsAt,
      eventEndsAt: events.endsAt,
      timezone: events.timezone,
      estimatedDeliveryTo: orders.estimatedDeliveryTo,
      estimatedDeliveryFrom: orders.estimatedDeliveryFrom,
      dropTitle: drops.title,
      audienceSegmentId: drops.audienceSegmentId,
    })
    .from(productionWork)
    .innerJoin(orders, eq(orders.id, productionWork.orderId))
    .innerJoin(artists, eq(artists.id, productionWork.artistId))
    .leftJoin(events, eq(events.id, productionWork.eventId))
    .leftJoin(venues, eq(venues.id, events.venueId))
    .leftJoin(tours, eq(tours.id, events.tourId))
    .leftJoin(orderItems, eq(orderItems.id, productionWork.orderItemId))
    .leftJoin(drops, eq(drops.id, orderItems.dropId))
    .where(
      eventId
        ? and(eq(productionWork.eventId, eventId), eq(productionWork.requirementMode, "on_demand"))
        : eq(productionWork.requirementMode, "on_demand"),
    );

  const orderIds = [...new Set(rows.map((r) => r.orderId))];
  const exceptions =
    orderIds.length > 0
      ? await db
          .select({
            orderId: orderFulfillmentExceptions.orderId,
            id: orderFulfillmentExceptions.id,
            type: orderFulfillmentExceptions.type,
          })
          .from(orderFulfillmentExceptions)
          .where(
            and(
              inArray(orderFulfillmentExceptions.orderId, orderIds),
              inArray(orderFulfillmentExceptions.status, ["open", "in_progress"]),
            ),
          )
      : [];

  const productionExceptionOrders = new Map<string, { id: string; type: string }>();
  for (const e of exceptions) {
    if (e.type === "production_delay" || e.type === "item_unavailable") {
      productionExceptionOrders.set(e.orderId, { id: e.id, type: e.type });
    }
  }

  return rows.map((row) => {
    const fulfillmentStatus = resolveFulfillmentStatus(
      row.fulfillmentStatus as FulfillmentStatus | null,
      row.commerceStatus as never,
    );
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

    const promiseState: DeliveryPromiseState = classifyDeliveryPromiseState({
      promisedDeliveryAt,
      actualDeliveredAt: row.actualDeliveredAt,
      placedAt: row.placedAt,
      fulfillmentStatus,
      now,
    });

    const productionException = productionExceptionOrders.get(row.orderId);
    const hasProductionException = Boolean(productionException);
    const { priority, reason, label } = computeProductionPriority({
      promiseState,
      hasProductionException,
      promisedDeliveryAt,
      queuedAt: row.queuedAt,
    });

    return {
      id: row.id,
      orderItemId: row.orderItemId,
      orderId: row.orderId,
      orderNumber: row.orderNumber,
      artistId: row.artistId,
      artistName: row.artistName,
      eventId: row.eventId,
      showLabel: `${row.venueCity ?? "—"} · ${row.tourName ?? "Show"}`,
      productId: row.productId,
      productName: row.productName,
      variantId: row.variantId,
      size: row.size,
      unitIndex: row.unitIndex,
      status: row.status,
      requirementMode: row.requirementMode,
      promisedDeliveryAt,
      promiseState,
      hasProductionException,
      openExceptionId: productionException?.id ?? null,
      openExceptionType: productionException?.type ?? null,
      commerceMoment: classifyOrderCommerceMoment(
        row.placedAt,
        row.eventStartsAt,
        row.eventEndsAt,
      ),
      activationDropTitle: row.audienceSegmentId ? row.dropTitle : null,
      queuedAt: row.queuedAt,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      priority,
      priorityReason: reason,
      priorityLabel: label,
    };
  });
}

function filterUnits(units: ProductionWorkUnit[], filter: ProductionQueueFilter): ProductionWorkUnit[] {
  switch (filter) {
    case "queued":
      return units.filter((u) => u.status === "queued");
    case "in_production":
      return units.filter((u) => u.status === "in_production");
    case "at_risk":
      return units.filter(
        (u) =>
          u.status !== "complete" &&
          (u.promiseState === "at_risk" || u.promiseState === "past_promise"),
      );
    case "complete":
      return units.filter((u) => u.status === "complete");
    default:
      return units;
  }
}

export async function loadProductionQueue(
  ctx: AuthContext,
  filter: ProductionQueueFilter = "all",
  eventId?: string | null,
): Promise<ProductionQueueSnapshot> {
  assertProductionAccess(ctx);
  const now = demoNow();
  const allUnits = await loadProductionUnits(eventId ?? undefined);
  const units = filterUnits(allUnits, filter);
  const groups = aggregateVariantGroups(allUnits);

  const eventMeta = new Map<string, { tourName: string | null; venueCity: string }>();
  for (const unit of allUnits) {
    if (unit.eventId && !eventMeta.has(unit.eventId)) {
      const [event] = await db
        .select({ tourName: tours.name, venueCity: venues.city })
        .from(events)
        .leftJoin(venues, eq(venues.id, events.venueId))
        .leftJoin(tours, eq(tours.id, events.tourId))
        .where(eq(events.id, unit.eventId))
        .limit(1);
      if (event) {
        eventMeta.set(unit.eventId, {
          tourName: event.tourName,
          venueCity: event.venueCity ?? "—",
        });
      }
    }
  }

  const blockedByEvent = ordersBlockedByEvent(allUnits);
  const showSummaries = summarizeProductionByShow(groups, eventMeta, blockedByEvent);

  const remaining = allUnits.filter((u) => u.status !== "complete");
  const needsNow = remaining.filter((u) => u.status === "queued" || u.status === "in_production");
  const atRisk = remaining.filter(
    (u) => u.promiseState === "at_risk" || u.promiseState === "past_promise",
  );
  const pastPromise = remaining.filter((u) => u.promiseState === "past_promise");

  const { ordersWaiting, ordersReadyToPack } = await countOrderProductionStates(allUnits);

  const displayGroups =
    filter === "all"
      ? groups.filter((g) => g.unitsRemaining > 0)
      : filter === "complete"
        ? aggregateVariantGroups(units).filter((g) => g.unitsComplete > 0)
        : aggregateVariantGroups(units);

  const urgentGroups = groups
    .filter((g) => g.unitsRemaining > 0)
    .sort((a, b) => compareProductionPriority(
      { priority: a.priority, promisedDeliveryAt: a.earliestPromise, queuedAt: new Date(0) },
      { priority: b.priority, promisedDeliveryAt: b.earliestPromise, queuedAt: new Date(0) },
    ))
    .slice(0, 12);

  const blockedOrderMap = new Map<string, ProductionBlockedOrder>();
  for (const unit of allUnits) {
    if (!unit.hasProductionException || !unit.openExceptionId) continue;
    if (blockedOrderMap.has(unit.orderId)) continue;
    blockedOrderMap.set(unit.orderId, {
      orderId: unit.orderId,
      orderNumber: unit.orderNumber,
      artistName: unit.artistName,
      showLabel: unit.showLabel,
      exceptionType: unit.openExceptionType ?? "production_delay",
      openExceptionId: unit.openExceptionId,
      priorityLabel: unit.priorityLabel,
    });
  }
  const blockedOrders = [...blockedOrderMap.values()];

  return {
    generatedAt: now,
    summary: {
      unitsQueued: allUnits.filter((u) => u.status === "queued").length,
      unitsInProduction: allUnits.filter((u) => u.status === "in_production").length,
      unitsComplete: allUnits.filter((u) => u.status === "complete").length,
      unitsNeedsProductionNow: needsNow.length,
      unitsAtRisk: atRisk.length,
      unitsPastPromise: pastPromise.length,
      ordersWaitingOnProduction: ordersWaiting,
      ordersReadyToPack: ordersReadyToPack,
    },
    urgentGroups,
    blockedOrders,
    showSummaries,
    variantGroups: displayGroups,
  };
}

async function countOrderProductionStates(allUnits: ProductionWorkUnit[]): Promise<{
  ordersWaiting: number;
  ordersReadyToPack: number;
}> {
  const rowsByOrder = new Map<string, ProductionWorkRow[]>();

  for (const unit of allUnits) {
    if (!rowsByOrder.has(unit.orderId)) {
      rowsByOrder.set(unit.orderId, []);
    }
    rowsByOrder.get(unit.orderId)!.push({
      orderItemId: unit.orderItemId,
      productName: unit.productName,
      size: unit.size,
      status: unit.status,
      requirementMode: unit.requirementMode,
    });
  }

  const orderIds = [...rowsByOrder.keys()];
  if (orderIds.length === 0) {
    return { ordersWaiting: 0, ordersReadyToPack: 0 };
  }

  const orderRows = await db
    .select({
      id: orders.id,
      fulfillmentStatus: orders.fulfillmentStatus,
      commerceStatus: orders.status,
    })
    .from(orders)
    .where(inArray(orders.id, orderIds));

  const fulfillmentByOrder = new Map<string, FulfillmentStatus | null>();
  for (const order of orderRows) {
    fulfillmentByOrder.set(
      order.id,
      resolveFulfillmentStatus(
        order.fulfillmentStatus as FulfillmentStatus | null,
        order.commerceStatus as never,
      ),
    );
  }

  let ordersWaiting = 0;
  let ordersReadyToPack = 0;

  for (const [orderId, rows] of rowsByOrder) {
    const status = deriveOrderProductionStatus(rows, fulfillmentByOrder.get(orderId) ?? null);
    if (!status.isProductionComplete && status.orderProductionState !== "not_applicable") {
      ordersWaiting += 1;
    }
    if (status.readyToPack) ordersReadyToPack += 1;
  }

  return { ordersWaiting, ordersReadyToPack };
}

export async function loadOrderProductionStatus(
  ctx: AuthContext,
  orderId: string,
): Promise<OrderProductionStatus> {
  assertProductionAccess(ctx);

  const rows = await db
    .select({
      orderItemId: productionWork.orderItemId,
      productName: productionWork.nameSnapshot,
      size: productionWork.sizeSnapshot,
      status: productionWork.status,
      requirementMode: productionWork.requirementMode,
      fulfillmentStatus: orders.fulfillmentStatus,
      commerceStatus: orders.status,
    })
    .from(productionWork)
    .innerJoin(orders, eq(orders.id, productionWork.orderId))
    .where(eq(productionWork.orderId, orderId));

  const fulfillmentStatus = resolveFulfillmentStatus(
    rows[0]?.fulfillmentStatus as FulfillmentStatus | null,
    rows[0]?.commerceStatus as never,
  );

  return deriveOrderProductionStatus(
    rows.map((r) => ({
      orderItemId: r.orderItemId,
      productName: r.productName,
      size: r.size,
      status: r.status,
      requirementMode: r.requirementMode,
    })),
    fulfillmentStatus,
  );
}

export async function loadShowProductionSummary(
  ctx: AuthContext,
  eventId: string,
): Promise<ProductionShowSummary | null> {
  const snapshot = await loadProductionQueue(ctx, "all", eventId);
  return snapshot.showSummaries.find((s) => s.eventId === eventId) ?? null;
}

export async function loadGlobalProductionPressure(
  ctx: AuthContext,
): Promise<Map<string, { unitsWaiting: number; unitsAtRisk: number; ordersBlocked: number }>> {
  assertProductionAccess(ctx);
  const units = await loadProductionUnits();
  const blockedByEvent = ordersBlockedByEvent(units);
  const map = new Map<string, { unitsWaiting: number; unitsAtRisk: number; ordersBlocked: number }>();

  for (const unit of units) {
    if (!unit.eventId || unit.status === "complete") continue;
    const existing = map.get(unit.eventId) ?? { unitsWaiting: 0, unitsAtRisk: 0, ordersBlocked: 0 };
    existing.unitsWaiting += 1;
    if (unit.promiseState === "at_risk" || unit.promiseState === "past_promise") {
      existing.unitsAtRisk += 1;
    }
    map.set(unit.eventId, existing);
  }

  for (const [eventId, count] of blockedByEvent) {
    const existing = map.get(eventId) ?? { unitsWaiting: 0, unitsAtRisk: 0, ordersBlocked: 0 };
    existing.ordersBlocked = count;
    map.set(eventId, existing);
  }

  return map;
}

export type { ProductionVariantGroup };
