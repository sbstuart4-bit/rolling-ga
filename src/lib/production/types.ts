import type { DeliveryPromiseState } from "@/lib/types";
import type { ProductionRequirementMode, ProductionWorkStatus } from "@/lib/types";

export type ProductionQueueFilter =
  | "all"
  | "queued"
  | "in_production"
  | "at_risk"
  | "complete";

export type ProductionPriorityReason =
  | "past_promise"
  | "production_exception"
  | "at_risk"
  | "promise_deadline"
  | "normal";

export const PRODUCTION_PRIORITY_REASON_LABELS: Record<ProductionPriorityReason, string> = {
  past_promise: "Past promise",
  production_exception: "Production delay",
  at_risk: "Delivery at risk",
  promise_deadline: "Promise deadline",
  normal: "Normal",
};

export interface ProductionWorkUnit {
  id: string;
  orderItemId: string;
  orderId: string;
  orderNumber: string;
  artistId: string;
  artistName: string;
  eventId: string | null;
  showLabel: string;
  productId: string | null;
  productName: string;
  variantId: string | null;
  size: string | null;
  unitIndex: number;
  status: ProductionWorkStatus;
  requirementMode: ProductionRequirementMode;
  promisedDeliveryAt: Date | null;
  promiseState: DeliveryPromiseState;
  hasProductionException: boolean;
  openExceptionId: string | null;
  openExceptionType: string | null;
  commerceMoment: "show_night" | "post_show" | "other";
  activationDropTitle: string | null;
  queuedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  priority: number;
  priorityReason: ProductionPriorityReason;
  priorityLabel: string;
}

export interface ProductionVariantGroup {
  groupKey: string;
  artistName: string;
  eventId: string | null;
  showLabel: string;
  tourName: string | null;
  productId: string | null;
  productName: string;
  variantId: string | null;
  size: string | null;
  unitsQueued: number;
  unitsInProduction: number;
  unitsComplete: number;
  unitsRemaining: number;
  unitsAtRisk: number;
  orderIds: string[];
  orderCount: number;
  earliestPromise: Date | null;
  priority: number;
  priorityReason: ProductionPriorityReason;
  priorityLabel: string;
  workIds: string[];
}

export interface ProductionShowSummary {
  eventId: string;
  artistName: string;
  tourName: string | null;
  venueCity: string;
  unitsRemaining: number;
  unitsAtRisk: number;
  ordersBlocked: number;
  unitsQueued: number;
  unitsInProduction: number;
}

export interface ProductionBlockedOrder {
  orderId: string;
  orderNumber: string;
  artistName: string;
  showLabel: string;
  exceptionType: string;
  openExceptionId: string | null;
  priorityLabel: string;
}

export interface ProductionQueueSnapshot {
  generatedAt: Date;
  summary: {
    unitsQueued: number;
    unitsInProduction: number;
    unitsComplete: number;
    unitsNeedsProductionNow: number;
    unitsAtRisk: number;
    unitsPastPromise: number;
    ordersWaitingOnProduction: number;
    ordersReadyToPack: number;
  };
  urgentGroups: ProductionVariantGroup[];
  blockedOrders: ProductionBlockedOrder[];
  showSummaries: ProductionShowSummary[];
  variantGroups: ProductionVariantGroup[];
}

export interface OrderProductionLineProgress {
  orderItemId: string;
  productName: string;
  size: string | null;
  requiredUnits: number;
  completeUnits: number;
  inProductionUnits: number;
  queuedUnits: number;
  requirementMode: ProductionRequirementMode;
}

export interface OrderProductionStatus {
  lines: OrderProductionLineProgress[];
  isProductionComplete: boolean;
  readyToPack: boolean;
  orderProductionState: "waiting" | "in_progress" | "ready_to_pack" | "not_applicable";
}

export function opsProductionHref(filter?: string, eventId?: string): string {
  const params = new URLSearchParams();
  if (filter && filter !== "all") params.set("filter", filter);
  if (eventId) params.set("event", eventId);
  const qs = params.toString();
  return qs ? `/ops/production?${qs}` : "/ops/production";
}
