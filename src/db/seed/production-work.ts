import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "../client";
import {
  orderItems,
  orders,
  productionWork,
  products,
} from "../schema";
import { resolveProductionRequirementMode } from "@/lib/production/mode";
import type { FulfillmentStatus, ProductionWorkStatus } from "@/lib/types";

type UnitStatusPlan = ProductionWorkStatus;

const IN_FLIGHT_PLAN: UnitStatusPlan[] = [
  "complete",
  "complete",
  "in_production",
  "in_production",
  "queued",
  "queued",
  "queued",
];

function unitStatusForOrder(
  fulfillmentStatus: FulfillmentStatus | null,
  unitIndex: number,
): UnitStatusPlan {
  if (!fulfillmentStatus || fulfillmentStatus === "delivered" || fulfillmentStatus === "shipped") {
    return "complete";
  }
  if (fulfillmentStatus === "packed") return "complete";
  if (fulfillmentStatus === "received") {
    return unitIndex % 4 === 0 ? "in_production" : "queued";
  }
  if (fulfillmentStatus === "production" || fulfillmentStatus === "exception") {
    return IN_FLIGHT_PLAN[unitIndex % IN_FLIGHT_PLAN.length];
  }
  return "queued";
}

function workId(orderItemId: string, unitIndex: number): string {
  return `pwk_seed_${orderItemId}_${unitIndex}`;
}

/**
 * Idempotent production work expansion for an event.
 * One production_work row per physical unit (quantity integrity).
 */
export async function seedProductionWorkForEvent(
  db: Db,
  eventId: string,
  artistId: string,
): Promise<number> {
  const eventOrders = await db
    .select({
      id: orders.id,
      fulfillmentStatus: orders.fulfillmentStatus,
      placedAt: orders.placedAt,
    })
    .from(orders)
    .where(
      and(
        eq(orders.eventId, eventId),
        eq(orders.artistId, artistId),
        sql`${orders.status} NOT IN ('pending', 'cancelled')`,
      ),
    );

  if (eventOrders.length === 0) return 0;

  const orderIds = eventOrders.map((o) => o.id);
  await db.delete(productionWork).where(inArray(productionWork.orderId, orderIds));

  const lines = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      variantId: orderItems.variantId,
      nameSnapshot: orderItems.nameSnapshot,
      sizeSnapshot: orderItems.sizeSnapshot,
      quantity: orderItems.quantity,
      isDigital: products.isDigital,
    })
    .from(orderItems)
    .leftJoin(products, eq(products.id, orderItems.productId))
    .where(inArray(orderItems.orderId, orderIds))
    .orderBy(asc(orderItems.id));

  const statusByOrder = new Map(
    eventOrders.map((o) => [o.id, o.fulfillmentStatus as FulfillmentStatus | null]),
  );
  const placedByOrder = new Map(eventOrders.map((o) => [o.id, o.placedAt ?? new Date()]));

  let created = 0;

  for (const line of lines) {
    const mode = resolveProductionRequirementMode(line.isDigital);
    const fulfillmentStatus = statusByOrder.get(line.orderId) ?? null;
    const queuedAt = placedByOrder.get(line.orderId) ?? new Date();

    for (let unitIndex = 0; unitIndex < line.quantity; unitIndex++) {
      const status =
        mode === "stocked" ? "complete" : unitStatusForOrder(fulfillmentStatus, unitIndex + created);

      const startedAt =
        status === "in_production" || status === "complete"
          ? new Date(queuedAt.getTime() + 2 * 60 * 60 * 1000)
          : null;
      const completedAt =
        status === "complete" ? new Date(queuedAt.getTime() + 8 * 60 * 60 * 1000) : null;

      await db.insert(productionWork).values({
        id: workId(line.id, unitIndex),
        orderItemId: line.id,
        orderId: line.orderId,
        artistId,
        eventId,
        productId: line.productId,
        variantId: line.variantId,
        unitIndex,
        status,
        requirementMode: mode,
        nameSnapshot: line.nameSnapshot,
        sizeSnapshot: line.sizeSnapshot,
        queuedAt,
        startedAt,
        completedAt,
        isDemo: true,
      });

      created++;
    }
  }

  return created;
}

export async function seedBrooklynProductionWork(db: Db, eventId: string, artistId: string) {
  return seedProductionWorkForEvent(db, eventId, artistId);
}

export async function seedNashvilleProductionWork(db: Db, eventId: string, artistId: string) {
  return seedProductionWorkForEvent(db, eventId, artistId);
}
