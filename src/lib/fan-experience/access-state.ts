import type { MerchExperienceState } from "@/lib/merch-experience/types";
import type { DemoScenario } from "@/lib/demo-scenario/types";
import { getDemoShow } from "@/lib/demo-scenario/shows";
import { resolveMerchExperience } from "@/lib/merch-experience/resolver";
import type { DemoTimePhase } from "@/lib/demo-scenario/types";
import type { EventState } from "@/lib/types";

export type ExperienceAccessState =
  | "discover_only"
  | "preview_locked"
  | "live_unlocked"
  | "postshow_open"
  | "history_only";

export type CredentialState = "none" | "earned";
export type PurchaseState = "none" | "completed";

export interface FanExperienceState {
  access: ExperienceAccessState;
  credential: CredentialState;
  purchase: PurchaseState;
  experience: MerchExperienceState | null;
}

export function experienceAccessLabel(access: ExperienceAccessState): string {
  switch (access) {
    case "discover_only":
      return "DISCOVER ONLY";
    case "preview_locked":
      return "PREVIEW LOCKED";
    case "live_unlocked":
      return "LIVE UNLOCKED";
    case "postshow_open":
      return "POSTSHOW OPEN";
    case "history_only":
      return "HISTORY ONLY";
  }
}

/** Post-show attendance credential — not geofence, not returning_fan alone. */
export function resolveCredentialState(
  scenario: DemoScenario | null,
  eventId: string,
  realVerified: boolean,
): CredentialState {
  if (scenario) {
    const show = getDemoShow(scenario.showKey);
    if (show && show.eventId === eventId) {
      if (scenario.fanState === "attended") return "earned";
      if (scenario.fanState === "returning_fan") {
        return realVerified ? "earned" : "none";
      }
      return "none";
    }
  }
  return realVerified ? "earned" : "none";
}

export function resolvePurchaseState(
  scenario: DemoScenario | null,
  eventId: string,
): PurchaseState {
  if (!scenario) return "none";
  const show = getDemoShow(scenario.showKey);
  if (!show || show.eventId !== eventId) return "none";
  return scenario.purchaseHistory === "none" ? "none" : "completed";
}

export function resolveExperienceAccessState(input: {
  experience: MerchExperienceState;
  timingState: EventState;
  credential: CredentialState;
  storeOpen: boolean;
}): ExperienceAccessState {
  const { experience, timingState, credential, storeOpen } = input;

  if (credential === "earned") {
    if (timingState === "archived") return "history_only";
    if (experience.showExclusiveTreatment === "history_only") return "history_only";
    if (
      experience.phase === "post_archived" ||
      experience.phase === "post_day_2" ||
      (experience.phase === "post_day_1" && !experience.showExclusivePurchasable)
    ) {
      return "history_only";
    }
    if (
      storeOpen &&
      experience.showExclusivePurchasable &&
      (timingState === "recently_ended" ||
        timingState === "live" ||
        experience.phase === "show_ended_attended" ||
        experience.phase === "post_day_1" ||
        experience.showExclusiveTreatment === "last_chance")
    ) {
      return "postshow_open";
    }
    if (!storeOpen || !experience.showExclusivePurchasable) {
      return "history_only";
    }
  }

  if (experience.venuePresenceActive && experience.showExclusivePurchasable) {
    return "live_unlocked";
  }

  if (experience.phase === "pre_early") {
    return "discover_only";
  }

  return "preview_locked";
}

export function canPreviewShop(access: ExperienceAccessState): boolean {
  return access !== "discover_only";
}

export function canPurchaseShowExclusives(access: ExperienceAccessState): boolean {
  return access === "live_unlocked" || access === "postshow_open";
}

export function hasEarnedCredential(access: FanExperienceState): boolean {
  return access.credential === "earned";
}

export function resolveMerchExperienceForScenario(
  scenario: DemoScenario,
  now: Date,
): MerchExperienceState | null {
  const show = getDemoShow(scenario.showKey);
  if (!show) return null;
  return resolveMerchExperience({
    now,
    show,
    timePhase: scenario.timePhase,
    fanState: scenario.fanState,
    location: scenario.location,
    fanHistory: scenario.fanHistory,
    purchaseHistory: scenario.purchaseHistory,
    merchRule: scenario.merchRule,
  });
}

export function timingStateForDemoPhase(timePhase: DemoTimePhase): EventState {
  if (timePhase === "show_ended" || timePhase === "t_plus_1") return "recently_ended";
  if (timePhase.startsWith("t_plus")) return "archived";
  if (
    timePhase === "doors_open" ||
    timePhase === "pre_show" ||
    timePhase === "between_acts" ||
    timePhase === "headliner" ||
    timePhase === "encore"
  ) {
    return "live";
  }
  return "upcoming";
}

export function resolveFanExperienceState(input: {
  eventId: string;
  scenario: DemoScenario | null;
  realVerified: boolean;
  timingState: EventState;
  storeOpen: boolean;
  now: Date;
}): FanExperienceState {
  const credential = resolveCredentialState(input.scenario, input.eventId, input.realVerified);
  const purchase = resolvePurchaseState(input.scenario, input.eventId);

  const experience =
    input.scenario && getDemoShow(input.scenario.showKey)?.eventId === input.eventId
      ? resolveMerchExperienceForScenario(input.scenario, input.now)
      : null;

  if (!experience) {
    const access: ExperienceAccessState =
      credential === "earned"
        ? input.timingState === "archived" || !input.storeOpen
          ? "history_only"
          : "postshow_open"
        : "preview_locked";
    return { access, credential, purchase, experience: null };
  }

  const access = resolveExperienceAccessState({
    experience,
    timingState: input.timingState,
    credential,
    storeOpen: input.storeOpen,
  });

  return { access, credential, purchase, experience };
}
