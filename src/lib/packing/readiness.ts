import type { FulfillmentExceptionType, FulfillmentStatus } from "@/lib/types";
import { isOrderProductionComplete, type ProductionWorkRow } from "@/lib/production/order-status";
import type { PackOperationalState } from "./types";

/** Exceptions that prevent packing or handoff until resolved. */
export const BLOCKING_PACK_EXCEPTIONS: FulfillmentExceptionType[] = [
  "item_unavailable",
  "address_issue",
  "production_delay",
];

export function isBlockingPackException(type: FulfillmentExceptionType): boolean {
  return BLOCKING_PACK_EXCEPTIONS.includes(type);
}

export interface PackReadinessInput {
  fulfillmentStatus: FulfillmentStatus | null;
  commerceStatus: string;
  productionRows: ProductionWorkRow[];
  openExceptionTypes: FulfillmentExceptionType[];
  packingStartedAt: Date | null;
  fulfillmentPackedAt: Date | null;
  readyForHandoffAt: Date | null;
  handedToCarrierAt: Date | null;
  fulfillmentShippedAt: Date | null;
  actualDeliveredAt: Date | null;
}

export function isProductionReadyForPacking(rows: ProductionWorkRow[]): boolean {
  if (rows.length === 0) return true;
  return isOrderProductionComplete(rows);
}

export function canOrderEnterPacking(input: PackReadinessInput): {
  allowed: boolean;
  reason: string | null;
} {
  if (["cancelled", "returned"].includes(input.commerceStatus)) {
    return { allowed: false, reason: "Order cancelled" };
  }

  if (input.actualDeliveredAt || input.fulfillmentStatus === "delivered") {
    return { allowed: false, reason: "Already delivered" };
  }

  if (input.fulfillmentShippedAt || input.fulfillmentStatus === "shipped") {
    return { allowed: false, reason: "Already shipped" };
  }

  if (input.fulfillmentPackedAt || input.fulfillmentStatus === "packed") {
    return { allowed: false, reason: "Already packed" };
  }

  const blocking = input.openExceptionTypes.find(isBlockingPackException);
  if (blocking) {
    return { allowed: false, reason: `Open ${blocking.replace(/_/g, " ")} exception` };
  }

  if (!isProductionReadyForPacking(input.productionRows)) {
    return { allowed: false, reason: "Production incomplete" };
  }

  if (
    input.fulfillmentStatus == null ||
    !["received", "production", "exception"].includes(input.fulfillmentStatus)
  ) {
    return { allowed: false, reason: "Not in packable fulfillment state" };
  }

  return { allowed: true, reason: null };
}

export function derivePackOperationalState(input: PackReadinessInput): {
  state: PackOperationalState;
  blockedReason: string | null;
} {
  if (input.actualDeliveredAt || input.fulfillmentStatus === "delivered") {
    return { state: "delivered", blockedReason: null };
  }

  if (input.fulfillmentShippedAt || input.fulfillmentStatus === "shipped") {
    return { state: "shipped", blockedReason: null };
  }

  if (input.handedToCarrierAt) {
    return { state: "handed_to_carrier", blockedReason: null };
  }

  if (input.readyForHandoffAt) {
    return { state: "ready_for_handoff", blockedReason: null };
  }

  if (input.fulfillmentPackedAt) {
    return { state: "packed", blockedReason: null };
  }

  if (input.packingStartedAt) {
    if (!isProductionReadyForPacking(input.productionRows)) {
      return { state: "blocked", blockedReason: "Production incomplete" };
    }
    return { state: "packing", blockedReason: null };
  }

  const readiness = canOrderEnterPacking(input);
  if (readiness.allowed) {
    return { state: "ready_to_pack", blockedReason: null };
  }

  if (input.openExceptionTypes.some(isBlockingPackException)) {
    return { state: "blocked", blockedReason: readiness.reason };
  }

  if (!isProductionReadyForPacking(input.productionRows)) {
    return { state: "blocked", blockedReason: readiness.reason ?? "Production incomplete" };
  }

  return { state: "not_applicable", blockedReason: readiness.reason };
}

export function canMarkHandedToCarrier(input: PackReadinessInput): {
  allowed: boolean;
  reason: string | null;
} {
  if (!input.readyForHandoffAt && !input.fulfillmentPackedAt) {
    return { allowed: false, reason: "Order not packed" };
  }

  if (input.handedToCarrierAt) {
    return { allowed: false, reason: "Already handed to carrier" };
  }

  if (input.fulfillmentShippedAt) {
    return { allowed: false, reason: "Already shipped" };
  }

  const blocking = input.openExceptionTypes.find(isBlockingPackException);
  if (blocking) {
    return { allowed: false, reason: `Open ${blocking.replace(/_/g, " ")} exception` };
  }

  return { allowed: true, reason: null };
}
