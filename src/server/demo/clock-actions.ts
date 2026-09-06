"use server";

import { revalidatePath } from "next/cache";
import { resetDemoDatabase } from "@/db/reset-demo-data";
import { demoModeEnabled } from "@/lib/demo-mode";
import { destroySession } from "@/server/auth/session";
import {
  demoNovaNashvilleDoorsOpen,
  demoNovaNashvilleLive,
  demoNovaNashvillePostShow,
} from "@/lib/demo-calendar";
import {
  advanceDemoClock,
  clearDemoClockCookie,
  persistDemoClockOffset,
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
  void persistDemoClockOffset();
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
  if (!demoModeEnabled()) return;
  resetDemoClock();
  await clearDemoClockCookie();
  revalidatePath("/demo");
}

export async function setDemoClockAction(days: number, hours: number): Promise<void> {
  applyClockMutation(() => setDemoClockDaysAndHours(days, hours));
}

export async function jumpToNovaNashvilleDoorsOpenAction(): Promise<void> {
  const { days, hours } = demoNovaNashvilleDoorsOpen();
  applyClockMutation(() => setDemoClockDaysAndHours(days, hours));
}

export async function jumpToNovaNashvilleLiveAction(): Promise<void> {
  const { days, hours } = demoNovaNashvilleLive();
  applyClockMutation(() => setDemoClockDaysAndHours(days, hours));
}

export async function jumpToNovaNashvillePostShowAction(): Promise<void> {
  const { days, hours } = demoNovaNashvillePostShow();
  applyClockMutation(() => setDemoClockDaysAndHours(days, hours));
}

/** @deprecated Degens-specific preset — prefer Nashville presets for the flagship demo. */
export async function jumpToDetroitDoorsOpenAction(): Promise<void> {
  const { demoDetroitDoorsOpen } = await import("@/lib/demo-calendar");
  const { days, hours } = demoDetroitDoorsOpen();
  applyClockMutation(() => setDemoClockDaysAndHours(days, hours));
}

export async function jumpToDetroitLiveAction(): Promise<void> {
  const { demoDetroitLive } = await import("@/lib/demo-calendar");
  const { days, hours } = demoDetroitLive();
  applyClockMutation(() => setDemoClockDaysAndHours(days, hours));
}

export async function jumpToDetroitPostShowAction(): Promise<void> {
  const { demoDetroitPostShow } = await import("@/lib/demo-calendar");
  const { days, hours } = demoDetroitPostShow();
  applyClockMutation(() => setDemoClockDaysAndHours(days, hours));
}

/** Wipes the SQLite database, re-seeds from June 1, and resets the demo clock. */
export async function resetDemoDataAction(): Promise<void> {
  if (!demoModeEnabled()) return;

  await resetDemoDatabase();
  resetDemoClock();
  await clearDemoClockCookie();
  await destroySession();

  revalidatePath("/demo");
  revalidatePath("/", "layout");
}
