import type { AudienceRuleParams } from "@/lib/types";
import type { CohortFunnelStage } from "@/lib/relationship-intelligence/types";
import { cohortStageLabel } from "@/lib/relationship-intelligence/types";

export const SHOW_COHORT_RULE_KIND = "show_cohort" as const;

/** Cohort stages that can be activated via audience-targeted drops. */
export const ACTIVATABLE_COHORT_STAGES: CohortFunnelStage[] = [
  "connected",
  "purchasing",
  "post_show",
  "repeat",
];

export function isActivatableCohortStage(stage: string): stage is CohortFunnelStage {
  return ACTIVATABLE_COHORT_STAGES.includes(stage as CohortFunnelStage);
}

export function isShowCohortParams(
  params: AudienceRuleParams | null | undefined,
): params is AudienceRuleParams & { originEventId: string; cohortStage: CohortFunnelStage } {
  return Boolean(params?.originEventId && params?.cohortStage);
}

export function snapshotUserIdsFromParams(params: AudienceRuleParams | null | undefined): string[] {
  if (!params?.snapshotUserIds?.length) return [];
  return params.snapshotUserIds;
}

export function isFanInAudienceSnapshot(
  userId: string,
  params: AudienceRuleParams | null | undefined,
): boolean {
  const ids = snapshotUserIdsFromParams(params);
  if (ids.length === 0) return false;
  return ids.includes(userId);
}

export function formatShowCohortAudienceLabel(
  params: AudienceRuleParams,
  venueCity?: string | null,
): string {
  const city = venueCity ?? "Show";
  const stage = params.cohortStage;
  if (!stage) return `${city} cohort`;
  return `${city} · ${cohortStageLabel(stage as CohortFunnelStage)}`;
}

export function buildShowCohortSegmentName(
  venueCity: string,
  cohortStage: CohortFunnelStage,
): string {
  return `${venueCity} ${cohortStageLabel(cohortStage)}`;
}
