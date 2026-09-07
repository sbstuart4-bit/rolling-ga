import { describe, expect, it } from "vitest";
import { getDemoShow } from "@/lib/demo-scenario/shows";
import { getGuidedStep } from "@/lib/guided-demo";
import {
  liveNowNextEyebrow,
  productAccessLabelForExperience,
  resolveNowNextAction,
  scenarioFanIsGoing,
} from "@/lib/fan-experience/now-next";
import {
  resolveGuidedStepFanExperience,
  guidedStepMerchLabel,
} from "@/server/demo/guided-demo-state";
import { timingStateForDemoPhase } from "@/lib/fan-experience/access-state";

const brooklyn = getDemoShow("marisol-brooklyn")!;
const timezone = "America/New_York";

describe("resolveNowNextAction", () => {
  it("step 1 discover_only has no buy CTA and anticipation copy", () => {
    const step = getGuidedStep("marisol-tender-night", 1)!;
    const fanExperience = resolveGuidedStepFanExperience(step)!;
    const action = resolveNowNextAction({
      access: fanExperience.access,
      slug: brooklyn.slug,
      artistName: brooklyn.artistName,
      city: brooklyn.city,
      startsAt: brooklyn.startsAt,
      timezone,
      teaserMessage: fanExperience.experience?.primaryMessage,
      timingState: timingStateForDemoPhase(step.scenario.timePhase),
    });
    expect(action.showCta).toBe(false);
    expect(action.title).toMatch(/discover/i);
    expect(action.body).not.toMatch(/doors soon|verify|tender night/i);
  });

  it("step 4 preview_locked stays locked without verify CTA", () => {
    const step = getGuidedStep("marisol-tender-night", 4)!;
    const fanExperience = resolveGuidedStepFanExperience(step)!;
    expect(guidedStepMerchLabel(step)).toBe("PREVIEW LOCKED");
    const action = resolveNowNextAction({
      access: fanExperience.access,
      slug: brooklyn.slug,
      artistName: brooklyn.artistName,
      city: brooklyn.city,
      startsAt: brooklyn.startsAt,
      timezone,
      timingState: timingStateForDemoPhase(step.scenario.timePhase),
    });
    expect(action.title).toMatch(/locked/i);
    expect(action.body).not.toMatch(/verify|doors soon/i);
    expect(action.cta).toMatch(/preview/i);
  });

  it("step 5 live_unlocked routes to shop without credential language", () => {
    const step = getGuidedStep("marisol-tender-night", 5)!;
    const fanExperience = resolveGuidedStepFanExperience(step)!;
    const action = resolveNowNextAction({
      access: fanExperience.access,
      slug: brooklyn.slug,
      artistName: brooklyn.artistName,
      city: brooklyn.city,
      startsAt: brooklyn.startsAt,
      timezone,
      timingState: timingStateForDemoPhase(step.scenario.timePhase),
    });
    expect(action.href).toContain("/shop");
    expect(action.title).toMatch(/in the room/i);
  });

  it("step 10 history_only points to credential not live entry", () => {
    const step = getGuidedStep("marisol-tender-night", 10)!;
    const fanExperience = resolveGuidedStepFanExperience(step)!;
    const action = resolveNowNextAction({
      access: fanExperience.access,
      slug: brooklyn.slug,
      artistName: brooklyn.artistName,
      city: brooklyn.city,
      startsAt: brooklyn.startsAt,
      timezone,
      timingState: timingStateForDemoPhase(step.scenario.timePhase),
    });
    expect(action.href).toContain("/credential");
    expect(action.body).not.toMatch(/enter the show/i);
  });

  it("step 3 shows going relationship treatment", () => {
    const step = getGuidedStep("marisol-tender-night", 3)!;
    const fanExperience = resolveGuidedStepFanExperience(step)!;
    expect(scenarioFanIsGoing(fanExperience)).toBe(true);
  });

  it("step 8 PDP access label reflects venue presence not credential", () => {
    const step = getGuidedStep("marisol-tender-night", 8)!;
    const fanExperience = resolveGuidedStepFanExperience(step)!;
    expect(productAccessLabelForExperience(fanExperience)).toBe("Inside the venue tonight");
    expect(fanExperience.purchase).toBe("none");
  });
});

describe("liveNowNextEyebrow", () => {
  it("uses Upcoming for discover and preview locked upcoming shows", () => {
    expect(liveNowNextEyebrow("discover_only", "upcoming")).toBe("Upcoming");
    expect(liveNowNextEyebrow("preview_locked", "upcoming")).toBe("Upcoming");
  });
});
