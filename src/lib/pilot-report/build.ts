import { formatMoney, formatPercent } from "@/lib/format";
import type { ActivationResultsMetrics } from "@/lib/activation/revenue";
import type { DeliveryPerformanceMetrics } from "@/lib/fulfillment";
import type { ShowEconomicsSnapshot } from "@/lib/show-economics/types";
import type { ShowCohortMetrics } from "@/server/studio/fan-relationship-queries";
import type {
  EvaluatedPilotGoal,
  PilotCompletenessItem,
  PilotLearningItem,
  PilotMetricKey,
  PilotReportConclusion,
} from "./types";

export interface PilotMetricInputs {
  economics: ShowEconomicsSnapshot;
  cohort: ShowCohortMetrics | null;
  fulfillment: DeliveryPerformanceMetrics | null;
  verifiedAttendees: number;
}

export function resolvePilotMetrics(input: PilotMetricInputs): Record<PilotMetricKey, number | null> {
  const { economics, cohort, fulfillment, verifiedAttendees } = input;
  const purchasingFans = cohort?.purchasingFans ?? economics.rollingGa.purchasingFans;

  return {
    rolling_ga_gmv_cents: economics.rollingGa.gmvCents,
    connected_fans: cohort?.connectedFans ?? economics.connectedFanRelationships,
    post_show_gmv_cents: economics.rollingGa.postShowGmvCents,
    activated_post_show_gmv_cents: economics.activatedPostShowGmvCents,
    delivery_promise_rate: fulfillment?.deliveryPromiseRate ?? null,
    digital_adoption_rate:
      verifiedAttendees > 0 ? purchasingFans / verifiedAttendees : null,
    repeat_purchasers: cohort?.repeatPurchasers ?? economics.repeatPurchasers,
  };
}

export function buildPilotLearnings(input: {
  economics: ShowEconomicsSnapshot;
  cohort: ShowCohortMetrics | null;
  fulfillment: DeliveryPerformanceMetrics | null;
  activation: ActivationResultsMetrics | null;
  goals: EvaluatedPilotGoal[];
  verifiedAttendees: number;
}): PilotLearningItem[] {
  const { economics, cohort, fulfillment, activation, goals, verifiedAttendees } = input;
  const purchasingFans = cohort?.purchasingFans ?? economics.rollingGa.purchasingFans;

  const digitalGoal = goals.find((g) => g.metricKey === "digital_adoption_rate");
  const connectedGoal = goals.find((g) => g.metricKey === "connected_fans");
  const postShowGoal = goals.find((g) => g.metricKey === "post_show_gmv_cents");
  const activationGoal = goals.find((g) => g.metricKey === "activated_post_show_gmv_cents");
  const deliveryGoal = goals.find((g) => g.metricKey === "delivery_promise_rate");

  const venueUnknown =
    economics.config.digitalVenueCommissionTreatment === "UNKNOWN" ||
    economics.physical.venueCommissionTreatment === "UNKNOWN";

  return [
    {
      id: "digital_merch",
      question: "Did fans use digital merch?",
      evidence:
        verifiedAttendees > 0
          ? `${purchasingFans} purchasing fans from ${verifiedAttendees} verified attendees (${formatPercent(
              purchasingFans / verifiedAttendees,
            )}).`
          : "No verified attendance denominator.",
      status:
        verifiedAttendees > 0
          ? goalToLearningStatus(digitalGoal)
          : "not_measured",
    },
    {
      id: "digital_catalog",
      question: "Did the digital catalog create sales?",
      evidence: `${formatMoney(economics.rollingGa.gmvCents)} Rolling GA GMV across ${economics.rollingGa.orderCount} orders.`,
      status: economics.rollingGa.orderCount > 0 ? "measured" : "not_measured",
    },
    {
      id: "post_show",
      question: "Did post-show commerce occur?",
      evidence: `${formatMoney(economics.rollingGa.postShowGmvCents)} post-show GMV observed.`,
      status: goalToLearningStatus(postShowGoal),
    },
    {
      id: "relationships",
      question: "Did the show create connected fan relationships?",
      evidence: `${economics.connectedFanRelationships} connected fans; ${economics.postShowPurchasers} post-show purchasers.`,
      status: goalToLearningStatus(connectedGoal),
    },
    {
      id: "activation",
      question: "Did activation generate repeat commerce?",
      evidence: activation
        ? `${formatMoney(activation.activatedRevenueCents)} activated revenue from ${activation.purchasingFans} purchasers (${activation.eligibleFans} eligible).`
        : "No activation drop measured for this show.",
      status: activation ? goalToLearningStatus(activationGoal) : "not_measured",
    },
    {
      id: "fulfillment",
      question: "Did fulfillment meet the delivery promise?",
      evidence: fulfillment
        ? `${fulfillment.deliveredWithinPromise} of ${fulfillment.deliveredCount} delivered orders within promise${
            fulfillment.deliveryPromiseRate != null
              ? ` (${formatPercent(fulfillment.deliveryPromiseRate)})`
              : ""
          }. ${fulfillment.openExceptions} open exception${fulfillment.openExceptions === 1 ? "" : "s"}.`
        : "No fulfillment data for qualifying orders.",
      status: fulfillment ? goalToLearningStatus(deliveryGoal) : "not_measured",
    },
    {
      id: "venue_treatment",
      question: "Was venue commission treatment confirmed?",
      evidence: `Physical: ${economics.physical.venueCommissionTreatment}. Digital: ${economics.config.digitalVenueCommissionTreatment}.`,
      status: venueUnknown ? "unknown" : "measured",
    },
  ];
}

function goalToLearningStatus(
  goal: EvaluatedPilotGoal | undefined,
): PilotLearningItem["status"] {
  if (!goal) return "not_measured";
  if (goal.status === "not_enough_data" || goal.status === "not_measured") return "not_measured";
  if (goal.status === "met_target" || goal.status === "exceeded_target") return "target_met";
  return "target_not_met";
}

export function buildPilotCompleteness(input: {
  economics: ShowEconomicsSnapshot;
  cohort: ShowCohortMetrics | null;
  fulfillmentOrderCount: number;
  activationMeasured: boolean;
}): PilotCompletenessItem[] {
  const { economics, cohort, fulfillmentOrderCount, activationMeasured } = input;
  const physicalComplete = economics.physical.physicalMerchGmvCents != null;

  return [
    {
      id: "physical_baseline",
      label: "Physical baseline",
      level: physicalComplete ? "complete" : "missing",
      detail: physicalComplete
        ? "Representative booth inputs recorded"
        : "Physical merch baseline not provided",
    },
    {
      id: "venue_treatment",
      label: "Venue commission treatment",
      level:
        economics.physical.venueCommissionTreatment === "UNKNOWN" ||
        economics.config.digitalVenueCommissionTreatment === "UNKNOWN"
          ? "unknown"
          : "complete",
      detail:
        economics.config.digitalVenueCommissionTreatment === "UNKNOWN"
          ? "Digital contract treatment not confirmed"
          : "Venue treatments recorded for both channels",
    },
    {
      id: "rolling_ga_orders",
      label: "Rolling GA orders",
      level: economics.rollingGa.orderCount > 0 ? "complete" : "missing",
      detail: `${economics.rollingGa.orderCount} paid orders in scope`,
    },
    {
      id: "relationship_metrics",
      label: "Relationship metrics",
      level: cohort ? "complete" : "partial",
      detail: cohort
        ? "Cohort funnel and post-show GMV calculated"
        : "Limited relationship data for this show",
    },
    {
      id: "activation",
      label: "Activation",
      level: activationMeasured ? "complete" : "missing",
      detail: activationMeasured
        ? "Activation drop results measured"
        : "No show-cohort activation drop for this event",
    },
    {
      id: "fulfillment",
      label: "Fulfillment",
      level: fulfillmentOrderCount > 0 ? "complete" : "partial",
      detail: fulfillmentOrderCount > 0
        ? `${fulfillmentOrderCount} orders in fulfillment pipeline`
        : "Fulfillment not yet tracked for this show",
    },
  ];
}

export function buildPilotConclusion(input: {
  economics: ShowEconomicsSnapshot;
  goals: EvaluatedPilotGoal[];
  completeness: PilotCompletenessItem[];
}): PilotReportConclusion {
  const { economics, goals, completeness } = input;
  const metGoals = goals.filter(
    (g) => g.status === "met_target" || g.status === "exceeded_target",
  ).length;
  const venueUnknown = completeness.find((c) => c.id === "venue_treatment")?.level === "unknown";

  const totalMerchGmv =
    economics.physical.physicalMerchGmvCents != null
      ? economics.physical.physicalMerchGmvCents + economics.rollingGa.gmvCents
      : null;

  return {
    whatHappened: totalMerchGmv != null
      ? `Brooklyn produced ${formatMoney(totalMerchGmv)} combined merch GMV (${formatMoney(
          economics.physical.physicalMerchGmvCents!,
        )} physical + ${formatMoney(economics.rollingGa.gmvCents)} Rolling GA) with ${economics.connectedFanRelationships} connected fan relationships.`
      : `Brooklyn produced ${formatMoney(economics.rollingGa.gmvCents)} Rolling GA GMV with ${economics.connectedFanRelationships} connected fan relationships. Physical baseline recorded separately.`,
    whatWeLearned: `${metGoals} of ${goals.length} pilot goals met or exceeded target. Post-show commerce and activation revenue are observable; fulfillment performance is measured from operational data.`,
    whatRemainsUnknown: venueUnknown
      ? "Venue commission treatment for physical and digital channels is not confirmed — estimated artist proceeds cannot be finalized."
      : "Some pilot inputs remain incomplete; see data completeness below.",
    recommendedNextTest: venueUnknown
      ? "Confirm venue commission treatment and repeat the pilot across a second show to compare fan and commerce behavior."
      : "Run a second show with the same goal framework to compare adoption, post-show commerce, and fulfillment performance.",
  };
}
