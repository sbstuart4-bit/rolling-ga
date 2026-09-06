import { describe, expect, it } from "vitest";
import { demoClockOffsetForDate } from "@/lib/demo-calendar";
import { resolveTimePhaseDate } from "@/lib/demo-scenario/time-phases";
import { getDemoShow } from "@/lib/demo-scenario/shows";
import { canPreviewShop, resolveFanExperienceState, timingStateForDemoPhase } from "@/lib/fan-experience/access-state";

describe("T-30 demo clock", () => {
  it("places Nova Nashville thirty days before the June 12 show", () => {
    const show = getDemoShow("nova-nashville")!;
    const t30 = resolveTimePhaseDate(show, "t_minus_30");
    const offset = demoClockOffsetForDate(t30);

    expect(offset).toBeLessThan(0);
    expect(Math.round((show.startsAt.getTime() - t30.getTime()) / (24 * 60 * 60 * 1000))).toBe(30);
  });
});

describe("canPreviewShop", () => {
  const nashville = getDemoShow("nova-nashville")!;

  it("blocks show-exclusive preview at T-30", () => {
    const scenario = {
      artist: "nova_kestrel" as const,
      showKey: "nova-nashville",
      timePhase: "t_minus_30" as const,
      fanState: "unknown" as const,
      location: "outside_venue" as const,
      fanHistory: "first_show" as const,
      purchaseHistory: "none" as const,
      merchRule: "auto" as const,
    };
    const fanExperience = resolveFanExperienceState({
      eventId: nashville.eventId,
      scenario,
      realVerified: false,
      timingState: timingStateForDemoPhase("t_minus_30"),
      storeOpen: true,
      now: resolveTimePhaseDate(nashville, "t_minus_30"),
    });

    expect(canPreviewShop(fanExperience.access)).toBe(false);
  });

  it("allows locked preview at T-14", () => {
    const scenario = {
      artist: "nova_kestrel" as const,
      showKey: "nova-nashville",
      timePhase: "t_minus_14" as const,
      fanState: "unknown" as const,
      location: "outside_venue" as const,
      fanHistory: "first_show" as const,
      purchaseHistory: "none" as const,
      merchRule: "auto" as const,
    };
    const fanExperience = resolveFanExperienceState({
      eventId: nashville.eventId,
      scenario,
      realVerified: false,
      timingState: timingStateForDemoPhase("t_minus_14"),
      storeOpen: true,
      now: resolveTimePhaseDate(nashville, "t_minus_14"),
    });

    expect(canPreviewShop(fanExperience.access)).toBe(true);
  });
});
