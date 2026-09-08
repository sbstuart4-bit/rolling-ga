import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "../client";
import { orders, shipments } from "../schema";

const HOUR = 60 * 60 * 1000;

type PackHandoffPlan = {
  packingStartedAt?: boolean;
  packed?: boolean;
  readyForHandoff?: boolean;
  handedToCarrier?: boolean;
  shipped?: boolean;
  carrier?: string;
  service?: string;
  trackingNumber?: string;
};

const PACK_HANDOFF_PLAN: PackHandoffPlan[] = [
  {},
  {},
  { packingStartedAt: true },
  { packingStartedAt: true, packed: true, readyForHandoff: true },
  { packingStartedAt: true, packed: true, readyForHandoff: true, handedToCarrier: true },
  {
    packingStartedAt: true,
    packed: true,
    readyForHandoff: true,
    handedToCarrier: true,
    shipped: true,
    carrier: "Demo carrier",
    service: "Standard",
    trackingNumber: "DEMO-HANDOFF",
  },
];

/**
 * Idempotent pack/handoff story layered on production-complete orders.
 * Only updates orders still in received/production/exception/packed pipeline.
 */
export async function seedPackHandoffForEvent(
  db: Db,
  eventId: string,
  artistId: string,
): Promise<number> {
  const eventOrders = await db
    .select({
      id: orders.id,
      placedAt: orders.placedAt,
      fulfillmentStatus: orders.fulfillmentStatus,
      fulfillmentPackedAt: orders.fulfillmentPackedAt,
      fulfillmentShippedAt: orders.fulfillmentShippedAt,
    })
    .from(orders)
    .where(
      and(
        eq(orders.eventId, eventId),
        eq(orders.artistId, artistId),
        sql`${orders.status} NOT IN ('pending', 'cancelled')`,
        sql`(${orders.fulfillmentStatus} IS NULL OR ${orders.fulfillmentStatus} IN ('received', 'production', 'packed', 'exception'))`,
      ),
    )
    .orderBy(asc(orders.placedAt));

  if (eventOrders.length === 0) return 0;

  let updated = 0;

  for (const [index, order] of eventOrders.entries()) {
    if (!order.placedAt) continue;
    const plan = PACK_HANDOFF_PLAN[index % PACK_HANDOFF_PLAN.length];
    if (Object.keys(plan).length === 0) continue;

    const placedAt = order.placedAt;
    const packingStartedAt = plan.packingStartedAt
      ? new Date(placedAt.getTime() + 18 * HOUR)
      : null;
    const fulfillmentPackedAt = plan.packed ? new Date(placedAt.getTime() + 20 * HOUR) : null;
    const readyForHandoffAt = plan.readyForHandoff
      ? new Date(placedAt.getTime() + 20 * HOUR)
      : null;
    const handedToCarrierAt = plan.handedToCarrier
      ? new Date(placedAt.getTime() + 22 * HOUR)
      : null;
    const fulfillmentShippedAt = plan.shipped ? new Date(placedAt.getTime() + 28 * HOUR) : null;

    const orderUpdate: Partial<typeof orders.$inferInsert> = {
      packingStartedAt,
      fulfillmentPackedAt,
      readyForHandoffAt,
      handedToCarrierAt,
      fulfillmentShippedAt,
      updatedAt: new Date(),
    };

    if (plan.shipped) {
      orderUpdate.fulfillmentStatus = "shipped";
      orderUpdate.status = "shipped";
    } else if (plan.packed) {
      orderUpdate.fulfillmentStatus = "packed";
      orderUpdate.status = plan.readyForHandoff ? "ready_to_ship" : "packed";
    } else if (plan.packingStartedAt) {
      orderUpdate.fulfillmentStatus = "production";
      orderUpdate.status = "picking";
    }

    await db.update(orders).set(orderUpdate).where(eq(orders.id, order.id));

    if (plan.packed || plan.readyForHandoff || plan.handedToCarrier || plan.shipped) {
      const [existing] = await db
        .select({ id: shipments.id })
        .from(shipments)
        .where(eq(shipments.orderId, order.id))
        .limit(1);

      const shipmentStatus = (
        plan.shipped ? "in_transit" : plan.handedToCarrier ? "label_required" : "pending"
      ) as "pending" | "label_required" | "in_transit";

      const shipmentValues = {
        carrier: plan.carrier ?? "Demo carrier",
        service: plan.service ?? "Standard",
        trackingNumber: plan.trackingNumber ?? `DEMO-${order.id.slice(-8).toUpperCase()}`,
        status: shipmentStatus,
        labelPurchased: false,
        shippedAt: plan.shipped ? fulfillmentShippedAt : null,
        isDemo: true,
      };

      if (existing) {
        await db.update(shipments).set(shipmentValues).where(eq(shipments.id, existing.id));
      } else {
        await db.insert(shipments).values({ orderId: order.id, ...shipmentValues });
      }
    }

    updated++;
  }

  return updated;
}

export async function seedBrooklynPackHandoff(db: Db, eventId: string, artistId: string) {
  return seedPackHandoffForEvent(db, eventId, artistId);
}

export async function seedNashvillePackHandoff(db: Db, eventId: string, artistId: string) {
  return seedPackHandoffForEvent(db, eventId, artistId);
}
