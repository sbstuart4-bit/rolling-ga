import "server-only";

import type { DemoScenario } from "@/lib/demo-scenario/types";
import { getDemoShow } from "@/lib/demo-scenario/shows";
import { resolveCredentialState } from "@/lib/fan-experience/access-state";

/**
 * When a demo scenario targets this event, it drives credential UI — not leftover DB state
 * from a previous guided-demo run (except returning_fan steps that rely on persisted attendance).
 */
export function resolveDemoAwareVerifiedAttendee(
  eventId: string,
  scenario: DemoScenario | null,
  realVerified: boolean,
): boolean {
  return resolveCredentialState(scenario, eventId, realVerified) === "earned";
}

export function guidedStepShouldPersistVerification(scenario: DemoScenario): boolean {
  return scenario.fanState === "attended";
}

export { scenarioHoldsShowCredential } from "@/server/demo/scenario-access";
