import { formatDateTime } from "@/lib/format";
import type { DeliveryPromiseState } from "@/lib/types";
import type { PackPriorityReason } from "./types";

export function computePackPriority(input: {
  promiseState: DeliveryPromiseState;
  hasBlockingException: boolean;
  promisedDeliveryAt: Date | null;
  placedAt: Date | null;
}): { priority: number; reason: PackPriorityReason; label: string } {
  if (input.promiseState === "past_promise") {
    return { priority: 0, reason: "past_promise", label: "Past promise" };
  }
  if (input.hasBlockingException) {
    return { priority: 1, reason: "blocking_exception", label: "Blocking exception" };
  }
  if (input.promiseState === "at_risk") {
    return { priority: 2, reason: "at_risk", label: "Delivery at risk" };
  }
  if (input.promisedDeliveryAt) {
    return {
      priority: 3,
      reason: "promise_deadline",
      label: `Promise ${formatDateTime(input.promisedDeliveryAt)}`,
    };
  }
  return { priority: 5, reason: "normal", label: "Normal" };
}

export function comparePackPriority(
  a: { priority: number; promisedDeliveryAt: Date | null; placedAt: Date | null },
  b: { priority: number; promisedDeliveryAt: Date | null; placedAt: Date | null },
): number {
  if (a.priority !== b.priority) return a.priority - b.priority;
  const aPromise = a.promisedDeliveryAt?.getTime() ?? Number.POSITIVE_INFINITY;
  const bPromise = b.promisedDeliveryAt?.getTime() ?? Number.POSITIVE_INFINITY;
  if (aPromise !== bPromise) return aPromise - bPromise;
  const aPlaced = a.placedAt?.getTime() ?? 0;
  const bPlaced = b.placedAt?.getTime() ?? 0;
  return aPlaced - bPlaced;
}
