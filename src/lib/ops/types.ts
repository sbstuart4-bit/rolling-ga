import type { DeliveryPromiseState, FulfillmentStatus } from "@/lib/types";
import type { DeliveryPerformanceMetrics, FulfillmentPipelineCounts } from "@/lib/fulfillment";

/** Canonical show lifecycle for Ops command center. */
export type ShowOperationalState =
  | "upcoming"
  | "live"
  | "fulfilling"
  | "at_risk"
  | "complete";

export type ShowOperationalHealth = "on_track" | "watch" | "action_needed";

export type OpsShowFilter = "all" | "live" | "fulfilling" | "at_risk" | "complete";

export const SHOW_OPERATIONAL_STATE_LABELS: Record<ShowOperationalState, string> = {
  upcoming: "Upcoming",
  live: "Live",
  fulfilling: "Fulfilling",
  at_risk: "At risk",
  complete: "Complete",
};

export const SHOW_OPERATIONAL_HEALTH_LABELS: Record<ShowOperationalHealth, string> = {
  on_track: "On track",
  watch: "Watch",
  action_needed: "Action needed",
};

export interface OpsShowMetrics {
  eventId: string;
  artistId: string;
  artistName: string;
  tourName: string | null;
  venueCity: string;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  operationalState: ShowOperationalState;
  health: ShowOperationalHealth;
  timingLabel: string;
  orderCount: number;
  unitCount: number;
  ordersInMotion: number;
  pipeline: FulfillmentPipelineCounts;
  performance: DeliveryPerformanceMetrics;
  needsAttentionCount: number;
  nextPromiseDeadline: Date | null;
  productionUnitsWaiting: number;
  productionUnitsAtRisk: number;
  productionOrdersBlocked: number;
  packingReadyToPack: number;
  packingReadyForHandoff: number;
  packingMustLeaveNext: number;
}

export interface OpsAttentionItem {
  orderId: string;
  orderNumber: string;
  artistName: string;
  showLabel: string;
  eventId: string;
  reasonLabel: string;
  promiseState: DeliveryPromiseState;
  promisedDeliveryAt: Date | null;
  fulfillmentStatus: FulfillmentStatus | null;
  hasOpenException: boolean;
  exceptionId: string | null;
  exceptionType: string | null;
  openedAt: Date | null;
  priority: number;
}

export interface OpsCommandCenterSnapshot {
  generatedAt: Date;
  global: {
    activeShows: number;
    totalOrders: number;
    ordersInFulfillment: number;
    delivered: number;
    atRisk: number;
    pastPromise: number;
    openExceptions: number;
    needsAttention: number;
  };
  shows: OpsShowMetrics[];
  attention: OpsAttentionItem[];
}
