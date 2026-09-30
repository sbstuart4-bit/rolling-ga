"use server";

import { redirect } from "next/navigation";
import { demoModeEnabled } from "@/lib/demo-mode";
import { destroySession } from "@/server/auth/session";
import { clearFanShowContextSlug } from "@/server/fans/show-context";
import { clearDemoScenarioCookie } from "@/server/demo/scenario-state";
import { redirectAfterLeavingDemoSession } from "@/server/demo/demo-exit-redirect";
import { clearArtistGuidedDemoSession } from "@/server/demo/artist-guided-demo-state";
import { clearGuidedDemoSession } from "@/server/demo/guided-demo-state";

/** Clears any stale login so the demo board is always a fresh persona picker. */
export async function clearDemoSessionAction(): Promise<void> {
  await destroySession();
}

/** Signs out and leaves the demo — marketing visitors return home; board users hit `/demo`. */
export async function returnToDemoBoardAction(): Promise<void> {
  if (!demoModeEnabled()) redirect("/welcome");
  await clearGuidedDemoSession();
  await clearArtistGuidedDemoSession();
  await destroySession();
  await clearDemoScenarioCookie();
  await clearFanShowContextSlug();
  await redirectAfterLeavingDemoSession();
}
