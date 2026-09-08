/** Comparison operator for pilot goals — evaluated against actual metrics at report time. */
export type PilotGoalDirection = "higher" | "lower";

export type PilotGoalUnit = "cents" | "count" | "ratio";

export type PilotGoalCategory =
  | "digital_merch_adoption"
  | "connected_fans"
  | "post_show_commerce"
  | "activated_revenue"
  | "delivery_promise";

export type PilotGoalStatus =
  | "exceeded_target"
  | "met_target"
  | "below_target"
  | "not_measured"
  | "not_enough_data";

export const PILOT_GOAL_STATUS_LABELS: Record<PilotGoalStatus, string> = {
  exceeded_target: "Exceeded target",
  met_target: "Met target",
  below_target: "Below target",
  not_measured: "Not measured",
  not_enough_data: "Not enough data",
};

/** Keys resolved from aggregated Phase 2–5 snapshots — not duplicated math. */
export type PilotMetricKey =
  | "rolling_ga_gmv_cents"
  | "connected_fans"
  | "post_show_gmv_cents"
  | "activated_post_show_gmv_cents"
  | "delivery_promise_rate"
  | "digital_adoption_rate"
  | "repeat_purchasers";

export interface PilotGoalDefinition {
  id: string;
  eventId: string;
  metricKey: PilotMetricKey;
  label: string;
  category: PilotGoalCategory;
  direction: PilotGoalDirection;
  /** Cents, count, or ratio (0–1). */
  targetValue: number;
  unit: PilotGoalUnit;
  note: string | null;
}

export interface EvaluatedPilotGoal extends PilotGoalDefinition {
  actualValue: number | null;
  status: PilotGoalStatus;
  formattedTarget: string;
  formattedActual: string | null;
}

export type LearningEvidenceStatus =
  | "measured"
  | "not_measured"
  | "target_met"
  | "target_not_met"
  | "unknown";

export interface PilotLearningItem {
  id: string;
  question: string;
  evidence: string;
  status: LearningEvidenceStatus;
}

export type CompletenessLevel = "complete" | "partial" | "unknown" | "missing";

export interface PilotCompletenessItem {
  id: string;
  label: string;
  level: CompletenessLevel;
  detail: string;
}

export interface PilotReportConclusion {
  whatHappened: string;
  whatWeLearned: string;
  whatRemainsUnknown: string;
  recommendedNextTest: string;
}
