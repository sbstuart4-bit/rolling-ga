export * from "./types";
export * from "./show-state";
export * from "./prioritization";

export function opsShowHref(eventId: string): string {
  return `/ops/shows/${eventId}`;
}

export function opsOrderHref(orderId: string): string {
  return `/ops/orders/${orderId}`;
}

export { opsExceptionHref, opsExceptionsHref } from "@/lib/exceptions";
