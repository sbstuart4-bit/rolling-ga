import { formatDateTime } from "@/lib/format";
import type { DeliveryPromiseState } from "@/lib/types";
import type { ProductionPriorityReason } from "./types";

/** Lower number = higher urgency. Aligns with Ops Phase 1 promise prioritization. */
export function promiseStatePriority(state: DeliveryPromiseState): number {
  switch (state) {
    case "past_promise":
      return 0;
    case "at_risk":
      return 2;
    case "within_promise":
      return 4;
    default:
      return 6;
  }
}

export function computeProductionPriority(input: {
  promiseState: DeliveryPromiseState;
  hasProductionException: boolean;
  promisedDeliveryAt: Date | null;
  queuedAt: Date;
}): { priority: number; reason: ProductionPriorityReason; label: string } {
  if (input.promiseState === "past_promise") {
    return { priority: 0, reason: "past_promise", label: "Past promise" };
  }
  if (input.hasProductionException) {
    return { priority: 1, reason: "production_exception", label: "Production delay" };
  }
  if (input.promiseState === "at_risk") {
    return { priority: 2, reason: "at_risk", label: "Delivery at risk" };
  }
  if (input.promisedDeliveryAt) {
    const deadlineLabel = formatDateTime(input.promisedDeliveryAt);
    return {
      priority: 3,
      reason: "promise_deadline",
      label: `Promise ${deadlineLabel}`,
    };
  }
  return { priority: 5, reason: "normal", label: "Normal" };
}

export function compareProductionPriority(
  a: { priority: number; promisedDeliveryAt: Date | null; queuedAt: Date },
  b: { priority: number; promisedDeliveryAt: Date | null; queuedAt: Date },
): number {
  if (a.priority !== b.priority) return a.priority - b.priority;
  const aPromise = a.promisedDeliveryAt?.getTime() ?? Number.POSITIVE_INFINITY;
  const bPromise = b.promisedDeliveryAt?.getTime() ?? Number.POSITIVE_INFINITY;
  if (aPromise !== bPromise) return aPromise - bPromise;
  return a.queuedAt.getTime() - b.queuedAt.getTime();
}
