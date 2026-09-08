import { isOrderProductionComplete } from "@/lib/production/order-status";
import type {
  DeriveOperationalStageInput,
  ExceptionOperationalStage,
  RestoreFulfillmentInput,
} from "./types";
import type { FulfillmentStatus } from "@/lib/types";

export function deriveExceptionOperationalStage(
  input: DeriveOperationalStageInput,
): ExceptionOperationalStage {
  if (input.actualDeliveredAt || input.fulfillmentStatus === "delivered") {
    return "delivered";
  }
  if (input.fulfillmentShippedAt || input.fulfillmentStatus === "shipped") {
    return "shipped";
  }
  if (input.handedToCarrierAt) return "handoff";
  if (input.readyForHandoffAt || input.fulfillmentPackedAt || input.fulfillmentStatus === "packed") {
    return "handoff";
  }
  if (input.packingStartedAt) return "packing";
  if (
    input.productionRows.length > 0 &&
    !isOrderProductionComplete(input.productionRows)
  ) {
    return "production";
  }
  if (input.fulfillmentStatus === "production") return "production";
  if (input.fulfillmentStatus === "exception") return "exception";
  if (input.fulfillmentStatus === "received") return "received";
  return input.fulfillmentStatus === "packed" ? "handoff" : "received";
}

/** Restore order fulfillment status after exception resolution — does not advance workflow. */
export function deriveReturnFulfillmentStatus(
  input: RestoreFulfillmentInput,
): FulfillmentStatus | null {
  if (input.actualDeliveredAt) return "delivered";
  if (input.fulfillmentShippedAt) return "shipped";
  if (input.fulfillmentPackedAt || input.handedToCarrierAt) return "packed";

  const productionIncomplete =
    input.productionRows.length > 0 && !isOrderProductionComplete(input.productionRows);

  if (productionIncomplete || input.productionStartedAt) return "production";
  if (input.fulfillmentStatus === "received") return "received";

  return input.fulfillmentStatus === "exception" ? "received" : input.fulfillmentStatus;
}

export function describeReturnToFlow(input: {
  type: string;
  operationalStage: ExceptionOperationalStage;
  productionComplete: boolean;
}): string {
  switch (input.type) {
    case "production_delay":
      return input.productionComplete
        ? "Order returns to packing eligibility when readiness rules pass."
        : "Production queue becomes actionable again — units are not auto-completed.";
    case "item_unavailable":
      return "Order remains blocked until production/readiness conditions are valid.";
    case "address_issue":
      return input.operationalStage === "handoff" || input.operationalStage === "packing"
        ? "Handoff readiness recalculates from packing rules."
        : "Order returns to normal flow when readiness rules pass.";
    case "carrier_delay":
      return "Shipment stays in current outbound state — no automatic carrier action.";
    case "delivery_failed":
      return "Does not mark delivered — outbound state unchanged.";
    default:
      return "Blocking condition cleared — order returns to derived operational state.";
  }
}
