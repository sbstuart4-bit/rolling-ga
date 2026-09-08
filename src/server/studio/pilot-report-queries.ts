import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { eventPilotGoals } from "@/db/schema";
import type { ActivationResultsMetrics } from "@/lib/activation/revenue";
import type { DeliveryPerformanceMetrics } from "@/lib/fulfillment";
import { formatEventDate } from "@/lib/format";
import {
  buildPilotCompleteness,
  buildPilotConclusion,
  buildPilotLearnings,
  resolvePilotMetrics,
} from "@/lib/pilot-report/build";
import { evaluatePilotGoals } from "@/lib/pilot-report/goals";
import type {
  EvaluatedPilotGoal,
  PilotCompletenessItem,
  PilotGoalCategory,
  PilotGoalDefinition,
  PilotGoalDirection,
  PilotGoalUnit,
  PilotLearningItem,
  PilotMetricKey,
  PilotReportConclusion,
} from "@/lib/pilot-report/types";
import type { ShowEconomicsSnapshot } from "@/lib/show-economics/types";
import { venueCommissionLabel } from "@/lib/show-economics/calculations";
import { assertArtistAccess } from "@/server/auth/guards";
import type { AuthContext } from "@/server/auth/session";
import { demoNow } from "@/server/demo/clock";
import { loadActivationResults, listActivationsForEvent } from "@/server/activation/queries";
import { getEventById } from "@/server/events/queries";
import { loadShowCohortMetrics } from "@/server/studio/fan-relationship-queries";
import { loadShowFulfillmentSnapshot } from "@/server/studio/fulfillment-queries";
import { loadShowEconomicsSnapshot } from "@/server/studio/show-economics-queries";
import type { ShowCohortMetrics } from "@/server/studio/fan-relationship-queries";
import { BROOKLYN_ENCORE_ACTIVATION_DROP_ID } from "@/lib/demo-user-ids";

export interface PilotReportActivationStory {
  dropId: string;
  title: string;
  eligibleFans: number;
  purchasingFans: number;
  orderCount: number;
  conversionRate: number | null;
  activatedRevenueCents: number;
  averageOrderValueCents: number | null;
  repeatPurchasers: number;
}

export interface PilotReportSnapshot {
  eventId: string;
  artistName: string;
  tourName: string | null;
  venueCity: string;
  eventDateLabel: string;
  timezone: string;
  generatedAt: Date;
  isDemoData: boolean;
  dataCompletenessStatus: "complete" | "partial" | "incomplete";
  economics: ShowEconomicsSnapshot;
  cohort: ShowCohortMetrics | null;
  fulfillment: DeliveryPerformanceMetrics | null;
  fulfillmentOrderCount: number;
  verifiedAttendees: number;
  activation: PilotReportActivationStory | null;
  goals: EvaluatedPilotGoal[];
  learnings: PilotLearningItem[];
  completeness: PilotCompletenessItem[];
  conclusion: PilotReportConclusion;
  totalMerchGmvCents: number | null;
}

function fromStoredTarget(value: number, unit: PilotGoalUnit): number {
  if (unit === "ratio") return value / 10_000;
  return value;
}

function rowToGoal(row: typeof eventPilotGoals.$inferSelect): PilotGoalDefinition {
  const unit = row.unit as PilotGoalUnit;
  return {
    id: row.id,
    eventId: row.eventId,
    metricKey: row.metricKey as PilotMetricKey,
    label: row.label,
    category: row.category as PilotGoalCategory,
    direction: row.direction as PilotGoalDirection,
    targetValue: fromStoredTarget(row.targetValue, unit),
    unit,
    note: row.note,
  };
}

export async function loadPilotGoalsForEvent(eventId: string): Promise<PilotGoalDefinition[]> {
  const rows = await db
    .select()
    .from(eventPilotGoals)
    .where(eq(eventPilotGoals.eventId, eventId));
  return rows.map(rowToGoal);
}

function deriveDataCompletenessStatus(
  items: PilotCompletenessItem[],
): PilotReportSnapshot["dataCompletenessStatus"] {
  const levels = items.map((i) => i.level);
  if (levels.every((l) => l === "complete")) return "complete";
  if (levels.some((l) => l === "missing")) return "incomplete";
  return "partial";
}

export async function loadPilotReportSnapshot(
  ctx: AuthContext,
  artistId: string,
  eventId: string,
): Promise<PilotReportSnapshot | null> {
  assertArtistAccess(ctx, artistId);

  const event = await getEventById(eventId);
  if (!event || event.artistId !== artistId) return null;

  const [economics, cohort, fulfillmentSnapshot, goals, activations] = await Promise.all([
    loadShowEconomicsSnapshot(ctx, artistId, eventId),
    loadShowCohortMetrics(ctx, artistId, eventId),
    loadShowFulfillmentSnapshot(ctx, artistId, eventId),
    loadPilotGoalsForEvent(eventId),
    listActivationsForEvent(artistId, eventId),
  ]);

  if (!economics) return null;

  const verifiedAttendees = cohort?.originalVerifiedAttendees ?? 0;
  const fulfillment = fulfillmentSnapshot?.performance ?? null;
  const fulfillmentOrderCount = fulfillmentSnapshot?.pipeline.total ?? 0;

  let activationResults: ActivationResultsMetrics | null = null;
  const primaryActivation =
    activations.find((a) => a.dropId === BROOKLYN_ENCORE_ACTIVATION_DROP_ID) ??
    activations[0];

  if (primaryActivation) {
    activationResults = await loadActivationResults(artistId, primaryActivation.dropId);
  }

  const metrics = resolvePilotMetrics({
    economics,
    cohort,
    fulfillment,
    verifiedAttendees,
  });

  const evaluatedGoals = evaluatePilotGoals(goals, metrics);

  const activationStory: PilotReportActivationStory | null =
    primaryActivation && activationResults
      ? {
          dropId: primaryActivation.dropId,
          title: primaryActivation.title,
          eligibleFans: activationResults.eligibleFans,
          purchasingFans: activationResults.purchasingFans,
          orderCount: activationResults.orderCount,
          conversionRate: activationResults.conversionRate,
          activatedRevenueCents: activationResults.activatedRevenueCents,
          averageOrderValueCents: activationResults.averageOrderValueCents,
          repeatPurchasers: activationResults.repeatPurchasers,
        }
      : null;

  const completeness = buildPilotCompleteness({
    economics,
    cohort,
    fulfillmentOrderCount,
    activationMeasured: activationStory != null,
  });

  const learnings = buildPilotLearnings({
    economics,
    cohort,
    fulfillment,
    activation: activationResults,
    goals: evaluatedGoals,
    verifiedAttendees,
  });

  const conclusion = buildPilotConclusion({
    economics,
    goals: evaluatedGoals,
    completeness,
  });

  const totalMerchGmvCents =
    economics.physical.physicalMerchGmvCents != null
      ? economics.physical.physicalMerchGmvCents + economics.rollingGa.gmvCents
      : null;

  return {
    eventId,
    artistName: event.artistName,
    tourName: event.tourName,
    venueCity: event.venueCity,
    eventDateLabel: formatEventDate(event.startsAt, event.timezone),
    timezone: event.timezone,
    generatedAt: demoNow(),
    isDemoData: economics.isDemoData,
    dataCompletenessStatus: deriveDataCompletenessStatus(completeness),
    economics,
    cohort,
    fulfillment,
    fulfillmentOrderCount,
    verifiedAttendees,
    activation: activationStory,
    goals: evaluatedGoals,
    learnings,
    completeness,
    conclusion,
    totalMerchGmvCents,
  };
}
