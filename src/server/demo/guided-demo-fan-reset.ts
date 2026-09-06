import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, verifiedAttendance } from "@/db/schema";
import type { DemoShowDefinition } from "@/lib/demo-scenario/shows";
import type { GuidedDemoStep } from "@/lib/guided-demo";
import { guidedStepShouldPersistVerification } from "./scenario-verification";

/** Keep guided-demo fan DB state aligned with scenario — no stale credentials or seed orders. */
export async function syncGuidedDemoFanRecords(
  show: DemoShowDefinition,
  step: GuidedDemoStep,
  userId: string,
): Promise<void> {
  if (!guidedStepShouldPersistVerification(step.scenario)) {
    await db
      .delete(verifiedAttendance)
      .where(
        and(
          eq(verifiedAttendance.userId, userId),
          eq(verifiedAttendance.eventId, show.eventId),
        ),
      );
  }

  if (step.scenario.purchaseHistory === "none") {
    const eventOrders = await db
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.eventId, show.eventId)));

    const orderIds = eventOrders.map((row) => row.id);
    if (orderIds.length > 0) {
      await db.delete(orderItems).where(inArray(orderItems.orderId, orderIds));
      await db.delete(orders).where(inArray(orders.id, orderIds));
    }
  }
}
