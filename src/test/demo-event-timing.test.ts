import { describe, expect, it } from "vitest";
import { resolveTimePhaseDate } from "@/lib/demo-scenario/time-phases";
import { getDemoShow } from "@/lib/demo-scenario/shows";
import { resolveEventState } from "@/lib/event-state";
import {
  resolveFanExperienceState,
  timingStateForDemoPhase,
} from "@/lib/fan-experience/access-state";
import { resolveDemoAwareEventTiming } from "@/server/demo/demo-event-timing";
import { getGuidedStep } from "@/lib/guided-demo";
import { resolveGuidedStepFanExperience } from "@/server/demo/guided-demo-state";

const nashville = getDemoShow("nova-nashville")!;

const doorsOpenScenario = {
  artist: "nova_kestrel" as const,
  showKey: "nova-nashville" as const,
  timePhase: "doors_open" as const,
  fanState: "at_venue" as const,
  location: "inside_venue" as const,
  fanHistory: "first_show" as const,
  purchaseHistory: "none" as const,
  merchRule: "auto" as const,
};

describe("resolveDemoAwareEventTiming", () => {
  it("treats doors open as live even though demo clock is before startsAt", () => {
    const now = resolveTimePhaseDate(nashville, "doors_open");
    const raw = resolveEventState(
      {
        startsAt: nashville.startsAt,
        endsAt: nashville.endsAt,
        doorsAt: nashville.doorsAt,
        postShowWindowMinutes: null,
        cancelled: false,
      },
      480,
      now,
    );
    const demoAware = resolveDemoAwareEventTiming(
      {
        startsAt: nashville.startsAt,
        endsAt: nashville.endsAt,
        doorsAt: nashville.doorsAt,
        postShowWindowMinutes: null,
        cancelled: false,
        tourWindowMinutes: 480,
      },
      doorsOpenScenario,
      nashville.eventId,
      now,
    );

    expect(raw.state).toBe("upcoming");
    expect(demoAware.state).toBe("live");
  });

  it("falls back to timestamp timing when no scenario applies", () => {
    const now = resolveTimePhaseDate(nashville, "t_minus_14");
    const timing = resolveDemoAwareEventTiming(
      {
        startsAt: nashville.startsAt,
        endsAt: nashville.endsAt,
        doorsAt: nashville.doorsAt,
        postShowWindowMinutes: null,
        cancelled: false,
        tourWindowMinutes: 480,
      },
      null,
      nashville.eventId,
      now,
    );

    expect(timing.state).toBe("upcoming");
  });
});

describe("guided demo doors open", () => {
  it("step 5 unlocks fan experience with demo-aware live timing", () => {
    const step = getGuidedStep("nova-nashville", 5)!;
    const fanExperience = resolveGuidedStepFanExperience(step)!;
    const now = resolveTimePhaseDate(nashville, "doors_open");

    expect(fanExperience.access).toBe("live_unlocked");

    const timing = resolveDemoAwareEventTiming(
      {
        startsAt: nashville.startsAt,
        endsAt: nashville.endsAt,
        doorsAt: nashville.doorsAt,
        postShowWindowMinutes: null,
        cancelled: false,
        tourWindowMinutes: 480,
      },
      step.scenario,
      nashville.eventId,
      now,
    );

    const resolved = resolveFanExperienceState({
      eventId: nashville.eventId,
      scenario: step.scenario,
      realVerified: false,
      timingState: timing.state,
      storeOpen: timing.state === "live" || timing.state === "recently_ended",
      now,
    });

    expect(resolved.access).toBe("live_unlocked");
    expect(timingStateForDemoPhase(step.scenario.timePhase)).toBe("live");
  });
});
