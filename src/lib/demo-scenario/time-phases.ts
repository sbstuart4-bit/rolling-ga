import { demoClockDaysAndHoursForDate } from "@/lib/demo-calendar";
import type { DemoShowDefinition } from "./shows";
import type { DemoTimePhase } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/** Resolves a time-phase preset to an absolute timestamp relative to the show schedule. */
export function resolveTimePhaseDate(show: DemoShowDefinition, phase: DemoTimePhase): Date {
  const { doorsAt, startsAt, endsAt } = show;

  switch (phase) {
    case "t_minus_30":
      return new Date(startsAt.getTime() - 30 * DAY_MS);
    case "t_minus_14":
      return new Date(startsAt.getTime() - 14 * DAY_MS);
    case "t_minus_7":
      return new Date(startsAt.getTime() - 7 * DAY_MS);
    case "t_minus_1":
      return new Date(startsAt.getTime() - DAY_MS);
    case "show_day_morning":
      return new Date(
        startsAt.getFullYear(),
        startsAt.getMonth(),
        startsAt.getDate(),
        9,
        0,
        0,
        0,
      );
    case "t_minus_3_hours":
      return new Date(startsAt.getTime() - 3 * HOUR_MS);
    case "doors_open":
      return doorsAt;
    case "pre_show":
      return new Date(doorsAt.getTime() + 45 * 60_000);
    case "between_acts":
      return new Date(startsAt.getTime() + 55 * 60_000);
    case "headliner":
      return new Date(startsAt.getTime() + 75 * 60_000);
    case "encore":
      return new Date(endsAt.getTime() - 20 * 60_000);
    case "show_ended":
      return new Date(endsAt.getTime() + 30 * 60_000);
    case "t_plus_1":
      return new Date(endsAt.getTime() + DAY_MS);
    case "t_plus_2":
      return new Date(endsAt.getTime() + 2 * DAY_MS);
    case "t_plus_7":
      return new Date(endsAt.getTime() + 7 * DAY_MS);
    case "t_plus_30":
      return new Date(endsAt.getTime() + 30 * DAY_MS);
    default:
      return startsAt;
  }
}

export function demoClockForTimePhase(
  show: DemoShowDefinition,
  phase: DemoTimePhase,
): { days: number; hours: number } {
  return demoClockDaysAndHoursForDate(resolveTimePhaseDate(show, phase));
}

export const DEMO_TIME_PHASE_LABELS: Record<DemoTimePhase, string> = {
  t_minus_30: "T-30 Days",
  t_minus_14: "T-14 Days",
  t_minus_7: "T-7 Days",
  t_minus_1: "T-1 Day",
  show_day_morning: "Show Day — Morning",
  t_minus_3_hours: "T-3 Hours",
  doors_open: "Doors Open",
  pre_show: "Pre-Show",
  between_acts: "Between Acts",
  headliner: "Headliner",
  encore: "Encore",
  show_ended: "Show Ended",
  t_plus_1: "T+1 Day",
  t_plus_2: "T+2 Days",
  t_plus_7: "T+7 Days",
  t_plus_30: "T+30 Days",
};
