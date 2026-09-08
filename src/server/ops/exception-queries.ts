import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  artists,
  events,
  fulfillmentExceptionActions,
  orderFulfillmentExceptions,
  orderItems,
  orders,
  productionWork,
  tours,
  users,
  venues,
} from "@/db/schema";
import {
  classifyDeliveryPromiseState,
  computePromisedDeliveryAt,
  resolveFulfillmentStatus,
} from "@/lib/fulfillment";
import {
  computeExceptionPriority,
  describeReturnToFlow,
  deriveExceptionOperationalStage,
  getAvailableExceptionActions,
  isActiveExceptionStatus,
  isBlockingExceptionType,
  sortExceptionQueueItems,
  type ExceptionQueueFilter,
  type ExceptionQueueItem,
  type ExceptionsQueueSnapshot,
  type ExceptionWorkbenchSnapshot,
} from "@/lib/exceptions";
import {
  EXCEPTION_ACTION_LABELS,
  FULFILLMENT_EXCEPTION_LABELS,
  FULFILLMENT_EXCEPTION_STATUS_LABELS,
  type FulfillmentExceptionStatus,
  type FulfillmentExceptionType,
  type ProductionRequirementMode,
  type ProductionWorkStatus,
} from "@/lib/types";
import { isOrderProductionComplete } from "@/lib/production/order-status";
import { derivePackOperationalState, isBlockingPackException } from "@/lib/packing/readiness";
import { canOperateFulfillment } from "@/server/auth/guards";
import type { AuthContext } from "@/server/auth/session";
import { demoNow } from "@/server/demo/clock";

const ACTIVE_EXCEPTION_STATUSES: FulfillmentExceptionStatus[] = ["open", "in_progress"];

function assertExceptionAccess(ctx: AuthContext): void {
  if (!canOperateFulfillment(ctx)) {
    throw new Error("Exception resolution access denied");
  }
}

function startOfToday(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function loadExceptionRows(eventId?: string | null) {
  const rows = await db
    .select({
      id: orderFulfillmentExceptions.id,
      orderId: orderFulfillmentExceptions.orderId,
      type: orderFulfillmentExceptions.type,
      status: orderFulfillmentExceptions.status,
      note: orderFulfillmentExceptions.note,
      createdAt: orderFulfillmentExceptions.createdAt,
      resolvedAt: orderFulfillmentExceptions.resolvedAt,
      orderNumber: orders.orderNumber,
      artistName: artists.name,
      eventId: orders.eventId,
      venueCity: venues.city,
      tourName: tours.name,
      placedAt: orders.placedAt,
      promisedDeliveryAt: orders.promisedDeliveryAt,
      actualDeliveredAt: orders.actualDeliveredAt,
      fulfillmentStatus: orders.fulfillmentStatus,
      commerceStatus: orders.status,
      estimatedDeliveryFrom: orders.estimatedDeliveryFrom,
      estimatedDeliveryTo: orders.estimatedDeliveryTo,
      eventStartsAt: events.startsAt,
      eventEndsAt: events.endsAt,
      timezone: events.timezone,
      packingStartedAt: orders.packingStartedAt,
      fulfillmentPackedAt: orders.fulfillmentPackedAt,
      readyForHandoffAt: orders.readyForHandoffAt,
      handedToCarrierAt: orders.handedToCarrierAt,
      fulfillmentShippedAt: orders.fulfillmentShippedAt,
    })
    .from(orderFulfillmentExceptions)
    .innerJoin(orders, eq(orders.id, orderFulfillmentExceptions.orderId))
    .innerJoin(artists, eq(artists.id, orders.artistId))
    .leftJoin(events, eq(events.id, orders.eventId))
    .leftJoin(venues, eq(venues.id, events.venueId))
    .leftJoin(tours, eq(tours.id, events.tourId))
    .where(
      eventId
        ? and(eq(orders.eventId, eventId), sql`${orders.status} NOT IN ('pending', 'cancelled')`)
        : sql`${orders.status} NOT IN ('pending', 'cancelled')`,
    )
    .orderBy(desc(orderFulfillmentExceptions.createdAt));

  return rows;
}

async function loadProductSummaries(orderIds: string[]): Promise<Map<string, string>> {
  if (orderIds.length === 0) return new Map();
  const items = await db
    .select({
      orderId: orderItems.orderId,
      name: orderItems.nameSnapshot,
      size: orderItems.sizeSnapshot,
    })
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds));

  const map = new Map<string, string>();
  for (const item of items) {
    const label = item.size ? `${item.name} · ${item.size}` : item.name;
    const existing = map.get(item.orderId);
    map.set(item.orderId, existing ? `${existing}, ${label}` : label);
  }
  return map;
}

async function loadProductionByOrder(orderIds: string[]) {
  if (orderIds.length === 0) return new Map();
  const rows = await db
    .select({
      orderId: productionWork.orderId,
      orderItemId: productionWork.orderItemId,
      productName: productionWork.nameSnapshot,
      size: productionWork.sizeSnapshot,
      status: productionWork.status,
      requirementMode: productionWork.requirementMode,
    })
    .from(productionWork)
    .where(inArray(productionWork.orderId, orderIds));

  const map = new Map<string, {
    orderItemId: string;
    productName: string;
    size: string | null;
    status: ProductionWorkStatus;
    requirementMode: ProductionRequirementMode;
  }[]>();
  for (const row of rows) {
    const list = map.get(row.orderId) ?? [];
    list.push({
      orderItemId: row.orderItemId,
      productName: row.productName,
      size: row.size,
      status: row.status as ProductionWorkStatus,
      requirementMode: row.requirementMode as ProductionRequirementMode,
    });
    map.set(row.orderId, list);
  }
  return map;
}

function buildQueueItem(
  row: Awaited<ReturnType<typeof loadExceptionRows>>[number],
  now: Date,
  productSummary: string | null,
  productionRows: {
    orderItemId: string;
    productName: string;
    size: string | null;
    status: ProductionWorkStatus;
    requirementMode: ProductionRequirementMode;
  }[],
): ExceptionQueueItem {
  const fulfillmentStatus = resolveFulfillmentStatus(
    row.fulfillmentStatus,
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

  const promiseState = classifyDeliveryPromiseState({
    promisedDeliveryAt,
    actualDeliveredAt: row.actualDeliveredAt,
    placedAt: row.placedAt,
    fulfillmentStatus,
    now,
  });

  const type = row.type as FulfillmentExceptionType;
  const isBlocking = isBlockingExceptionType(type);
  const { priority, reason, label } = computeExceptionPriority({
    promiseState,
    type,
    isBlocking,
  });

  const operationalStage = deriveExceptionOperationalStage({
    fulfillmentStatus,
    productionRows,
    packingStartedAt: row.packingStartedAt,
    fulfillmentPackedAt: row.fulfillmentPackedAt,
    readyForHandoffAt: row.readyForHandoffAt,
    handedToCarrierAt: row.handedToCarrierAt,
    fulfillmentShippedAt: row.fulfillmentShippedAt,
    actualDeliveredAt: row.actualDeliveredAt,
  });

  const ageMinutes = Math.max(0, Math.floor((now.getTime() - row.createdAt.getTime()) / 60_000));

  return {
    id: row.id,
    orderId: row.orderId,
    orderNumber: row.orderNumber,
    artistName: row.artistName,
    eventId: row.eventId,
    showLabel: `${row.venueCity ?? "—"} · ${row.tourName ?? "Show"}`,
    type,
    status: row.status as FulfillmentExceptionStatus,
    note: row.note,
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt,
    promisedDeliveryAt,
    promiseState,
    operationalStage,
    priority,
    priorityReason: reason,
    priorityLabel: label,
    ageMinutes,
    productSummary,
  };
}

export async function loadExceptionsQueue(
  ctx: AuthContext,
  filter: ExceptionQueueFilter = "open",
  eventId?: string | null,
): Promise<ExceptionsQueueSnapshot> {
  assertExceptionAccess(ctx);
  const now = demoNow();
  const rows = await loadExceptionRows(eventId);
  const orderIds = [...new Set(rows.map((r) => r.orderId))];
  const [productSummaries, productionByOrder] = await Promise.all([
    loadProductSummaries(orderIds),
    loadProductionByOrder(orderIds),
  ]);

  const allItems = rows.map((row) =>
    buildQueueItem(
      row,
      now,
      productSummaries.get(row.orderId) ?? null,
      productionByOrder.get(row.orderId) ?? [],
    ),
  );

  const active = allItems.filter((item) => isActiveExceptionStatus(item.status));
  const open = sortExceptionQueueItems(active.filter((item) => item.status === "open"));
  const inProgress = sortExceptionQueueItems(
    active.filter((item) => item.status === "in_progress"),
  );
  const pastPromise = sortExceptionQueueItems(
    active.filter((item) => item.promiseState === "past_promise"),
  );
  const atRisk = sortExceptionQueueItems(active.filter((item) => item.promiseState === "at_risk"));
  const todayStart = startOfToday(now);
  const recentlyResolved = sortExceptionQueueItems(
    allItems.filter(
      (item) =>
        item.status === "resolved" && item.resolvedAt && item.resolvedAt.getTime() >= todayStart.getTime(),
    ),
  ).slice(0, 20);

  let filtered = active;
  switch (filter) {
    case "in_progress":
      filtered = inProgress;
      break;
    case "past_promise":
      filtered = pastPromise;
      break;
    case "at_risk":
      filtered = atRisk;
      break;
    case "resolved":
      filtered = recentlyResolved;
      break;
    case "all":
      filtered = sortExceptionQueueItems(active);
      break;
    default:
      filtered = sortExceptionQueueItems([...open, ...inProgress]);
  }

  return {
    generatedAt: now,
    summary: {
      open: open.length,
      inProgress: inProgress.length,
      pastPromise: pastPromise.length,
      atRisk: atRisk.length,
      resolvedToday: recentlyResolved.length,
    },
    open,
    inProgress,
    pastPromise,
    atRisk,
    recentlyResolved,
    filtered,
  };
}

export async function loadExceptionWorkbench(
  ctx: AuthContext,
  exceptionId: string,
): Promise<ExceptionWorkbenchSnapshot | null> {
  assertExceptionAccess(ctx);
  const now = demoNow();

  const [row] = await loadExceptionRows().then((rows) =>
    rows.filter((r) => r.id === exceptionId),
  );
  if (!row) return null;

  const productionRows = (await loadProductionByOrder([row.orderId])).get(row.orderId) ?? [];
  const productSummaries = await loadProductSummaries([row.orderId]);
  const exception = buildQueueItem(
    row,
    now,
    productSummaries.get(row.orderId) ?? null,
    productionRows,
  );

  const fulfillmentStatus = resolveFulfillmentStatus(
    row.fulfillmentStatus,
    row.commerceStatus as never,
  );
  const productionComplete = isOrderProductionComplete(productionRows);
  const packState = derivePackOperationalState({
    fulfillmentStatus,
    commerceStatus: row.commerceStatus,
    productionRows,
    openExceptionTypes: isActiveExceptionStatus(exception.status) ? [exception.type] : [],
    packingStartedAt: row.packingStartedAt,
    fulfillmentPackedAt: row.fulfillmentPackedAt,
    readyForHandoffAt: row.readyForHandoffAt,
    handedToCarrierAt: row.handedToCarrierAt,
    fulfillmentShippedAt: row.fulfillmentShippedAt,
    actualDeliveredAt: row.actualDeliveredAt,
  });

  const actionRows = await db
    .select({
      id: fulfillmentExceptionActions.id,
      actionType: fulfillmentExceptionActions.actionType,
      note: fulfillmentExceptionActions.note,
      actorUserId: fulfillmentExceptionActions.actorUserId,
      actorName: users.displayName,
      createdAt: fulfillmentExceptionActions.createdAt,
    })
    .from(fulfillmentExceptionActions)
    .innerJoin(users, eq(users.id, fulfillmentExceptionActions.actorUserId))
    .where(eq(fulfillmentExceptionActions.exceptionId, exceptionId))
    .orderBy(fulfillmentExceptionActions.createdAt);

  const openedEntry = {
    id: `opened-${exception.id}`,
    actionType: "opened" as const,
    note: exception.note,
    actorUserId: "system",
    actorName: "System",
    createdAt: exception.createdAt,
  };

  const actions = [
    openedEntry,
    ...actionRows.map((a) => ({
      id: a.id,
      actionType: a.actionType,
      note: a.note,
      actorUserId: a.actorUserId,
      actorName: a.actorName ?? "Operator",
      createdAt: a.createdAt,
    })),
  ];

  return {
    generatedAt: now,
    exception,
    fulfillmentStatus,
    productionComplete,
    packingState: packState.state,
    handoffReady: packState.state === "ready_for_handoff",
    availableActions: getAvailableExceptionActions({
      type: exception.type,
      status: exception.status,
    }),
    actions,
    returnToFlowLabel: describeReturnToFlow({
      type: exception.type,
      operationalStage: exception.operationalStage,
      productionComplete,
    }),
  };
}

export async function loadShowExceptionSummary(
  ctx: AuthContext,
  eventId: string,
): Promise<{
  open: number;
  pastPromise: number;
  byType: Record<string, number>;
}> {
  assertExceptionAccess(ctx);
  const now = demoNow();
  const rows = await loadExceptionRows(eventId);
  const active = rows.filter((r) => isActiveExceptionStatus(r.status as FulfillmentExceptionStatus));

  let pastPromise = 0;
  const byType: Record<string, number> = {};

  for (const row of active) {
    byType[row.type] = (byType[row.type] ?? 0) + 1;
    const fulfillmentStatus = resolveFulfillmentStatus(
      row.fulfillmentStatus,
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
    const promiseState = classifyDeliveryPromiseState({
      promisedDeliveryAt,
      actualDeliveredAt: row.actualDeliveredAt,
      placedAt: row.placedAt,
      fulfillmentStatus,
      now,
    });
    if (promiseState === "past_promise") pastPromise++;
  }

  return { open: active.length, pastPromise, byType };
}

export {
  FULFILLMENT_EXCEPTION_LABELS,
  FULFILLMENT_EXCEPTION_STATUS_LABELS,
  EXCEPTION_ACTION_LABELS,
};

export function isExceptionBlockingPack(type: FulfillmentExceptionType): boolean {
  return isBlockingPackException(type);
}

export async function loadActiveExceptionsForOrders(orderIds: string[]) {
  if (orderIds.length === 0) return [];
  return db
    .select({
      id: orderFulfillmentExceptions.id,
      orderId: orderFulfillmentExceptions.orderId,
      type: orderFulfillmentExceptions.type,
      note: orderFulfillmentExceptions.note,
      createdAt: orderFulfillmentExceptions.createdAt,
      status: orderFulfillmentExceptions.status,
    })
    .from(orderFulfillmentExceptions)
    .where(
      and(
        inArray(orderFulfillmentExceptions.orderId, orderIds),
        inArray(orderFulfillmentExceptions.status, ACTIVE_EXCEPTION_STATUSES),
      ),
    );
}
