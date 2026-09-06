import "server-only";

import type { DemoScenario } from "@/lib/demo-scenario/types";
import { getDemoShow } from "@/lib/demo-scenario/shows";
import {
  canPurchaseShowExclusives,
  hasEarnedCredential,
  resolveCredentialState,
  resolveFanExperienceState,
  type FanExperienceState,
} from "@/lib/fan-experience/access-state";
import { isAttendeeStoreOpen } from "@/lib/post-show-commerce";
import type { EventState } from "@/lib/types";
import { demoNow } from "./clock";

/** Whether the scenario represents an earned post-show credential (not geofence alone). */
export function scenarioHoldsShowCredential(
  scenario: DemoScenario,
  realVerified = false,
): boolean {
  const show = getDemoShow(scenario.showKey);
  if (!show) return false;
  return resolveCredentialState(scenario, show.eventId, realVerified) === "earned";
}

export function resolveEventFanExperience(
  eventId: string,
  scenario: DemoScenario | null,
  realVerified: boolean,
  timingState: EventState,
): FanExperienceState {
  return resolveFanExperienceState({
    eventId,
    scenario,
    realVerified,
    timingState,
    storeOpen: isAttendeeStoreOpen(timingState),
    now: demoNow(),
  });
}

/** @deprecated Prefer page.fanExperience. */
export interface DemoEventCommerceAccess {
  hasShowCredential: boolean;
  venuePresenceActive: boolean;
  canPurchaseShowExclusives: boolean;
}

/** @deprecated Prefer resolveEventFanExperience. */
export function resolveDemoEventCommerceAccess(
  eventId: string,
  scenario: DemoScenario | null,
  realVerified: boolean,
  timingState: EventState = "live",
): DemoEventCommerceAccess {
  const fanExperience = resolveEventFanExperience(
    eventId,
    scenario,
    realVerified,
    timingState,
  );
  return {
    hasShowCredential: hasEarnedCredential(fanExperience),
    venuePresenceActive: fanExperience.experience?.venuePresenceActive ?? false,
    canPurchaseShowExclusives: canPurchaseShowExclusives(fanExperience.access),
  };
}
