"use server";

import { revalidatePath } from "next/cache";
import { resetDemoDatabase } from "@/db/reset-demo-data";
import { demoModeEnabled } from "@/lib/demo-mode";
import { destroySession } from "@/server/auth/session";
import {
  demoDetroitDoorsOpen,
  demoDetroitLive,
  demoDetroitPostShow,
} from "@/lib/demo-calendar";
import {
  advanceDemoClock,
  resetDemoClock,
  setDemoClockDaysAndHours,
  DAY_MS,
  HOUR_MS,
} from "./clock";

/**
 * Every clock mutation runs through here. Business time is only ever simulated in demo
 * mode, so outside it these actions do nothing rather than shifting the server's idea
 * of now for every other request.
 */
function applyClockMutation(mutate: () => void): void {
  if (!demoModeEnabled()) return;
  mutate();
  revalidatePath("/demo");
}

export async function advanceDemoClockByHourAction(): Promise<void> {
  applyClockMutation(() => advanceDemoClock(HOUR_MS));
}

export async function advanceDemoClockByDayAction(): Promise<void> {
  applyClockMutation(() => advanceDemoClock(DAY_MS));
}

export async function rewindDemoClockByHourAction(): Promise<void> {
  applyClockMutation(() => advanceDemoClock(-HOUR_MS));
}

export async function rewindDemoClockByDayAction(): Promise<void> {
  applyClockMutation(() => advanceDemoClock(-DAY_MS));
}

export async function resetDemoClockAction(): Promise<void> {
  applyClockMutation(() => resetDemoClock());
}

export async function setDemoClockAction(days: number, hours: number): Promise<void> {
  applyClockMutation(() => setDemoClockDaysAndHours(days, hours));
}

export async function jumpToDetroitDoorsOpenAction(): Promise<void> {
  const { days, hours } = demoDetroitDoorsOpen();
  applyClockMutation(() => setDemoClockDaysAndHours(days, hours));
}

export async function jumpToDetroitLiveAction(): Promise<void> {
  const { days, hours } = demoDetroitLive();
  applyClockMutation(() => setDemoClockDaysAndHours(days, hours));
}

export async function jumpToDetroitPostShowAction(): Promise<void> {
  const { days, hours } = demoDetroitPostShow();
  applyClockMutation(() => setDemoClockDaysAndHours(days, hours));
}

/** Wipes the SQLite database, re-seeds from June 1, and resets the demo clock. */
export async function resetDemoDataAction(): Promise<void> {
  if (!demoModeEnabled()) return;

  await resetDemoDatabase();
  resetDemoClock();
  await destroySession();

  revalidatePath("/demo");
  revalidatePath("/", "layout");
}
