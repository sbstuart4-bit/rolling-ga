"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  fulfillmentExceptionActions,
  orderFulfillmentExceptions,
  orders,
  productionWork,
} from "@/db/schema";
import {
  deriveReturnFulfillmentStatus,
  getAvailableExceptionActions,
  isActiveExceptionStatus,
  requiresActionNote,
} from "@/lib/exceptions";
import type { ExceptionActionType } from "@/lib/types";
import { canOperateFulfillment } from "@/server/auth/guards";
import { getAuthContext } from "@/server/auth/session";
import { demoNow } from "@/server/demo/clock";

const REVALIDATE_PATHS = [
  "/ops",
  "/ops/exceptions",
  "/ops/production",
  "/ops/packing",
  "/ops/orders",
];

const ACTIVE_EXCEPTION_STATUSES = ["open", "in_progress"] as const;

function assertExceptionAccess(ctx: Awaited<ReturnType<typeof getAuthContext>>): void {
  if (!ctx || !canOperateFulfillment(ctx)) {
    throw new Error("Exception resolution access denied");
  }
}

function revalidateOps(): void {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path, "layout");
  }
}

async function loadExceptionForMutation(exceptionId: string) {
  const [row] = await db
    .select()
    .from(orderFulfillmentExceptions)
    .where(eq(orderFulfillmentExceptions.id, exceptionId))
    .limit(1);
  return row ?? null;
}

async function recordExceptionAction(input: {
  exceptionId: string;
  actionType: ExceptionActionType;
  note: string | null;
  actorUserId: string;
  now: Date;
}): Promise<void> {
  await db.insert(fulfillmentExceptionActions).values({
    exceptionId: input.exceptionId,
    actionType: input.actionType,
    note: input.note,
    actorUserId: input.actorUserId,
    createdAt: input.now,
  });
}

async function maybeStartProgress(
  exceptionId: string,
  status: string,
  actorUserId: string,
  now: Date,
): Promise<void> {
  if (status !== "open") return;
  await db
    .update(orderFulfillmentExceptions)
    .set({ status: "in_progress" })
    .where(eq(orderFulfillmentExceptions.id, exceptionId));
  await recordExceptionAction({
    exceptionId,
    actionType: "start_progress",
    note: null,
    actorUserId,
    now,
  });
}

async function restoreOrderAfterResolve(orderId: string, now: Date): Promise<void> {
  const [order] = await db
    .select({
      fulfillmentStatus: orders.fulfillmentStatus,
      fulfillmentPackedAt: orders.fulfillmentPackedAt,
      fulfillmentShippedAt: orders.fulfillmentShippedAt,
      actualDeliveredAt: orders.actualDeliveredAt,
      handedToCarrierAt: orders.handedToCarrierAt,
      productionStartedAt: orders.productionStartedAt,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order || order.fulfillmentStatus !== "exception") return;

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

  const nextStatus = deriveReturnFulfillmentStatus({
    fulfillmentStatus: order.fulfillmentStatus,
    productionRows,
    fulfillmentPackedAt: order.fulfillmentPackedAt,
    fulfillmentShippedAt: order.fulfillmentShippedAt,
    actualDeliveredAt: order.actualDeliveredAt,
    handedToCarrierAt: order.handedToCarrierAt,
    productionStartedAt: order.productionStartedAt,
  });

  if (!nextStatus || nextStatus === order.fulfillmentStatus) return;

  await db
    .update(orders)
    .set({ fulfillmentStatus: nextStatus, updatedAt: now })
    .where(eq(orders.id, orderId));
}

export async function performExceptionAction(
  exceptionId: string,
  actionType: ExceptionActionType,
  note?: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getAuthContext();
  assertExceptionAccess(ctx);

  const trimmedNote = note?.trim() ?? "";
  if (requiresActionNote(actionType) && !trimmedNote) {
    return { ok: false, error: "Note is required" };
  }

  const exception = await loadExceptionForMutation(exceptionId);
  if (!exception) return { ok: false, error: "Exception not found" };

  if (!isActiveExceptionStatus(exception.status)) {
    return { ok: false, error: "Exception is already resolved" };
  }

  const available = getAvailableExceptionActions({
    type: exception.type,
    status: exception.status,
  });
  if (!available.includes(actionType)) {
    return { ok: false, error: "Action not permitted for this exception" };
  }

  const now = demoNow();
  const actorUserId = ctx!.userId;

  if (actionType === "resolve") {
    return resolveExceptionInternal(exceptionId, trimmedNote, actorUserId, now);
  }

  await maybeStartProgress(exception.id, exception.status, actorUserId, now);
  await recordExceptionAction({
    exceptionId: exception.id,
    actionType,
    note: trimmedNote || null,
    actorUserId,
    now,
  });

  revalidateOps();
  revalidatePath(`/ops/exceptions/${exceptionId}`);
  return { ok: true };
}

export async function resolveExceptionAction(
  exceptionId: string,
  resolutionNote: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await getAuthContext();
  assertExceptionAccess(ctx);

  const trimmed = resolutionNote.trim();
  if (!trimmed) return { ok: false, error: "Resolution note is required" };

  return resolveExceptionInternal(exceptionId, trimmed, ctx!.userId, demoNow());
}

async function resolveExceptionInternal(
  exceptionId: string,
  resolutionNote: string,
  actorUserId: string,
  now: Date,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const exception = await loadExceptionForMutation(exceptionId);
  if (!exception) return { ok: false, error: "Exception not found" };

  if (exception.status === "resolved") {
    return { ok: true };
  }

  if (!isActiveExceptionStatus(exception.status)) {
    return { ok: false, error: "Exception cannot be resolved" };
  }

  const updated = await db
    .update(orderFulfillmentExceptions)
    .set({ status: "resolved", resolvedAt: now })
    .where(
      and(
        eq(orderFulfillmentExceptions.id, exceptionId),
        inArray(orderFulfillmentExceptions.status, [...ACTIVE_EXCEPTION_STATUSES]),
      ),
    )
    .returning({ id: orderFulfillmentExceptions.id });

  if (updated.length === 0) {
    const current = await loadExceptionForMutation(exceptionId);
    if (current?.status === "resolved") return { ok: true };
    return { ok: false, error: "Exception could not be resolved" };
  }

  await recordExceptionAction({
    exceptionId,
    actionType: "resolve",
    note: resolutionNote,
    actorUserId,
    now,
  });

  await restoreOrderAfterResolve(exception.orderId, now);

  revalidateOps();
  revalidatePath(`/ops/exceptions/${exceptionId}`);
  revalidatePath(`/ops/orders/${exception.orderId}`);

  return { ok: true };
}
