"use server";

import { redirect } from "next/navigation";
import { demoModeEnabled } from "@/lib/demo-mode";
import { destroySession } from "@/server/auth/session";
import { clearFanShowContextSlug } from "@/server/fans/show-context";
import { clearDemoScenarioCookie } from "@/server/demo/scenario-state";

/** Clears any stale login so the demo board is always a fresh persona picker. */
export async function clearDemoSessionAction(): Promise<void> {
  await destroySession();
}

/** Signs out and returns to the demo board — used from fan/studio/ops chrome. */
export async function returnToDemoBoardAction(): Promise<void> {
  if (!demoModeEnabled()) redirect("/welcome");
  await destroySession();
  await clearDemoScenarioCookie();
  await clearFanShowContextSlug();
  redirect("/demo");
}
