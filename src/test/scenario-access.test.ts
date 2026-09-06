import { describe, expect, it } from "vitest";
import { DEFAULT_DEMO_SCENARIO } from "@/lib/demo-scenario/types";
import {
  resolveDemoEventCommerceAccess,
  scenarioHoldsShowCredential,
} from "@/server/demo/scenario-access";

describe("scenarioHoldsShowCredential", () => {
  it("is false for at-venue geofence before post-show", () => {
    const scenario = {
      ...DEFAULT_DEMO_SCENARIO,
      showKey: "nova-nashville",
      timePhase: "doors_open",
      fanState: "at_venue",
      location: "inside_venue",
    } as const;

    expect(scenarioHoldsShowCredential(scenario)).toBe(false);
  });

  it("is true for attended post-show", () => {
    const scenario = {
      ...DEFAULT_DEMO_SCENARIO,
      showKey: "nova-nashville",
      timePhase: "show_ended",
      fanState: "attended",
      location: "outside_venue",
    } as const;

    expect(scenarioHoldsShowCredential(scenario)).toBe(true);
  });

  it("does not treat returning_fan alone as credential holder", () => {
    const scenario = {
      ...DEFAULT_DEMO_SCENARIO,
      showKey: "nova-nashville",
      timePhase: "t_plus_7",
      fanState: "returning_fan",
      location: "outside_venue",
    } as const;

    expect(scenarioHoldsShowCredential(scenario, false)).toBe(false);
    expect(scenarioHoldsShowCredential(scenario, true)).toBe(true);
  });
});

describe("resolveDemoEventCommerceAccess", () => {
  it("unlocks show exclusives via live_unlocked access without credential", () => {
    const scenario = {
      ...DEFAULT_DEMO_SCENARIO,
      showKey: "nova-nashville",
      timePhase: "doors_open",
      fanState: "at_venue",
      location: "inside_venue",
    } as const;

    const access = resolveDemoEventCommerceAccess(
      "evt_nova_nashville",
      scenario,
      false,
      "live",
    );

    expect(access.hasShowCredential).toBe(false);
    expect(access.venuePresenceActive).toBe(true);
    expect(access.canPurchaseShowExclusives).toBe(true);
  });

  it("does not treat returning fan pre-show as credential holder", () => {
    const scenario = {
      ...DEFAULT_DEMO_SCENARIO,
      showKey: "nova-nashville",
      timePhase: "t_minus_14",
      fanState: "returning_fan",
      location: "outside_venue",
    } as const;

    const access = resolveDemoEventCommerceAccess(
      "evt_nova_nashville",
      scenario,
      false,
      "upcoming",
    );

    expect(access.hasShowCredential).toBe(false);
    expect(access.canPurchaseShowExclusives).toBe(false);
  });
});
