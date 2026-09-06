import { describe, expect, it } from "vitest";
import { DEFAULT_DEMO_SCENARIO } from "@/lib/demo-scenario/types";
import {
  guidedStepShouldPersistVerification,
  resolveDemoAwareVerifiedAttendee,
} from "@/server/demo/scenario-verification";

describe("resolveDemoAwareVerifiedAttendee", () => {
  it("returns false at T-30 even when the database still has a credential", () => {
    const scenario = {
      ...DEFAULT_DEMO_SCENARIO,
      artist: "nova_kestrel",
      showKey: "nova-nashville",
      timePhase: "t_minus_30",
      fanState: "unknown",
      location: "outside_venue",
    } as const;

    expect(
      resolveDemoAwareVerifiedAttendee("evt_nova_nashville", scenario, true),
    ).toBe(false);
  });

  it("returns true for attended post-show steps", () => {
    const scenario = {
      ...DEFAULT_DEMO_SCENARIO,
      artist: "nova_kestrel",
      showKey: "nova-nashville",
      timePhase: "show_ended",
      fanState: "attended",
      location: "outside_venue",
    } as const;

    expect(
      resolveDemoAwareVerifiedAttendee("evt_nova_nashville", scenario, false),
    ).toBe(true);
  });

  it("does not fabricate credential for returning fans without persisted attendance", () => {
    const scenario = {
      ...DEFAULT_DEMO_SCENARIO,
      artist: "nova_kestrel",
      showKey: "nova-nashville",
      timePhase: "t_plus_7",
      fanState: "returning_fan",
      location: "outside_venue",
    } as const;

    expect(guidedStepShouldPersistVerification(scenario)).toBe(false);
    expect(
      resolveDemoAwareVerifiedAttendee("evt_nova_nashville", scenario, false),
    ).toBe(false);
    expect(
      resolveDemoAwareVerifiedAttendee("evt_nova_nashville", scenario, true),
    ).toBe(true);
  });

  it("returns false for at-venue steps before credential is issued", () => {
    const scenario = {
      ...DEFAULT_DEMO_SCENARIO,
      artist: "nova_kestrel",
      showKey: "nova-nashville",
      timePhase: "doors_open",
      fanState: "at_venue",
      location: "inside_venue",
    } as const;

    expect(
      resolveDemoAwareVerifiedAttendee("evt_nova_nashville", scenario, true),
    ).toBe(false);
  });
});
