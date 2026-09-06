import { describe, expect, it } from "vitest";
import {
  COMING_SOON_GUIDED_JOURNEYS,
  DEGENS_DETROIT_JOURNEY,
  DEGENS_DETROIT_STEPS,
  getGuidedJourney,
  getGuidedStep,
  listActiveGuidedJourneys,
  resolveGuidedRoute,
} from "@/lib/guided-demo";
import { getDemoShow } from "@/lib/demo-scenario/shows";
import { demoClockForTimePhase } from "@/lib/demo-scenario/time-phases";
import {
  fanStateHasAttendanceCredential,
  fanStateIsGoing,
  isVenuePresenceActive,
  resolveMerchExperience,
} from "@/lib/merch-experience/resolver";
import { guidedDemoQuery, guidedStepMerchLabel } from "@/server/demo/guided-demo-state";

const detroit = getDemoShow("atlas-detroit")!;

function merchForStep(stepNumber: number) {
  const step = getGuidedStep("degens-detroit", stepNumber)!;
  return resolveMerchExperience({
    now: detroit.startsAt,
    show: detroit,
    timePhase: step.scenario.timePhase,
    fanState: step.scenario.fanState,
    location: step.scenario.location,
    fanHistory: step.scenario.fanHistory,
    purchaseHistory: step.scenario.purchaseHistory,
    merchRule: step.scenario.merchRule,
  });
}

describe("guided demo registry", () => {
  it("lists Degens Detroit as the active guided journey", () => {
    const active = listActiveGuidedJourneys();
    expect(active.some((j) => j.id === "degens-detroit")).toBe(true);
    expect(getGuidedJourney("degens-detroit")).toBe(DEGENS_DETROIT_JOURNEY);
  });

  it("exposes three coming-soon placeholders", () => {
    expect(COMING_SOON_GUIDED_JOURNEYS).toHaveLength(3);
    expect(COMING_SOON_GUIDED_JOURNEYS.every((j) => j.comingSoon)).toBe(true);
  });
});

describe("Degens Detroit guided journey", () => {
  it("has ten stable ordered steps", () => {
    expect(DEGENS_DETROIT_STEPS).toHaveLength(10);
    expect(DEGENS_DETROIT_STEPS.map((s) => s.step)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("targets the real Detroit show slug and routes", () => {
    expect(DEGENS_DETROIT_JOURNEY.showKey).toBe("atlas-detroit");
    const step1 = getGuidedStep("degens-detroit", 1)!;
    expect(resolveGuidedRoute(step1.route, detroit)).toBe(`/event/${detroit.slug}`);
    const step8 = getGuidedStep("degens-detroit", 8)!;
    expect(resolveGuidedRoute(step8.route, detroit)).toContain("detroit-encore-tee");
    expect(resolveGuidedRoute(step8.route, detroit)).toContain(detroit.slug);
  });

  it("maps each step to a demo clock phase", () => {
    for (const step of DEGENS_DETROIT_STEPS) {
      const clock = demoClockForTimePhase(detroit, step.scenario.timePhase);
      expect(Number.isFinite(clock.days)).toBe(true);
      expect(Number.isFinite(clock.hours)).toBe(true);
    }
  });

  it("step 1 discovery is T-30 teaser-only", () => {
    const state = merchForStep(1);
    expect(DEGENS_DETROIT_STEPS[0].scenario.timePhase).toBe("t_minus_30");
    expect(state.showExclusiveVisibility).toBe("teaser");
    expect(guidedStepMerchLabel(DEGENS_DETROIT_STEPS[0])).toBe("TEASER ONLY");
  });

  it("step 2 anticipation shows visible locked exclusives", () => {
    const state = merchForStep(2);
    expect(state.showExclusiveTreatment).toBe("visible_locked");
    expect(state.showExclusivePurchasable).toBe(false);
  });

  it("step 3 I'm Going does not create attendance", () => {
    const step = DEGENS_DETROIT_STEPS[2];
    expect(step.scenario.fanState).toBe("going");
    expect(fanStateIsGoing("going")).toBe(true);
    expect(fanStateHasAttendanceCredential("going")).toBe(false);
    expect(merchForStep(3).showExclusivePurchasable).toBe(false);
    expect(step.verifyAttendance).toBeUndefined();
  });

  it("step 4 show day outside venue keeps exclusives locked", () => {
    const step = DEGENS_DETROIT_STEPS[3];
    expect(step.scenario.timePhase).toBe("t_minus_3_hours");
    expect(step.scenario.location).toBe("outside_venue");
    expect(merchForStep(4).showExclusivePurchasable).toBe(false);
  });

  it("step 5 venue arrival unlocks show-exclusive merch", () => {
    const step = DEGENS_DETROIT_STEPS[4];
    expect(step.scenario.fanState).toBe("at_venue");
    expect(step.scenario.location).toBe("inside_venue");
    expect(isVenuePresenceActive("doors_open", "inside_venue")).toBe(true);
    expect(merchForStep(5).showExclusivePurchasable).toBe(true);
    expect(resolveGuidedRoute(step.route, detroit)).toContain("/shop");
  });

  it("step 7 encore can expose configured live drop", () => {
    const step = DEGENS_DETROIT_STEPS[6];
    expect(step.scenario.timePhase).toBe("encore");
    expect(detroit.hasEncoreDrop).toBe(true);
    const state = merchForStep(7);
    expect(state.liveDropVisible || state.showExclusivePurchasable).toBe(true);
  });

  it("step 8 routes to real encore product checkout path", () => {
    const step = DEGENS_DETROIT_STEPS[7];
    expect(resolveGuidedRoute(step.route, detroit)).toMatch(/\/product\/detroit-encore-tee\?e=/);
  });

  it("step 9 post-show attended requests real verification", () => {
    const step = DEGENS_DETROIT_STEPS[8];
    expect(step.scenario.fanState).toBe("attended");
    expect(step.scenario.timePhase).toBe("show_ended");
    expect(step.verifyAttendance).toBe(true);
  });

  it("step 10 returning fan uses second-show history", () => {
    const step = DEGENS_DETROIT_STEPS[9];
    expect(step.scenario.fanState).toBe("returning_fan");
    expect(step.scenario.fanHistory).toBe("second_show");
    expect(resolveGuidedRoute(step.route, detroit)).toBe("/shows");
  });
});

describe("guided demo URL persistence", () => {
  it("serializes journey and step into query params", () => {
    const qs = guidedDemoQuery({
      journeyId: "degens-detroit",
      step: 5,
      autoplay: false,
      presenter: true,
    });
    const params = new URLSearchParams(qs);
    expect(params.get("guided")).toBe("degens-detroit");
    expect(params.get("step")).toBe("5");
    expect(params.get("presenter")).toBe("1");
    expect(params.get("autoplay")).toBeNull();
  });
});
