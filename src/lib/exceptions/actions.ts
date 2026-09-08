import type { ExceptionActionType, FulfillmentExceptionStatus, FulfillmentExceptionType } from "@/lib/types";
import { isActiveExceptionStatus } from "./types";

const BASE_ACTIONS: ExceptionActionType[] = ["add_note", "resolve"];

const ACTIONS_BY_TYPE: Record<FulfillmentExceptionType, ExceptionActionType[]> = {
  production_delay: [
    "retry_production",
    "return_to_production",
    "mark_item_unavailable",
    "add_note",
    "resolve",
  ],
  item_unavailable: ["return_to_production", "hold_order", "add_note", "resolve"],
  address_issue: ["confirm_address", "hold_order", "add_note", "resolve"],
  carrier_delay: ["record_carrier_update", "return_to_handoff", "add_note", "resolve"],
  delivery_failed: ["record_delivery_retry", "hold_order", "add_note", "resolve"],
  other: BASE_ACTIONS,
};

export function getAvailableExceptionActions(input: {
  type: FulfillmentExceptionType;
  status: FulfillmentExceptionStatus;
}): ExceptionActionType[] {
  if (!isActiveExceptionStatus(input.status)) return [];
  return ACTIONS_BY_TYPE[input.type] ?? BASE_ACTIONS;
}

export function isOperationalExceptionAction(actionType: ExceptionActionType): boolean {
  return !["add_note", "resolve", "opened", "start_progress"].includes(actionType);
}

export function requiresActionNote(actionType: ExceptionActionType): boolean {
  return actionType === "add_note" || actionType === "resolve";
}
