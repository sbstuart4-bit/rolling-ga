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

interface FulfillmentPlanEntry {
  status: FulfillmentStatus;
  withinPromise: boolean;
  exception?: FulfillmentExceptionType;
  exceptionNote?: string;
}

/** Nashville post-show — mostly complete with a small in-flight tail. */
const NASHVILLE_COMPLETE_PLAN: FulfillmentPlanEntry[] = [
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
  { status: "shipped", withinPromise: true },
  { status: "packed", withinPromise: true },
  { status: "production", withinPromise: true },
  {
    status: "exception",
    withinPromise: false,
    exception: "delivery_failed",
    exceptionNote: "Delivery attempt failed — fan notified for re-delivery coordination.",
  },
  { status: "received", withinPromise: true },
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

async function seedEventFulfillmentPlan(
  db: Db,
  eventId: string,
  artistId: string,
  plan: FulfillmentPlanEntry[],
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

  const eventOrders = await db
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

  if (eventOrders.length === 0) return 0;

  const orderIds = eventOrders.map((o) => o.id);
  await db
    .delete(orderFulfillmentExceptions)
    .where(inArray(orderFulfillmentExceptions.orderId, orderIds));

  let updated = 0;

  for (const [index, order] of eventOrders.entries()) {
    if (!order.placedAt) continue;

    const entry = plan[index % plan.length];
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
      entry.status,
      promisedDeliveryAt,
      entry.withinPromise,
    );

    const commerceStatus =
      entry.status === "delivered"
        ? "delivered"
        : entry.status === "shipped"
          ? "shipped"
          : entry.status === "packed"
            ? "packed"
            : entry.status === "production"
              ? "picking"
              : entry.status === "exception"
                ? "exception"
                : order.status === "allocated"
                  ? "allocated"
                  : "paid";

    await db
      .update(orders)
      .set({
        fulfillmentStatus: entry.status,
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

    if (entry.exception) {
      await db.insert(orderFulfillmentExceptions).values({
        id: `ofx_seed_${order.id}`,
        orderId: order.id,
        type: entry.exception,
        status: "open",
        note: entry.exceptionNote ?? null,
        isDemo: true,
      });
    }

    if (entry.status === "shipped" || entry.status === "delivered") {
      const existingShipment = await db
        .select({ orderId: shipments.orderId })
        .from(shipments)
        .where(eq(shipments.orderId, order.id))
        .limit(1);

      const shipmentValues = {
        carrier: "Demo carrier",
        service: "Standard",
        trackingNumber: `DEMO-${order.id.slice(-8).toUpperCase()}`,
        status: (entry.status === "delivered" ? "delivered" : "in_transit") as
          | "delivered"
          | "in_transit",
        labelPurchased: false,
        shippedAt: timeline.fulfillmentShippedAt,
        deliveredAt: timeline.actualDeliveredAt,
        isDemo: true,
      };

      if (existingShipment.length > 0) {
        await db.update(shipments).set(shipmentValues).where(eq(shipments.orderId, order.id));
      } else {
        await db.insert(shipments).values({ orderId: order.id, ...shipmentValues });
      }
    }

    updated++;
  }

  return updated;
}

/** Idempotent Nashville fulfillment — mostly complete for multi-show Ops demo. */
export async function seedNashvilleFulfillment(
  db: Db,
  eventId: string,
  artistId: string,
): Promise<number> {
  return seedEventFulfillmentPlan(db, eventId, artistId, NASHVILLE_COMPLETE_PLAN);
}
