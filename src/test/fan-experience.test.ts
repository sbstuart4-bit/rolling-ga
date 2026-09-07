import { describe, expect, it } from "vitest";
import { DEFAULT_DEMO_SCENARIO } from "@/lib/demo-scenario/types";
import { getDemoShow } from "@/lib/demo-scenario/shows";
import {
  canPreviewShop,
  canPurchaseShowExclusives,
  experienceAccessLabel,
  resolveCredentialState,
  resolveExperienceAccessState,
  resolveFanExperienceState,
  resolvePurchaseState,
  timingStateForDemoPhase,
} from "@/lib/fan-experience/access-state";
import { resolveMerchExperience } from "@/lib/merch-experience/resolver";

const brooklyn = getDemoShow("marisol-brooklyn")!;

function experienceFor(scenario: typeof DEFAULT_DEMO_SCENARIO) {
  return resolveMerchExperience({
    now: brooklyn.startsAt,
    show: brooklyn,
    timePhase: scenario.timePhase,
    fanState: scenario.fanState,
    location: scenario.location,
    fanHistory: scenario.fanHistory,
    purchaseHistory: scenario.purchaseHistory,
    merchRule: scenario.merchRule,
  });
}

describe("resolveCredentialState", () => {
  it("does not treat returning_fan alone as earned credential", () => {
    const scenario = {
      ...DEFAULT_DEMO_SCENARIO,
      fanState: "returning_fan",
      timePhase: "t_plus_7",
    } as const;
    expect(resolveCredentialState(scenario, brooklyn.eventId, false)).toBe("none");
    expect(resolveCredentialState(scenario, brooklyn.eventId, true)).toBe("earned");
  });

  it("treats attended post-show as earned", () => {
    const scenario = {
      ...DEFAULT_DEMO_SCENARIO,
      fanState: "attended",
      timePhase: "show_ended",
    } as const;
    expect(resolveCredentialState(scenario, brooklyn.eventId, false)).toBe("earned");
  });

  it("ignores stale DB credential when scenario rewinds before attendance", () => {
    const scenario = {
      ...DEFAULT_DEMO_SCENARIO,
      fanState: "at_venue",
      timePhase: "doors_open",
      location: "inside_venue",
    } as const;
    expect(resolveCredentialState(scenario, brooklyn.eventId, true)).toBe("none");
  });
});

describe("resolveExperienceAccessState", () => {
  it("maps T-30 to discover_only", () => {
    const scenario = { ...DEFAULT_DEMO_SCENARIO, timePhase: "t_minus_30" } as const;
    const experience = experienceFor(scenario);
    expect(
      resolveExperienceAccessState({
        experience,
        timingState: "upcoming",
        credential: "none",
        storeOpen: true,
      }),
    ).toBe("discover_only");
  });

  it("maps inside venue live show to live_unlocked without credential", () => {
    const scenario = {
      ...DEFAULT_DEMO_SCENARIO,
      timePhase: "doors_open",
      fanState: "at_venue",
      location: "inside_venue",
    } as const;
    const experience = experienceFor(scenario);
    expect(
      resolveExperienceAccessState({
        experience,
        timingState: "live",
        credential: "none",
        storeOpen: true,
      }),
    ).toBe("live_unlocked");
  });

  it("maps attended post-show with open store to postshow_open", () => {
    const scenario = {
      ...DEFAULT_DEMO_SCENARIO,
      fanState: "attended",
      timePhase: "show_ended",
    } as const;
    const experience = experienceFor(scenario);
    expect(
      resolveExperienceAccessState({
        experience,
        timingState: "recently_ended",
        credential: "earned",
        storeOpen: true,
      }),
    ).toBe("postshow_open");
  });

  it("maps archived attended show to history_only", () => {
    const scenario = {
      ...DEFAULT_DEMO_SCENARIO,
      fanState: "attended",
      timePhase: "t_plus_7",
    } as const;
    const experience = experienceFor(scenario);
    expect(
      resolveExperienceAccessState({
        experience,
        timingState: "archived",
        credential: "earned",
        storeOpen: false,
      }),
    ).toBe("history_only");
  });
});

describe("resolveFanExperienceState", () => {
  it("derives purchase state from scenario purchaseHistory", () => {
    const scenario = {
      ...DEFAULT_DEMO_SCENARIO,
      purchaseHistory: "show_exclusive",
    } as const;
    expect(resolvePurchaseState(scenario, brooklyn.eventId)).toBe("completed");
  });

  it("exposes helper gates from access state", () => {
    const scenario = {
      ...DEFAULT_DEMO_SCENARIO,
      timePhase: "t_minus_14",
    } as const;
    const fanExperience = resolveFanExperienceState({
      eventId: brooklyn.eventId,
      scenario,
      realVerified: false,
      timingState: timingStateForDemoPhase("t_minus_14"),
      storeOpen: true,
      now: brooklyn.startsAt,
    });
    expect(fanExperience.access).toBe("preview_locked");
    expect(canPreviewShop(fanExperience.access)).toBe(true);
    expect(canPurchaseShowExclusives(fanExperience.access)).toBe(false);
    expect(experienceAccessLabel(fanExperience.access)).toBe("PREVIEW LOCKED");
  });
});
