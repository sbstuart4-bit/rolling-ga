import "server-only";

import { demoModeEnabled } from "@/lib/demo-mode";
import { getDemoShow } from "@/lib/demo-scenario/shows";
import { applyDemoClockForPhaseInMemory } from "@/server/demo/apply-demo-clock";
import { demoNow, hydrateDemoClockFromCookie, persistDemoClockOffset } from "@/server/demo/clock";

/**
 * Ops command center assumes post-show fulfillment context in demo mode.
 * If the clock is still before Brooklyn ends, advance to show_ended so
 * Marisol Brooklyn appears in a fulfilling state with real seeded data.
 */
export async function ensureOpsDemoClock(): Promise<void> {
  if (!demoModeEnabled()) return;

  await hydrateDemoClockFromCookie();
  const show = getDemoShow("marisol-brooklyn");
  if (!show) return;

  const now = demoNow();
  if (now.getTime() < show.endsAt.getTime()) {
    applyDemoClockForPhaseInMemory(show, "show_ended");
    await persistDemoClockOffset();
  }
}
