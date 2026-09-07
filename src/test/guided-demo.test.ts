import { describe, expect, it } from "vitest";

import {

  COMING_SOON_GUIDED_JOURNEYS,

  DEGENS_DETROIT_STEPS,

  getGuidedJourney,

  getGuidedStep,

  listActiveGuidedJourneys,

  MARISOL_TENDER_NIGHT_JOURNEY,
  MARISOL_TENDER_NIGHT_STEPS,

  NOVA_NASHVILLE_JOURNEY,

  NOVA_NASHVILLE_STEPS,

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

import {

  guidedDemoQuery,

  guidedStepMerchLabel,

  resolveGuidedStepFanExperience,

} from "@/server/demo/guided-demo-state";



const brooklyn = getDemoShow("marisol-brooklyn")!;

const nashville = getDemoShow("nova-nashville")!;

const detroit = getDemoShow("atlas-detroit")!;



function merchForMarisolStep(stepNumber: number) {
  const step = MARISOL_TENDER_NIGHT_STEPS[stepNumber - 1]!;
  return resolveMerchExperience({
    now: brooklyn.startsAt,
    show: brooklyn,
    timePhase: step.scenario.timePhase,
    fanState: step.scenario.fanState,
    location: step.scenario.location,
    fanHistory: step.scenario.fanHistory,
    purchaseHistory: step.scenario.purchaseHistory,
    merchRule: step.scenario.merchRule,
  });
}

function merchForNovaStep(stepNumber: number) {

  const step = getGuidedStep("nova-nashville", stepNumber)!;

  return resolveMerchExperience({

    now: nashville.startsAt,

    show: nashville,

    timePhase: step.scenario.timePhase,

    fanState: step.scenario.fanState,

    location: step.scenario.location,

    fanHistory: step.scenario.fanHistory,

    purchaseHistory: step.scenario.purchaseHistory,

    merchRule: step.scenario.merchRule,

  });

}



describe("guided demo registry", () => {

  it("lists only Marisol Tender Night as the active guided journey", () => {
    const active = listActiveGuidedJourneys();
    expect(active).toHaveLength(1);
    expect(active[0]?.id).toBe("marisol-tender-night");
    expect(getGuidedJourney("marisol-tender-night")).toBe(MARISOL_TENDER_NIGHT_JOURNEY);
  });

  it("maps legacy nova-nashville journey id to Marisol", () => {
    expect(getGuidedJourney("nova-nashville")).toBe(MARISOL_TENDER_NIGHT_JOURNEY);
  });



  it("does not start legacy Degens journey from the registry", () => {

    expect(getGuidedJourney("degens-detroit")).toBeUndefined();

  });



  it("exposes coming-soon placeholders including Nova Nashville", () => {
    expect(COMING_SOON_GUIDED_JOURNEYS.some((j) => j.id === "nova-nashville")).toBe(true);
  });

});



describe("Marisol Tender Night guided journey", () => {
  it("has ten stable ordered steps", () => {
    expect(MARISOL_TENDER_NIGHT_STEPS).toHaveLength(10);
    expect(MARISOL_TENDER_NIGHT_STEPS.map((s) => s.step)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("targets the real Brooklyn show slug and routes", () => {
    expect(MARISOL_TENDER_NIGHT_JOURNEY.showKey).toBe("marisol-brooklyn");
    const step1 = getGuidedStep("marisol-tender-night", 1)!;
    expect(resolveGuidedRoute(step1.route, brooklyn)).toBe(`/event/${brooklyn.slug}`);
    const step8 = getGuidedStep("marisol-tender-night", 8)!;
    expect(resolveGuidedRoute(step8.route, brooklyn)).toContain("tender-night-brooklyn-tee");
  });

  it("step 8 does not imply a completed purchase", () => {
    const step = getGuidedStep("marisol-tender-night", 8)!;
    const fanExperience = resolveGuidedStepFanExperience(step);
    expect(fanExperience?.purchase).toBe("none");
    expect(step.whatChanged).not.toMatch(/completed|confirmed|took home/i);
  });

  it("step 5 venue arrival unlocks show-exclusive merch", () => {
    const step = MARISOL_TENDER_NIGHT_STEPS[4]!;
    expect(isVenuePresenceActive("doors_open", "inside_venue")).toBe(true);
    expect(merchForMarisolStep(5).showExclusivePurchasable).toBe(true);
    expect(resolveGuidedRoute(step.route, brooklyn)).toContain("/shop");
  });

  it("step 1 is discover-only with no merch", () => {
    const step = getGuidedStep("marisol-tender-night", 1)!;
    expect(merchForMarisolStep(1).coreMerchPurchasable).toBe(false);
    expect(merchForMarisolStep(1).coreMerchVisible).toBe(false);
    expect(merchForMarisolStep(1).showExclusiveVisibility).toBe("teaser");
    expect(guidedStepMerchLabel(step)).toBe("DISCOVER ONLY");
  });
});

describe("Nova Nashville legacy journey data", () => {

  it("has ten stable ordered steps", () => {

    expect(NOVA_NASHVILLE_STEPS).toHaveLength(10);

    expect(NOVA_NASHVILLE_STEPS.map((s) => s.step)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  });



  it("maps each step to canonical access states", () => {

    const expected = [

      "DISCOVER ONLY",

      "PREVIEW LOCKED",

      "PREVIEW LOCKED",

      "PREVIEW LOCKED",

      "LIVE UNLOCKED",

      "LIVE UNLOCKED",

      "LIVE UNLOCKED",

      "LIVE UNLOCKED",

      "POSTSHOW OPEN",

      "HISTORY ONLY",

    ];

    for (const step of NOVA_NASHVILLE_STEPS) {

      expect(guidedStepMerchLabel(step)).toBe(expected[step.step - 1]);

    }

  });



  it("step 8 does not imply a completed purchase", () => {
    const step = NOVA_NASHVILLE_STEPS[7]!;

    const fanExperience = resolveGuidedStepFanExperience(step);

    expect(fanExperience?.purchase).toBe("none");

    expect(step.whatChanged).not.toMatch(/completed|confirmed|took home/i);

  });



  it("targets the real Nashville show slug and routes", () => {

    expect(NOVA_NASHVILLE_JOURNEY.showKey).toBe("nova-nashville");

    const step1 = NOVA_NASHVILLE_STEPS[0]!;
    expect(resolveGuidedRoute(step1.route, nashville)).toBe(`/event/${nashville.slug}`);
    const step8 = NOVA_NASHVILLE_STEPS[7]!;

    expect(resolveGuidedRoute(step8.route, nashville)).toContain("nashville-night-tee");

  });



  it("step 3 I'm Going does not create attendance", () => {

    const step = NOVA_NASHVILLE_STEPS[2];

    expect(step.scenario.fanState).toBe("going");

    expect(fanStateIsGoing("going")).toBe(true);

    expect(fanStateHasAttendanceCredential("going")).toBe(false);

    expect(merchForNovaStep(3).showExclusivePurchasable).toBe(false);

  });



  it("step 5 venue arrival unlocks show-exclusive merch", () => {

    const step = NOVA_NASHVILLE_STEPS[4];

    expect(isVenuePresenceActive("doors_open", "inside_venue")).toBe(true);

    expect(merchForNovaStep(5).showExclusivePurchasable).toBe(true);

    expect(resolveGuidedRoute(step.route, nashville)).toContain("/shop");

  });



  it("maps each step to a demo clock phase", () => {

    for (const step of NOVA_NASHVILLE_STEPS) {

      const clock = demoClockForTimePhase(nashville, step.scenario.timePhase);

      expect(Number.isFinite(clock.days)).toBe(true);

      expect(Number.isFinite(clock.hours)).toBe(true);

    }

  });



  it("step 9 post-show attended requests real verification", () => {

    const step = NOVA_NASHVILLE_STEPS[8];

    expect(step.verifyAttendance).toBe(true);

  });



  it("step 1 is discover-only with no merch", () => {

    const step = NOVA_NASHVILLE_STEPS[0]!;

    expect(merchForNovaStep(1).coreMerchPurchasable).toBe(false);

    expect(merchForNovaStep(1).coreMerchVisible).toBe(false);

    expect(merchForNovaStep(1).showExclusiveVisibility).toBe("teaser");

    expect(guidedStepMerchLabel(step)).toBe("DISCOVER ONLY");

  });

});



describe("guided demo URL persistence", () => {

  it("serializes journey and step into query params", () => {

    const qs = guidedDemoQuery({

      journeyId: "marisol-tender-night",

      step: 5,

      autoplay: false,

      presenter: true,

    });

    const params = new URLSearchParams(qs);

    expect(params.get("guided")).toBe("marisol-tender-night");

    expect(params.get("step")).toBe("5");

  });

});



describe("Degens legacy journey data", () => {

  it("keeps detroit step definitions for reference without registry access", () => {

    const step = DEGENS_DETROIT_STEPS[0]!;

    expect(resolveGuidedRoute(step.route, detroit)).toBe(`/event/${detroit.slug}`);

    expect(getGuidedJourney("degens-detroit")).toBeUndefined();

  });

});

