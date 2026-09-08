import type { DeliveryPromiseState, FulfillmentExceptionType } from "@/lib/types";
import {
  isBlockingExceptionType,
  type ExceptionPriorityReason,
  type ExceptionQueueItem,
} from "./types";

export function computeExceptionPriority(input: {
  promiseState: DeliveryPromiseState;
  type: FulfillmentExceptionType;
  isBlocking: boolean;
}): { priority: number; reason: ExceptionPriorityReason; label: string } {
  if (input.promiseState === "past_promise") {
    return { priority: 0, reason: "past_promise", label: "Past promise" };
  }
  if (input.type === "delivery_failed") {
    return { priority: 1, reason: "delivery_failed", label: "Delivery failed" };
  }
  if (input.isBlocking && input.promiseState === "at_risk") {
    return { priority: 2, reason: "blocking_at_risk", label: "Blocking · at risk" };
  }
  if (input.isBlocking) {
    const label =
      input.type === "production_delay"
        ? "Blocking production"
        : input.type === "address_issue"
          ? "Address block"
          : input.type === "item_unavailable"
            ? "Item unavailable"
            : "Blocking exception";
    return { priority: 3, reason: "blocking", label };
  }
  if (input.type === "carrier_delay") {
    return { priority: 4, reason: "blocking", label: "Carrier delay" };
  }
  if (input.promiseState === "at_risk") {
    return { priority: 5, reason: "at_risk", label: "Promise at risk" };
  }
  return { priority: 6, reason: "normal", label: "Normal" };
}

export function compareExceptionQueueItems(a: ExceptionQueueItem, b: ExceptionQueueItem): number {
  if (a.priority !== b.priority) return a.priority - b.priority;

  const aPromise = a.promisedDeliveryAt?.getTime() ?? Number.POSITIVE_INFINITY;
  const bPromise = b.promisedDeliveryAt?.getTime() ?? Number.POSITIVE_INFINITY;
  if (aPromise !== bPromise) return aPromise - bPromise;

  return a.createdAt.getTime() - b.createdAt.getTime();
}

export function sortExceptionQueueItems(items: ExceptionQueueItem[]): ExceptionQueueItem[] {
  return [...items].sort(compareExceptionQueueItems);
}

export function priorityReasonForType(type: FulfillmentExceptionType): string {
  switch (type) {
    case "production_delay":
      return "Blocking production";
    case "address_issue":
      return "Address block";
    case "item_unavailable":
      return "Item unavailable";
    case "carrier_delay":
      return "Carrier delay";
    case "delivery_failed":
      return "Delivery failed";
    default:
      return "Exception";
  }
}
