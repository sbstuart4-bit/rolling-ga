import type { DeliveryPromiseState } from "@/lib/types";
import type { OpsAttentionItem } from "./types";

/** Lower number = higher urgency. */
export function promiseStatePriority(state: DeliveryPromiseState): number {
  switch (state) {
    case "past_promise":
      return 0;
    case "at_risk":
      return 2;
    case "within_promise":
      return 4;
    case "delivered_past_promise":
      return 5;
    case "delivered_within_promise":
      return 6;
    default:
      return 7;
  }
}

export function computeAttentionPriority(input: {
  promiseState: DeliveryPromiseState;
  hasOpenException: boolean;
  fulfillmentStatus: string | null;
}): number {
  let priority = promiseStatePriority(input.promiseState);
  if (input.hasOpenException) priority = Math.min(priority, 1);
  if (input.fulfillmentStatus === "exception") priority = Math.min(priority, 1);
  return priority;
}

export function compareAttentionItems(a: OpsAttentionItem, b: OpsAttentionItem): number {
  if (a.priority !== b.priority) return a.priority - b.priority;

  const aPromise = a.promisedDeliveryAt?.getTime() ?? Number.POSITIVE_INFINITY;
  const bPromise = b.promisedDeliveryAt?.getTime() ?? Number.POSITIVE_INFINITY;
  if (aPromise !== bPromise) return aPromise - bPromise;

  const aOpened = a.openedAt?.getTime() ?? Number.POSITIVE_INFINITY;
  const bOpened = b.openedAt?.getTime() ?? Number.POSITIVE_INFINITY;
  return aOpened - bOpened;
}

export function sortAttentionItems(items: OpsAttentionItem[]): OpsAttentionItem[] {
  return [...items].sort(compareAttentionItems);
}

export function attentionReasonLabel(input: {
  promiseState: DeliveryPromiseState;
  hasOpenException: boolean;
  exceptionType: string | null;
  fulfillmentStatus: string | null;
}): string {
  if (input.hasOpenException && input.exceptionType) {
    return formatExceptionType(input.exceptionType);
  }
  if (input.fulfillmentStatus === "exception") return "Fulfillment exception";
  if (input.promiseState === "past_promise") return "Past promise";
  if (input.promiseState === "at_risk") return "At risk";
  return "Needs review";
}

function formatExceptionType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
