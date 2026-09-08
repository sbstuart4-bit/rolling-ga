import type { DeliveryPromiseState, FulfillmentExceptionType, FulfillmentStatus } from "@/lib/types";

export type PackQueueFilter =
  | "all"
  | "ready_to_pack"
  | "packing"
  | "ready_for_handoff"
  | "handed_to_carrier"
  | "blocked"
  | "at_risk";

export type PackOperationalState =
  | "blocked"
  | "ready_to_pack"
  | "packing"
  | "packed"
  | "ready_for_handoff"
  | "handed_to_carrier"
  | "shipped"
  | "delivered"
  | "not_applicable";

export const PACK_OPERATIONAL_STATE_LABELS: Record<PackOperationalState, string> = {
  blocked: "Blocked",
  ready_to_pack: "Ready to pack",
  packing: "Packing",
  packed: "Packed",
  ready_for_handoff: "Ready for handoff",
  handed_to_carrier: "Handed to carrier",
  shipped: "Shipped",
  delivered: "Delivered",
  not_applicable: "Not applicable",
};

export type PackPriorityReason =
  | "past_promise"
  | "blocking_exception"
  | "at_risk"
  | "promise_deadline"
  | "normal";

export const PACK_PRIORITY_REASON_LABELS: Record<PackPriorityReason, string> = {
  past_promise: "Past promise",
  blocking_exception: "Blocking exception",
  at_risk: "Delivery at risk",
  promise_deadline: "Promise deadline",
  normal: "Normal",
};

export interface PackOrderLine {
  productName: string;
  size: string | null;
  quantity: number;
}

export interface PackShipmentInfo {
  id: string | null;
  carrier: string | null;
  service: string | null;
  trackingNumber: string | null;
  carrierReference: string | null;
  status: string | null;
}

export interface PackOrderCard {
  orderId: string;
  orderNumber: string;
  artistName: string;
  eventId: string | null;
  showLabel: string;
  itemCount: number;
  unitCount: number;
  lines: PackOrderLine[];
  promisedDeliveryAt: Date | null;
  promiseState: DeliveryPromiseState;
  fulfillmentStatus: FulfillmentStatus | null;
  operationalState: PackOperationalState;
  blockedReason: string | null;
  priority: number;
  priorityReason: PackPriorityReason;
  priorityLabel: string;
  handoffTargetAt: Date | null;
  packingStartedAt: Date | null;
  packedAt: Date | null;
  readyForHandoffAt: Date | null;
  handedToCarrierAt: Date | null;
  shippedAt: Date | null;
  commerceMoment: "show_night" | "post_show" | "other";
  activationDropTitle: string | null;
  shipment: PackShipmentInfo;
  hasOpenException: boolean;
  exceptionType: FulfillmentExceptionType | null;
  openExceptionId: string | null;
}

export interface PackShowSummary {
  eventId: string;
  artistName: string;
  tourName: string | null;
  venueCity: string;
  readyToPack: number;
  packing: number;
  readyForHandoff: number;
  handedToCarrier: number;
  atRisk: number;
  mustLeaveNext: number;
}

export interface PackQueueSnapshot {
  generatedAt: Date;
  summary: {
    readyToPack: number;
    packing: number;
    packed: number;
    readyForHandoff: number;
    handedToCarrier: number;
    mustLeaveNext: number;
    atRisk: number;
    pastPromise: number;
    blocked: number;
  };
  mustLeaveNext: PackOrderCard[];
  readyToPack: PackOrderCard[];
  readyForHandoff: PackOrderCard[];
  blocked: PackOrderCard[];
  allOrders: PackOrderCard[];
  showSummaries: PackShowSummary[];
}

export function opsPackingHref(filter?: string, eventId?: string): string {
  const params = new URLSearchParams();
  if (filter && filter !== "all") params.set("filter", filter);
  if (eventId) params.set("event", eventId);
  const qs = params.toString();
  return qs ? `/ops/packing?${qs}` : "/ops/packing";
}
