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
  shipments,
  tours,
  venues,
} from "@/db/schema";
import {
  classifyDeliveryPromiseState,
  computePromisedDeliveryAt,
  resolveFulfillmentStatus,
} from "@/lib/fulfillment";
import {
  buildPackQueueSnapshot,
  computeHandoffTargetAt,
  computePackPriority,
  derivePackOperationalState,
  isBlockingPackException,
  type PackOrderCard,
  type PackQueueFilter,
  type PackQueueSnapshot,
  type PackShowSummary,
} from "@/lib/packing";
import type { DeliveryPromiseState, FulfillmentExceptionType, FulfillmentStatus } from "@/lib/types";
import { canOperateFulfillment } from "@/server/auth/guards";
import type { AuthContext } from "@/server/auth/session";
import { demoNow } from "@/server/demo/clock";

function assertPackingAccess(ctx: AuthContext): void {
  if (!canOperateFulfillment(ctx)) {
    throw new Error("Packing access denied");
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

function filterPackOrders(orders: PackOrderCard[], filter: PackQueueFilter): PackOrderCard[] {
  switch (filter) {
    case "ready_to_pack":
      return orders.filter((o) => o.operationalState === "ready_to_pack");
    case "packing":
      return orders.filter((o) => o.operationalState === "packing");
    case "ready_for_handoff":
      return orders.filter(
        (o) => o.operationalState === "ready_for_handoff" || o.operationalState === "packed",
      );
    case "handed_to_carrier":
      return orders.filter((o) => o.operationalState === "handed_to_carrier");
    case "blocked":
      return orders.filter((o) => o.operationalState === "blocked");
    case "at_risk":
      return orders.filter(
        (o) => o.promiseState === "at_risk" || o.promiseState === "past_promise",
      );
    default:
      return orders.filter((o) =>
        [
          "ready_to_pack",
          "packing",
          "packed",
          "ready_for_handoff",
          "handed_to_carrier",
          "blocked",
        ].includes(o.operationalState),
      );
  }
}

async function loadPackOrderCards(eventId?: string | null): Promise<PackOrderCard[]> {
  const now = demoNow();

  const rows = await db
    .select({
      orderId: orders.id,
      orderNumber: orders.orderNumber,
      artistName: artists.name,
      eventId: orders.eventId,
      venueCity: venues.city,
      tourName: tours.name,
      placedAt: orders.placedAt,
      commerceStatus: orders.status,
      fulfillmentStatus: orders.fulfillmentStatus,
      promisedDeliveryAt: orders.promisedDeliveryAt,
      actualDeliveredAt: orders.actualDeliveredAt,
      packingStartedAt: orders.packingStartedAt,
      fulfillmentPackedAt: orders.fulfillmentPackedAt,
      readyForHandoffAt: orders.readyForHandoffAt,
      handedToCarrierAt: orders.handedToCarrierAt,
      fulfillmentShippedAt: orders.fulfillmentShippedAt,
      eventStartsAt: events.startsAt,
      eventEndsAt: events.endsAt,
      timezone: events.timezone,
      estimatedDeliveryTo: orders.estimatedDeliveryTo,
      estimatedDeliveryFrom: orders.estimatedDeliveryFrom,
    })
    .from(orders)
    .innerJoin(artists, eq(artists.id, orders.artistId))
    .leftJoin(events, eq(events.id, orders.eventId))
    .leftJoin(venues, eq(venues.id, events.venueId))
    .leftJoin(tours, eq(tours.id, events.tourId))
    .where(
      and(
        eventId ? eq(orders.eventId, eventId) : sql`true`,
        sql`${orders.status} NOT IN ('pending', 'cancelled', 'returned')`,
        sql`(${orders.fulfillmentStatus} IS NULL OR ${orders.fulfillmentStatus} NOT IN ('delivered'))`,
      ),
    );

  if (rows.length === 0) return [];

  const orderIds = rows.map((r) => r.orderId);

  const [productionRows, itemRows, shipmentRows, exceptions, activationLines] = await Promise.all([
    db
      .select({
        orderId: productionWork.orderId,
        orderItemId: productionWork.orderItemId,
        productName: productionWork.nameSnapshot,
        size: productionWork.sizeSnapshot,
        status: productionWork.status,
        requirementMode: productionWork.requirementMode,
      })
      .from(productionWork)
      .where(inArray(productionWork.orderId, orderIds)),
    db
      .select({
        orderId: orderItems.orderId,
        productName: orderItems.nameSnapshot,
        size: orderItems.sizeSnapshot,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds)),
    db.select().from(shipments).where(inArray(shipments.orderId, orderIds)),
    db
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
      ),
    db
      .select({
        orderId: orderItems.orderId,
        dropTitle: drops.title,
        audienceSegmentId: drops.audienceSegmentId,
      })
      .from(orderItems)
      .leftJoin(drops, eq(drops.id, orderItems.dropId))
      .where(inArray(orderItems.orderId, orderIds)),
  ]);

  const productionByOrder = new Map<string, typeof productionRows>();
  for (const row of productionRows) {
    const list = productionByOrder.get(row.orderId) ?? [];
    list.push(row);
    productionByOrder.set(row.orderId, list);
  }

  const itemsByOrder = new Map<string, typeof itemRows>();
  for (const row of itemRows) {
    const list = itemsByOrder.get(row.orderId) ?? [];
    list.push(row);
    itemsByOrder.set(row.orderId, list);
  }

  const shipmentByOrder = new Map(shipmentRows.map((s) => [s.orderId, s]));

  const exceptionsByOrder = new Map<string, { types: FulfillmentExceptionType[]; id: string | null }>();
  for (const row of exceptions) {
    const existing = exceptionsByOrder.get(row.orderId) ?? { types: [], id: null };
    existing.types.push(row.type as FulfillmentExceptionType);
    if (!existing.id) existing.id = row.id;
    exceptionsByOrder.set(row.orderId, existing);
  }

  const activationByOrder = new Map<string, string>();
  for (const line of activationLines) {
    if (line.dropTitle && line.audienceSegmentId) {
      activationByOrder.set(line.orderId, line.dropTitle);
    }
  }

  const cards: PackOrderCard[] = [];

  for (const row of rows) {
    const fulfillmentStatus = resolveFulfillmentStatus(
      row.fulfillmentStatus as FulfillmentStatus | null,
      row.commerceStatus as never,
    );

    if (fulfillmentStatus === "delivered" || row.actualDeliveredAt) continue;
    if (fulfillmentStatus === "shipped" && row.fulfillmentShippedAt) continue;

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

    const exceptionInfo = exceptionsByOrder.get(row.orderId);
    const openExceptionTypes = exceptionInfo?.types ?? [];
    const readinessInput = {
      fulfillmentStatus,
      commerceStatus: row.commerceStatus,
      productionRows: productionByOrder.get(row.orderId) ?? [],
      openExceptionTypes,
      packingStartedAt: row.packingStartedAt,
      fulfillmentPackedAt: row.fulfillmentPackedAt,
      readyForHandoffAt: row.readyForHandoffAt,
      handedToCarrierAt: row.handedToCarrierAt,
      fulfillmentShippedAt: row.fulfillmentShippedAt,
      actualDeliveredAt: row.actualDeliveredAt,
    };

    const { state, blockedReason } = derivePackOperationalState(readinessInput);
    if (state === "not_applicable" || state === "delivered" || state === "shipped") continue;

    const hasBlockingException = openExceptionTypes.some(isBlockingPackException);
    const { priority, reason, label } = computePackPriority({
      promiseState,
      hasBlockingException,
      promisedDeliveryAt,
      placedAt: row.placedAt,
    });

    const lines = (itemsByOrder.get(row.orderId) ?? []).map((item) => ({
      productName: item.productName,
      size: item.size,
      quantity: item.quantity,
    }));

    const shipment = shipmentByOrder.get(row.orderId);

    cards.push({
      orderId: row.orderId,
      orderNumber: row.orderNumber,
      artistName: row.artistName,
      eventId: row.eventId,
      showLabel: `${row.venueCity ?? "—"} · ${row.tourName ?? "Show"}`,
      itemCount: lines.length,
      unitCount: lines.reduce((sum, l) => sum + l.quantity, 0),
      lines,
      promisedDeliveryAt,
      promiseState,
      fulfillmentStatus,
      operationalState: state,
      blockedReason,
      priority,
      priorityReason: reason,
      priorityLabel: label,
      handoffTargetAt: computeHandoffTargetAt(promisedDeliveryAt),
      packingStartedAt: row.packingStartedAt,
      packedAt: row.fulfillmentPackedAt,
      readyForHandoffAt: row.readyForHandoffAt,
      handedToCarrierAt: row.handedToCarrierAt,
      shippedAt: row.fulfillmentShippedAt,
      commerceMoment: classifyOrderCommerceMoment(
        row.placedAt,
        row.eventStartsAt,
        row.eventEndsAt,
      ),
      activationDropTitle: activationByOrder.get(row.orderId) ?? null,
      shipment: {
        id: shipment?.id ?? null,
        carrier: shipment?.carrier ?? null,
        service: shipment?.service ?? null,
        trackingNumber: shipment?.trackingNumber ?? null,
        carrierReference: shipment?.carrierReference ?? null,
        status: shipment?.status ?? null,
      },
      hasOpenException: openExceptionTypes.length > 0,
      exceptionType: openExceptionTypes[0] ?? null,
      openExceptionId: exceptionInfo?.id ?? null,
    });
  }

  return cards;
}

export async function loadPackingQueue(
  ctx: AuthContext,
  filter: PackQueueFilter = "all",
  eventId?: string | null,
): Promise<PackQueueSnapshot> {
  assertPackingAccess(ctx);
  const now = demoNow();
  const allCards = await loadPackOrderCards(eventId ?? undefined);
  const filtered = filterPackOrders(allCards, filter);
  const snapshot = buildPackQueueSnapshot(allCards, now);
  return {
    ...snapshot,
    allOrders: filtered,
  };
}

export async function loadShowPackingSummary(
  ctx: AuthContext,
  eventId: string,
): Promise<PackShowSummary | null> {
  const snapshot = await loadPackingQueue(ctx, "all", eventId);
  return snapshot.showSummaries.find((s) => s.eventId === eventId) ?? null;
}

export async function loadGlobalPackingPressure(
  ctx: AuthContext,
): Promise<
  Map<
    string,
    {
      readyToPack: number;
      readyForHandoff: number;
      mustLeaveNext: number;
    }
  >
> {
  assertPackingAccess(ctx);
  const cards = await loadPackOrderCards();
  const map = new Map<
    string,
    { readyToPack: number; readyForHandoff: number; mustLeaveNext: number }
  >();

  for (const card of cards) {
    if (!card.eventId) continue;
    const existing = map.get(card.eventId) ?? {
      readyToPack: 0,
      readyForHandoff: 0,
      mustLeaveNext: 0,
    };
    if (card.operationalState === "ready_to_pack") existing.readyToPack += 1;
    if (card.operationalState === "ready_for_handoff") existing.readyForHandoff += 1;
    if (
      ["ready_to_pack", "packing", "packed", "ready_for_handoff", "handed_to_carrier"].includes(
        card.operationalState,
      )
    ) {
      existing.mustLeaveNext += 1;
    }
    map.set(card.eventId, existing);
  }

  return map;
}

export async function loadOrderPackingStatus(ctx: AuthContext, orderId: string) {
  assertPackingAccess(ctx);
  const cards = await loadPackOrderCards();
  return cards.find((c) => c.orderId === orderId) ?? null;
}
