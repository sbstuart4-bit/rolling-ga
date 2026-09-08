import { MARISOL_BROOKLYN_EVENT_ID } from "@/lib/demo-user-ids";
import type { CohortFunnelStage } from "./types";

/** Canonical guided-demo show — Brooklyn A Tender Night. */
export const MARISOL_BROOKLYN_COHORT_EVENT_ID = MARISOL_BROOKLYN_EVENT_ID;

/**
 * Reusable cohort stage identifiers for Drops / activation (Phase 4).
 * Each stage maps to a filtered show cohort query — not a separate CRM segment.
 */
export const BROOKLYN_COHORT_STAGES = {
  connected: "connected" as CohortFunnelStage,
  purchasing: "purchasing" as CohortFunnelStage,
  postShow: "post_show" as CohortFunnelStage,
  repeat: "repeat" as CohortFunnelStage,
} as const;

export function cohortMembersHref(eventId: string, stage: CohortFunnelStage): string {
  return `/studio/fans/cohort/${eventId}?stage=${stage}`;
}

export function cohortHref(eventId: string): string {
  return `/studio/fans/cohort/${eventId}`;
}

/** Prefilled flash-drop creation for a show cohort activation. */
export function createActivationHref(eventId: string, stage: CohortFunnelStage): string {
  return `/studio/drops/new?event=${eventId}&cohort=${stage}`;
}
