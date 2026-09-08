import type {
  DeliveryPromiseState,
  FulfillmentStatus,
  OrderStatus,
} from "@/lib/types";

export const DELIVERY_PROMISE_STATE_LABELS: Record<DeliveryPromiseState, string> = {
  within_promise: "Within promise",
  at_risk: "At risk",
  past_promise: "Past promise",
  delivered_within_promise: "Delivered within promise",
  delivered_past_promise: "Delivered after promise",
  not_applicable: "Not applicable",
};

export function fulfillmentHref(eventId: string): string {
  return `/studio/orders?event=${eventId}`;
}

/** Commerce statuses that exclude an order from fulfillment operations. */
const NON_FULFILLMENT_COMMERCE_STATUSES = new Set<OrderStatus>([
  "pending",
  "cancelled",
  "returned",
]);

/**
 * Resolve fulfillment status from explicit column or legacy commerce status mapping.
 */
export function resolveFulfillmentStatus(
  fulfillmentStatus: FulfillmentStatus | null | undefined,
  commerceStatus: OrderStatus,
): FulfillmentStatus | null {
  if (fulfillmentStatus) return fulfillmentStatus;
  if (NON_FULFILLMENT_COMMERCE_STATUSES.has(commerceStatus)) return null;

  switch (commerceStatus) {
    case "paid":
    case "allocated":
      return "received";
    case "picking":
      return "production";
    case "packed":
    case "ready_to_ship":
      return "packed";
    case "shipped":
      return "shipped";
    case "delivered":
      return "delivered";
    case "exception":
      return "exception";
    default:
      return null;
  }
}

export function isFulfillmentEligibleCommerceStatus(status: OrderStatus): boolean {
  return !NON_FULFILLMENT_COMMERCE_STATUSES.has(status);
}

export interface FulfillmentTimelineEvent {
  key: "received" | "production" | "packed" | "shipped" | "delivered";
  label: string;
  at: Date | null;
}

export function buildFulfillmentTimeline(input: {
  fulfillmentReceivedAt: Date | null;
  productionStartedAt: Date | null;
  fulfillmentPackedAt: Date | null;
  fulfillmentShippedAt: Date | null;
  actualDeliveredAt: Date | null;
  placedAt: Date | null;
}): FulfillmentTimelineEvent[] {
  return [
    {
      key: "received",
      label: "Order received",
      at: input.fulfillmentReceivedAt ?? input.placedAt,
    },
    {
      key: "production",
      label: "Production started",
      at: input.productionStartedAt,
    },
    {
      key: "packed",
      label: "Packed",
      at: input.fulfillmentPackedAt,
    },
    {
      key: "shipped",
      label: "Shipped",
      at: input.fulfillmentShippedAt,
    },
    {
      key: "delivered",
      label: "Delivered",
      at: input.actualDeliveredAt,
    },
  ];
}

const MS_HOUR = 3_600_000;

/**
 * Rolling GA delivery promise rules (demo + operational).
 *
 * SHOW-NIGHT ORDERS (placed during the live show window):
 *   Promised by 6:00 PM local time the following calendar day.
 *
 * POST-SHOW / ACTIVATION ORDERS:
 *   Promised by `estimatedDeliveryTo` when present, else placedAt + max shipping days.
 *
 * AT RISK (undelivered):
 *   Now is past 75% of elapsed time from placedAt to promisedDeliveryAt.
 *
 * PAST PROMISE (undelivered):
 *   Now is after promisedDeliveryAt.
 */
export function computePromisedDeliveryAt(input: {
  placedAt: Date;
  eventStartsAt: Date | null;
  eventEndsAt: Date | null;
  timezone: string;
  estimatedDeliveryTo: Date | null;
  estimatedDeliveryFrom: Date | null;
}): Date {
  const { placedAt, eventStartsAt, eventEndsAt, estimatedDeliveryTo } = input;

  const isShowNight =
    eventStartsAt &&
    eventEndsAt &&
    placedAt.getTime() >= eventStartsAt.getTime() &&
    placedAt.getTime() <= eventEndsAt.getTime();

  if (isShowNight && eventEndsAt) {
    const nextDay = new Date(eventEndsAt);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(18, 0, 0, 0);
    return nextDay;
  }

  if (estimatedDeliveryTo) return estimatedDeliveryTo;

  return new Date(placedAt.getTime() + 7 * 24 * MS_HOUR);
}

export function classifyDeliveryPromiseState(input: {
  promisedDeliveryAt: Date | null;
  actualDeliveredAt: Date | null;
  placedAt: Date | null;
  fulfillmentStatus: FulfillmentStatus | null;
  now: Date;
}): DeliveryPromiseState {
  const { promisedDeliveryAt, actualDeliveredAt, placedAt, fulfillmentStatus, now } = input;

  if (!promisedDeliveryAt || !placedAt || !fulfillmentStatus) return "not_applicable";
  if (fulfillmentStatus === "exception") return "not_applicable";

  if (actualDeliveredAt) {
    return actualDeliveredAt.getTime() <= promisedDeliveryAt.getTime()
      ? "delivered_within_promise"
      : "delivered_past_promise";
  }

  if (now.getTime() > promisedDeliveryAt.getTime()) return "past_promise";

  const totalWindow = promisedDeliveryAt.getTime() - placedAt.getTime();
  const elapsed = now.getTime() - placedAt.getTime();
  if (totalWindow > 0 && elapsed / totalWindow >= 0.75) return "at_risk";

  return "within_promise";
}

export function isDeliveredWithinPromise(
  promisedDeliveryAt: Date | null,
  actualDeliveredAt: Date | null,
): boolean {
  if (!promisedDeliveryAt || !actualDeliveredAt) return false;
  return actualDeliveredAt.getTime() <= promisedDeliveryAt.getTime();
}

export interface DeliveryPerformanceMetrics {
  deliveredCount: number;
  deliveredWithinPromise: number;
  deliveredPastPromise: number;
  atRiskCount: number;
  pastPromiseCount: number;
  openExceptions: number;
  deliveryPromiseRate: number | null;
}

export function aggregateDeliveryPerformance(
  orders: {
    promisedDeliveryAt: Date | null;
    actualDeliveredAt: Date | null;
    placedAt: Date | null;
    fulfillmentStatus: FulfillmentStatus | null;
    hasOpenException: boolean;
  }[],
  now: Date,
): DeliveryPerformanceMetrics {
  let deliveredCount = 0;
  let deliveredWithinPromise = 0;
  let deliveredPastPromise = 0;
  let atRiskCount = 0;
  let pastPromiseCount = 0;
  let openExceptions = 0;

  for (const order of orders) {
    if (!order.fulfillmentStatus) continue;
    if (order.hasOpenException) openExceptions++;

    const state = classifyDeliveryPromiseState({
      promisedDeliveryAt: order.promisedDeliveryAt,
      actualDeliveredAt: order.actualDeliveredAt,
      placedAt: order.placedAt,
      fulfillmentStatus: order.fulfillmentStatus,
      now,
    });

    if (state === "delivered_within_promise") {
      deliveredCount++;
      deliveredWithinPromise++;
    } else if (state === "delivered_past_promise") {
      deliveredCount++;
      deliveredPastPromise++;
    } else if (state === "at_risk") {
      atRiskCount++;
    } else if (state === "past_promise") {
      pastPromiseCount++;
    }
  }

  return {
    deliveredCount,
    deliveredWithinPromise,
    deliveredPastPromise,
    atRiskCount,
    pastPromiseCount,
    openExceptions,
    deliveryPromiseRate:
      deliveredCount > 0 ? deliveredWithinPromise / deliveredCount : null,
  };
}

export interface FulfillmentPipelineCounts {
  received: number;
  production: number;
  packed: number;
  shipped: number;
  delivered: number;
  exception: number;
  total: number;
}

/** Current-state pipeline counts — where orders are NOW, not cumulative throughput. */
export function countFulfillmentPipeline(
  statuses: (FulfillmentStatus | null)[],
): FulfillmentPipelineCounts {
  const counts: FulfillmentPipelineCounts = {
    received: 0,
    production: 0,
    packed: 0,
    shipped: 0,
    delivered: 0,
    exception: 0,
    total: 0,
  };

  for (const status of statuses) {
    if (!status) continue;
    counts[status]++;
    counts.total++;
  }

  return counts;
}
