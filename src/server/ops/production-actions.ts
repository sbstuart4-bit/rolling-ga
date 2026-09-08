"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orders, productionWork } from "@/db/schema";
import { canOperateFulfillment } from "@/server/auth/guards";
import type { AuthContext } from "@/server/auth/session";
import { demoNow } from "@/server/demo/clock";

function assertProductionAccess(ctx: AuthContext): void {
  if (!canOperateFulfillment(ctx)) {
    throw new Error("Production access denied");
  }
}

async function syncOrderProductionRollup(orderId: string, now: Date): Promise<void> {
  const units = await db
    .select({ status: productionWork.status, requirementMode: productionWork.requirementMode })
    .from(productionWork)
    .where(and(eq(productionWork.orderId, orderId), eq(productionWork.requirementMode, "on_demand")));

  if (units.length === 0) return;

  const anyInProduction = units.some((u) => u.status === "in_production");
  const anyQueued = units.some((u) => u.status === "queued");
  const allComplete = units.every((u) => u.status === "complete");

  const [order] = await db
    .select({
      fulfillmentStatus: orders.fulfillmentStatus,
      productionStartedAt: orders.productionStartedAt,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) return;

  const updates: Partial<typeof orders.$inferInsert> = { updatedAt: now };

  if ((anyInProduction || anyQueued) && !order.productionStartedAt) {
    updates.productionStartedAt = now;
  }

  if ((anyInProduction || anyQueued) && order.fulfillmentStatus === "received") {
    updates.fulfillmentStatus = "production";
    updates.status = "picking";
  }

  if (allComplete && order.fulfillmentStatus === "production") {
    // Ready to pack — fulfillment stays production until Phase 3 pack action.
  }

  if (Object.keys(updates).length > 1) {
    await db.update(orders).set(updates).where(eq(orders.id, orderId));
  }
}

export async function startProductionAction(workIds: string[]): Promise<{ updated: number }> {
  return runProductionMutation(async (ctx) => {
    assertProductionAccess(ctx);
    const now = demoNow();

    const rows = await db
      .select({ id: productionWork.id, orderId: productionWork.orderId, status: productionWork.status })
      .from(productionWork)
      .where(inArray(productionWork.id, workIds));

    const eligible = rows.filter((r) => r.status === "queued");
    if (eligible.length === 0) return { updated: 0 };

    await db
      .update(productionWork)
      .set({ status: "in_production", startedAt: now })
      .where(inArray(productionWork.id, eligible.map((r) => r.id)));

    const orderIds = [...new Set(eligible.map((r) => r.orderId))];
    for (const orderId of orderIds) {
      await syncOrderProductionRollup(orderId, now);
    }

    revalidateProductionPaths();
    return { updated: eligible.length };
  });
}

export async function completeProductionAction(workIds: string[]): Promise<{ updated: number }> {
  return runProductionMutation(async (ctx) => {
    assertProductionAccess(ctx);
    const now = demoNow();

    const rows = await db
      .select({ id: productionWork.id, orderId: productionWork.orderId, status: productionWork.status })
      .from(productionWork)
      .where(inArray(productionWork.id, workIds));

    const eligible = rows.filter((r) => r.status === "in_production");
    if (eligible.length === 0) return { updated: 0 };

    await db
      .update(productionWork)
      .set({ status: "complete", completedAt: now })
      .where(inArray(productionWork.id, eligible.map((r) => r.id)));

    const orderIds = [...new Set(eligible.map((r) => r.orderId))];
    for (const orderId of orderIds) {
      await syncOrderProductionRollup(orderId, now);
    }

    revalidateProductionPaths();
    return { updated: eligible.length };
  });
}

async function runProductionMutation<T>(fn: (ctx: AuthContext) => Promise<T>): Promise<T> {
  const { getAuthContext } = await import("@/server/auth/session");
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("Authentication required");
  return fn(ctx);
}

function revalidateProductionPaths(): void {
  revalidatePath("/ops");
  revalidatePath("/ops/production");
  revalidatePath("/ops/orders");
}
