"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orderFulfillmentExceptions, orders, productionWork, shipments } from "@/db/schema";
import {
  canMarkHandedToCarrier,
  canOrderEnterPacking,
  isBlockingPackException,
} from "@/lib/packing";
import { isOrderProductionComplete } from "@/lib/production/order-status";
import { canOperateFulfillment } from "@/server/auth/guards";
import type { AuthContext } from "@/server/auth/session";
import { demoNow } from "@/server/demo/clock";
import type { FulfillmentExceptionType } from "@/lib/types";

function assertPackingAccess(ctx: AuthContext): void {
  if (!canOperateFulfillment(ctx)) {
    throw new Error("Packing access denied");
  }
}

async function loadPackContext(orderId: string) {
  const [order] = await db
    .select({
      id: orders.id,
      status: orders.status,
      fulfillmentStatus: orders.fulfillmentStatus,
      packingStartedAt: orders.packingStartedAt,
      fulfillmentPackedAt: orders.fulfillmentPackedAt,
      readyForHandoffAt: orders.readyForHandoffAt,
      handedToCarrierAt: orders.handedToCarrierAt,
      fulfillmentShippedAt: orders.fulfillmentShippedAt,
      actualDeliveredAt: orders.actualDeliveredAt,
      shippingMethodLabel: orders.shippingMethodLabel,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) return null;

  const productionRows = await db
    .select({
      orderItemId: productionWork.orderItemId,
      productName: productionWork.nameSnapshot,
      size: productionWork.sizeSnapshot,
      status: productionWork.status,
      requirementMode: productionWork.requirementMode,
    })
    .from(productionWork)
    .where(eq(productionWork.orderId, orderId));

  const exceptions = await db
    .select({ type: orderFulfillmentExceptions.type })
    .from(orderFulfillmentExceptions)
    .where(
      and(
        eq(orderFulfillmentExceptions.orderId, orderId),
        inArray(orderFulfillmentExceptions.status, ["open", "in_progress"]),
      ),
    );

  const openExceptionTypes = exceptions.map((e) => e.type as FulfillmentExceptionType);

  const readinessInput = {
    fulfillmentStatus: order.fulfillmentStatus,
    commerceStatus: order.status,
    productionRows,
    openExceptionTypes,
    packingStartedAt: order.packingStartedAt,
    fulfillmentPackedAt: order.fulfillmentPackedAt,
    readyForHandoffAt: order.readyForHandoffAt,
    handedToCarrierAt: order.handedToCarrierAt,
    fulfillmentShippedAt: order.fulfillmentShippedAt,
    actualDeliveredAt: order.actualDeliveredAt,
  };

  return { order, readinessInput, openExceptionTypes };
}

function revalidatePackingPaths(): void {
  revalidatePath("/ops");
  revalidatePath("/ops/packing");
  revalidatePath("/ops/orders");
}

export async function startPackingAction(orderId: string): Promise<{ updated: boolean }> {
  return runPackingMutation(async (ctx) => {
    assertPackingAccess(ctx);
    const now = demoNow();
    const context = await loadPackContext(orderId);
    if (!context) throw new Error("Order not found");

    const { order, readinessInput } = context;

    if (order.packingStartedAt) {
      return { updated: false };
    }

    const readiness = canOrderEnterPacking(readinessInput);
    if (!readiness.allowed) {
      throw new Error(readiness.reason ?? "Cannot start packing");
    }

    await db
      .update(orders)
      .set({ packingStartedAt: now, updatedAt: now })
      .where(eq(orders.id, orderId));

    revalidatePackingPaths();
    return { updated: true };
  });
}

export async function markPackedAction(
  orderId: string,
  input?: { carrier?: string; service?: string; trackingNumber?: string },
): Promise<{ updated: boolean }> {
  return runPackingMutation(async (ctx) => {
    assertPackingAccess(ctx);
    const now = demoNow();
    const context = await loadPackContext(orderId);
    if (!context) throw new Error("Order not found");

    const { order, readinessInput } = context;

    if (order.fulfillmentPackedAt) {
      return { updated: false };
    }

    if (!order.packingStartedAt) {
      const readiness = canOrderEnterPacking(readinessInput);
      if (!readiness.allowed) {
        throw new Error(readiness.reason ?? "Cannot pack order");
      }
    }

    if (!isOrderProductionComplete(readinessInput.productionRows)) {
      throw new Error("Production incomplete");
    }

    const carrier = input?.carrier ?? order.shippingMethodLabel ?? "Demo carrier";
    const service = input?.service ?? "Standard";

    await db
      .update(orders)
      .set({
        packingStartedAt: order.packingStartedAt ?? now,
        fulfillmentPackedAt: now,
        readyForHandoffAt: now,
        fulfillmentStatus: "packed",
        status: "ready_to_ship",
        updatedAt: now,
      })
      .where(eq(orders.id, orderId));

    const [existingShipment] = await db
      .select({ id: shipments.id })
      .from(shipments)
      .where(eq(shipments.orderId, orderId))
      .limit(1);

    if (existingShipment) {
      await db
        .update(shipments)
        .set({
          carrier,
          service,
          trackingNumber: input?.trackingNumber ?? null,
          status: "pending",
          labelPurchased: false,
          updatedAt: now,
          isDemo: true,
        })
        .where(eq(shipments.id, existingShipment.id));
    } else {
      await db.insert(shipments).values({
        orderId,
        carrier,
        service,
        trackingNumber: input?.trackingNumber ?? null,
        status: "pending",
        labelPurchased: false,
        isDemo: true,
      });
    }

    revalidatePackingPaths();
    return { updated: true };
  });
}

export async function markHandedToCarrierAction(orderId: string): Promise<{ updated: boolean }> {
  return runPackingMutation(async (ctx) => {
    assertPackingAccess(ctx);
    const now = demoNow();
    const context = await loadPackContext(orderId);
    if (!context) throw new Error("Order not found");

    const { order, readinessInput } = context;

    if (order.handedToCarrierAt) {
      return { updated: false };
    }

    const handoff = canMarkHandedToCarrier(readinessInput);
    if (!handoff.allowed) {
      throw new Error(handoff.reason ?? "Cannot hand off to carrier");
    }

    await db
      .update(orders)
      .set({
        handedToCarrierAt: now,
        updatedAt: now,
      })
      .where(eq(orders.id, orderId));

    const [shipment] = await db
      .select({ id: shipments.id })
      .from(shipments)
      .where(eq(shipments.orderId, orderId))
      .limit(1);

    if (shipment) {
      await db
        .update(shipments)
        .set({
          status: "label_required",
          updatedAt: now,
        })
        .where(eq(shipments.id, shipment.id));
    }

    revalidatePackingPaths();
    return { updated: true };
  });
}

async function runPackingMutation<T>(fn: (ctx: AuthContext) => Promise<T>): Promise<T> {
  const { getAuthContext } = await import("@/server/auth/session");
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("Authentication required");
  return fn(ctx);
}

export { isBlockingPackException };
