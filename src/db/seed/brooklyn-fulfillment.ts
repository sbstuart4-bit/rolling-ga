import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "../client";
import {
  events,
  orderFulfillmentExceptions,
  orders,
  shipments,
} from "../schema";
import { computePromisedDeliveryAt } from "@/lib/fulfillment";
import type { FulfillmentExceptionType, FulfillmentStatus } from "@/lib/types";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

interface FulfillmentPlanEntry {
  status: FulfillmentStatus;
  /** When delivered, whether actual delivery met the promise. */
  withinPromise: boolean;
  exception?: FulfillmentExceptionType;
  exceptionNote?: string;
}

/**
 * Deterministic Brooklyn fulfillment mix — majority successful, small exception tail.
 * Cycles across orders sorted by placedAt so re-seeding is stable.
 */
const BROOKLYN_FULFILLMENT_PLAN: FulfillmentPlanEntry[] = [
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: true },
  { status: "delivered", withinPromise: false },
  { status: "delivered", withinPromise: false },
  { status: "shipped", withinPromise: true },
  { status: "shipped", withinPromise: true },
  { status: "shipped", withinPromise: true },
  { status: "packed", withinPromise: true },
  { status: "packed", withinPromise: true },
  { status: "production", withinPromise: true },
  { status: "production", withinPromise: true },
  { status: "received", withinPromise: true },
  {
    status: "exception",
    withinPromise: true,
    exception: "address_issue",
    exceptionNote: "Shipping address could not be verified — fan contacted for correction.",
  },
  {
    status: "exception",
    withinPromise: true,
    exception: "production_delay",
    exceptionNote: "Poster print run delayed at fulfillment plant.",
  },
  {
    status: "exception",
    withinPromise: true,
    exception: "carrier_delay",
    exceptionNote: "Carrier handoff delayed — package still at fulfillment plant.",
  },
];

function timelineForStatus(
  placedAt: Date,
  status: FulfillmentStatus,
  promisedAt: Date,
  withinPromise: boolean,
) {
  const receivedAt = new Date(placedAt.getTime() + 2 * HOUR);
  const productionAt =
    status !== "received" ? new Date(placedAt.getTime() + 8 * HOUR) : null;
  const packedAt =
    status === "packed" || status === "shipped" || status === "delivered"
      ? new Date(placedAt.getTime() + 20 * HOUR)
      : null;
  const shippedAt =
    status === "shipped" || status === "delivered"
      ? new Date(placedAt.getTime() + 28 * HOUR)
      : null;

  let deliveredAt: Date | null = null;
  if (status === "delivered") {
    const onTime = new Date(promisedAt.getTime() - 4 * HOUR);
    const late = new Date(promisedAt.getTime() + 18 * HOUR);
    deliveredAt = withinPromise ? onTime : late;
  }

  return {
    fulfillmentReceivedAt: receivedAt,
    productionStartedAt: productionAt,
    fulfillmentPackedAt: packedAt,
    fulfillmentShippedAt: shippedAt,
    actualDeliveredAt: deliveredAt,
  };
}

/**
 * Idempotent Brooklyn fulfillment story for Artist Studio Phase 5.
 * Re-applies the same deterministic states on every seed run.
 */
export async function seedBrooklynFulfillment(
  db: Db,
  eventId: string,
  artistId: string,
): Promise<number> {
  const [event] = await db
    .select({
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      timezone: events.timezone,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) return 0;

  const brooklynOrders = await db
    .select({
      id: orders.id,
      status: orders.status,
      placedAt: orders.placedAt,
      estimatedDeliveryFrom: orders.estimatedDeliveryFrom,
      estimatedDeliveryTo: orders.estimatedDeliveryTo,
    })
    .from(orders)
    .where(
      and(
        eq(orders.eventId, eventId),
        eq(orders.artistId, artistId),
        sql`${orders.status} NOT IN ('pending', 'cancelled')`,
      ),
    )
    .orderBy(asc(orders.placedAt));

  if (brooklynOrders.length === 0) return 0;

  const orderIds = brooklynOrders.map((o) => o.id);

  await db
    .delete(orderFulfillmentExceptions)
    .where(inArray(orderFulfillmentExceptions.orderId, orderIds));

  let updated = 0;

  for (const [index, order] of brooklynOrders.entries()) {
    if (!order.placedAt) continue;

    const plan = BROOKLYN_FULFILLMENT_PLAN[index % BROOKLYN_FULFILLMENT_PLAN.length];
    const promisedDeliveryAt = computePromisedDeliveryAt({
      placedAt: order.placedAt,
      eventStartsAt: event.startsAt,
      eventEndsAt: event.endsAt,
      timezone: event.timezone ?? "America/New_York",
      estimatedDeliveryTo: order.estimatedDeliveryTo,
      estimatedDeliveryFrom: order.estimatedDeliveryFrom,
    });

    const timeline = timelineForStatus(
      order.placedAt,
      plan.status,
      promisedDeliveryAt,
      plan.withinPromise,
    );

    const commerceStatus =
      plan.status === "delivered"
        ? "delivered"
        : plan.status === "shipped"
          ? "shipped"
          : plan.status === "packed"
            ? "packed"
            : plan.status === "production"
              ? "picking"
              : plan.status === "exception"
                ? "exception"
                : order.status === "allocated"
                  ? "allocated"
                  : "paid";

    await db
      .update(orders)
      .set({
        fulfillmentStatus: plan.status,
        promisedDeliveryAt,
        actualDeliveredAt: timeline.actualDeliveredAt,
        fulfillmentReceivedAt: timeline.fulfillmentReceivedAt,
        productionStartedAt: timeline.productionStartedAt,
        fulfillmentPackedAt: timeline.fulfillmentPackedAt,
        fulfillmentShippedAt: timeline.fulfillmentShippedAt,
        status: commerceStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    if (plan.exception) {
      await db.insert(orderFulfillmentExceptions).values({
        id: `ofx_seed_${order.id}`,
        orderId: order.id,
        type: plan.exception,
        status: "open",
        note: plan.exceptionNote ?? null,
        isDemo: true,
      });
    }

    if (plan.status === "shipped" || plan.status === "delivered") {
      const existingShipment = await db
        .select({ orderId: shipments.orderId })
        .from(shipments)
        .where(eq(shipments.orderId, order.id))
        .limit(1);

      if (existingShipment.length > 0) {
        await db
          .update(shipments)
          .set({
            carrier: "Demo carrier",
            service: "Standard",
            trackingNumber: `DEMO-${order.id.slice(-8).toUpperCase()}`,
            status: plan.status === "delivered" ? "delivered" : "in_transit",
            labelPurchased: false,
            shippedAt: timeline.fulfillmentShippedAt,
            deliveredAt: timeline.actualDeliveredAt,
            isDemo: true,
          })
          .where(eq(shipments.orderId, order.id));
      } else {
        await db.insert(shipments).values({
          orderId: order.id,
          carrier: "Demo carrier",
          service: "Standard",
          trackingNumber: `DEMO-${order.id.slice(-8).toUpperCase()}`,
          status: plan.status === "delivered" ? "delivered" : "in_transit",
          labelPurchased: false,
          shippedAt: timeline.fulfillmentShippedAt,
          deliveredAt: timeline.actualDeliveredAt,
          isDemo: true,
        });
      }
    }

    updated++;
  }

  return updated;
}
