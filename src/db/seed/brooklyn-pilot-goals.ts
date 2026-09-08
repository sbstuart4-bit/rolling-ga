import type { Db } from "../client";
import { eventPilotGoals } from "../schema";
import { MARISOL_BROOKLYN_PILOT_GOALS_WITH_EVENT } from "@/lib/pilot-report/marisol-brooklyn-goals";
import type { PilotGoalUnit } from "@/lib/pilot-report/types";

function toStoredTarget(value: number, unit: PilotGoalUnit): number {
  if (unit === "ratio") return Math.round(value * 10_000);
  return Math.round(value);
}

/** Idempotent Brooklyn pilot goals — re-applies the same targets on every seed run. */
export async function seedBrooklynPilotGoals(db: Db): Promise<number> {
  let count = 0;
  for (const goal of MARISOL_BROOKLYN_PILOT_GOALS_WITH_EVENT) {
    await db
      .insert(eventPilotGoals)
      .values({
        id: goal.id,
        eventId: goal.eventId,
        metricKey: goal.metricKey,
        label: goal.label,
        category: goal.category,
        direction: goal.direction,
        targetValue: toStoredTarget(goal.targetValue, goal.unit),
        unit: goal.unit,
        note: goal.note,
        isDemo: true,
      })
      .onConflictDoUpdate({
        target: eventPilotGoals.id,
        set: {
          metricKey: goal.metricKey,
          label: goal.label,
          category: goal.category,
          direction: goal.direction,
          targetValue: toStoredTarget(goal.targetValue, goal.unit),
          unit: goal.unit,
          note: goal.note,
          isDemo: true,
          updatedAt: new Date(),
        },
      });
    count++;
  }
  return count;
}
