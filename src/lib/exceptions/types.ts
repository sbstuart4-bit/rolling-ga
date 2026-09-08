import type {
  DeliveryPromiseState,
  ExceptionActionType,
  FulfillmentExceptionStatus,
  FulfillmentExceptionType,
  FulfillmentStatus,
} from "@/lib/types";
import type { ProductionWorkRow } from "@/lib/production/order-status";

export type ExceptionQueueFilter =
  | "open"
  | "in_progress"
  | "past_promise"
  | "at_risk"
  | "resolved"
  | "all";

export type ExceptionOperationalStage =
  | "received"
  | "production"
  | "packing"
  | "handoff"
  | "shipped"
  | "delivered"
  | "exception";

export type ExceptionPriorityReason =
  | "past_promise"
  | "delivery_failed"
  | "blocking_at_risk"
  | "blocking"
  | "at_risk"
  | "normal";

export const BLOCKING_EXCEPTION_TYPES: FulfillmentExceptionType[] = [
  "production_delay",
  "address_issue",
  "item_unavailable",
];

export function isActiveExceptionStatus(status: FulfillmentExceptionStatus): boolean {
  return status === "open" || status === "in_progress";
}

export function isBlockingExceptionType(type: FulfillmentExceptionType): boolean {
  return BLOCKING_EXCEPTION_TYPES.includes(type);
}

export interface ExceptionActionRow {
  id: string;
  actionType: ExceptionActionType;
  note: string | null;
  actorUserId: string;
  actorName: string;
  createdAt: Date;
}

export interface ExceptionQueueItem {
  id: string;
  orderId: string;
  orderNumber: string;
  artistName: string;
  eventId: string | null;
  showLabel: string;
  type: FulfillmentExceptionType;
  status: FulfillmentExceptionStatus;
  note: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  promisedDeliveryAt: Date | null;
  promiseState: DeliveryPromiseState;
  operationalStage: ExceptionOperationalStage;
  priority: number;
  priorityReason: ExceptionPriorityReason;
  priorityLabel: string;
  ageMinutes: number;
  productSummary: string | null;
}

export interface ExceptionWorkbenchSnapshot {
  generatedAt: Date;
  exception: ExceptionQueueItem;
  fulfillmentStatus: FulfillmentStatus | null;
  productionComplete: boolean;
  packingState: string | null;
  handoffReady: boolean;
  availableActions: ExceptionActionType[];
  actions: ExceptionActionRow[];
  returnToFlowLabel: string;
}

export interface ExceptionsQueueSnapshot {
  generatedAt: Date;
  summary: {
    open: number;
    inProgress: number;
    pastPromise: number;
    atRisk: number;
    resolvedToday: number;
  };
  open: ExceptionQueueItem[];
  inProgress: ExceptionQueueItem[];
  pastPromise: ExceptionQueueItem[];
  atRisk: ExceptionQueueItem[];
  recentlyResolved: ExceptionQueueItem[];
  filtered: ExceptionQueueItem[];
}

export interface DeriveOperationalStageInput {
  fulfillmentStatus: FulfillmentStatus | null;
  productionRows: ProductionWorkRow[];
  packingStartedAt: Date | null;
  fulfillmentPackedAt: Date | null;
  readyForHandoffAt: Date | null;
  handedToCarrierAt: Date | null;
  fulfillmentShippedAt: Date | null;
  actualDeliveredAt: Date | null;
}

export interface RestoreFulfillmentInput {
  fulfillmentStatus: FulfillmentStatus | null;
  productionRows: ProductionWorkRow[];
  fulfillmentPackedAt: Date | null;
  fulfillmentShippedAt: Date | null;
  actualDeliveredAt: Date | null;
  handedToCarrierAt: Date | null;
  productionStartedAt: Date | null;
}
