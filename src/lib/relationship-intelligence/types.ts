import type { CommerceAttributionPhase } from "@/lib/fan-attribution";

/** Explorable funnel stages for a show cohort — stable query param values. */
export const COHORT_FUNNEL_STAGES = [
  "attendees",
  "connected",
  "purchasing",
  "post_show",
  "repeat",
] as const;

export type CohortFunnelStage = (typeof COHORT_FUNNEL_STAGES)[number];

export interface RelationshipOrigin {
  eventId: string;
  artistName: string;
  tourName: string | null;
  venueCity: string;
  startsAt: Date;
  timezone: string;
}

export interface FanCohortMembership {
  userId: string;
  isAttendee: boolean;
  isConnected: boolean;
  isPurchasing: boolean;
  isPostShowPurchaser: boolean;
  isRepeatPurchaser: boolean;
  showNightGmvCents: number;
  postShowGmvCents: number;
  totalObservedGmvCents: number;
  attributedOrderCount: number;
  lastActivityAt: Date | null;
}

export interface CohortFunnelCounts {
  attendees: number;
  connectedFans: number;
  purchasingFans: number;
  postShowPurchasers: number;
  repeatPurchasers: number;
}

export interface PostShowWindowMetrics {
  /** Display label, e.g. "T+7 days" */
  label: string;
  daysAfterShow: number;
  activeFans: number;
  postShowPurchasers: number;
  postShowOrders: number;
  postShowGmvCents: number;
  repeatPurchasers: number;
}

export interface CohortTimelinePhase {
  key: "show_night" | "t_plus_1" | "t_plus_7" | "t_plus_30";
  label: string;
  description: string;
  connectedFans: number;
  purchasers: number;
  gmvCents: number;
  repeatPurchasers: number;
}

export interface CohortFanRow {
  userId: string;
  displayName: string;
  email: string;
  relationshipStart: RelationshipOrigin | null;
  showNightGmvCents: number;
  postShowGmvCents: number;
  totalObservedGmvCents: number;
  lastActivityAt: Date | null;
  membership: FanCohortMembership;
}

export interface ShowRelationshipSummary {
  eventId: string;
  venueCity: string;
  startsAt: Date;
  timezone: string;
  funnel: CohortFunnelCounts;
  postShowGmvCents: number;
}

export function parseCohortStage(raw: string | undefined): CohortFunnelStage | null {
  if (!raw) return null;
  return COHORT_FUNNEL_STAGES.includes(raw as CohortFunnelStage)
    ? (raw as CohortFunnelStage)
    : null;
}

export function cohortStageLabel(stage: CohortFunnelStage): string {
  switch (stage) {
    case "attendees":
      return "Attendees";
    case "connected":
      return "Connected fans";
    case "purchasing":
      return "Purchasing fans";
    case "post_show":
      return "Post-show purchasers";
    case "repeat":
      return "Repeat purchasers";
  }
}

export function fanMatchesStage(membership: FanCohortMembership, stage: CohortFunnelStage): boolean {
  switch (stage) {
    case "attendees":
      return membership.isAttendee;
    case "connected":
      return membership.isConnected;
    case "purchasing":
      return membership.isPurchasing;
    case "post_show":
      return membership.isPostShowPurchaser;
    case "repeat":
      return membership.isRepeatPurchaser;
  }
}
