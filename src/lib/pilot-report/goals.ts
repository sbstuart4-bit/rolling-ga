import { formatMoney, formatPercent } from "@/lib/format";
import type {
  EvaluatedPilotGoal,
  PilotGoalDefinition,
  PilotGoalDirection,
  PilotGoalStatus,
  PilotGoalUnit,
  PilotMetricKey,
} from "./types";

export function pilotReportHref(eventId: string): string {
  return `/studio/insights/pilot/${eventId}`;
}

export function formatPilotMetricValue(value: number, unit: PilotGoalUnit): string {
  switch (unit) {
    case "cents":
      return formatMoney(value);
    case "count":
      return value.toLocaleString("en-US");
    case "ratio":
      return formatPercent(value);
    default:
      return String(value);
  }
}

export function evaluatePilotGoalStatus(
  direction: PilotGoalDirection,
  targetValue: number,
  actualValue: number | null | undefined,
): PilotGoalStatus {
  if (actualValue == null || !Number.isFinite(actualValue)) {
    return "not_enough_data";
  }

  if (direction === "higher") {
    if (actualValue > targetValue) return "exceeded_target";
    if (actualValue === targetValue) return "met_target";
    return "below_target";
  }

  if (actualValue < targetValue) return "exceeded_target";
  if (actualValue === targetValue) return "met_target";
  return "below_target";
}

export function evaluatePilotGoal(
  goal: PilotGoalDefinition,
  metrics: Partial<Record<PilotMetricKey, number | null>>,
): EvaluatedPilotGoal {
  const actualValue = metrics[goal.metricKey] ?? null;
  const status = evaluatePilotGoalStatus(goal.direction, goal.targetValue, actualValue);

  return {
    ...goal,
    actualValue,
    status,
    formattedTarget: formatPilotMetricValue(goal.targetValue, goal.unit),
    formattedActual:
      actualValue != null && Number.isFinite(actualValue)
        ? formatPilotMetricValue(actualValue, goal.unit)
        : null,
  };
}

export function evaluatePilotGoals(
  goals: PilotGoalDefinition[],
  metrics: Partial<Record<PilotMetricKey, number | null>>,
): EvaluatedPilotGoal[] {
  return goals.map((goal) => evaluatePilotGoal(goal, metrics));
}
