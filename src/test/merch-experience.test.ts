import { describe, expect, it } from "vitest";
import { getDemoShow } from "@/lib/demo-scenario/shows";
import { resolveDropProductPresentation, isDropVisibleInDemoScenario, shouldShowDropCountdown } from "@/lib/merch-experience/drop-presentation";
import {
  fanStateHasAttendanceCredential,
  fanStateIsGoing,
  isVenuePresenceActive,
  resolveMerchExperience,
} from "@/lib/merch-experience/resolver";

const detroit = getDemoShow("atlas-detroit")!;
const nashville = getDemoShow("nova-nashville")!;

function experience(
  show: typeof detroit,
  timePhase: Parameters<typeof resolveMerchExperience>[0]["timePhase"],
  fanState: Parameters<typeof resolveMerchExperience>[0]["fanState"],
  location: Parameters<typeof resolveMerchExperience>[0]["location"] = "outside_venue",
  fanHistory: Parameters<typeof resolveMerchExperience>[0]["fanHistory"] = "first_show",
) {
  return resolveMerchExperience({
    now: new Date(show.startsAt.getTime() - 7 * 24 * 60 * 60 * 1000),
    show,
    timePhase,
    fanState,
    location,
    fanHistory,
    purchaseHistory: "none",
    merchRule: "auto",
  });
}

describe("resolveMerchExperience", () => {
  it("T-30 + unknown shows teaser-only show exclusives", () => {
    const state = experience(detroit, "t_minus_30", "unknown");
    expect(state.showExclusiveVisibility).toBe("teaser");
    expect(state.showExclusivePurchasable).toBe(false);
    expect(state.coreMerchPurchasable).toBe(true);
  });

  it("T-14 + unknown shows visible locked exclusives", () => {
    const state = experience(detroit, "t_minus_14", "unknown");
    expect(state.showExclusiveTreatment).toBe("visible_locked");
    expect(state.showExclusivePurchasable).toBe(false);
    expect(state.primaryMessage).toMatch(/available at the show/i);
  });

  it("T-7 + I'm Going keeps exclusives locked", () => {
    const state = experience(detroit, "t_minus_7", "going");
    expect(state.showExclusiveTreatment).toBe("visible_locked");
    expect(state.showExclusivePurchasable).toBe(false);
    expect(fanStateIsGoing("going")).toBe(true);
    expect(fanStateHasAttendanceCredential("going")).toBe(false);
  });

  it("T-1 + I'm Going does not create attendance", () => {
    const state = experience(nashville, "t_minus_1", "going");
    expect(state.hasAttendanceCredential).toBe(false);
    expect(state.primaryMessage).toMatch(/unlocks tomorrow/i);
  });

  it("show day outside venue keeps exclusives locked", () => {
    const state = experience(detroit, "show_day_morning", "unknown", "outside_venue");
    expect(state.showExclusivePurchasable).toBe(false);
    expect(state.primaryMessage).toMatch(/unlocks at the show/i);
  });

  it("doors open + outside venue keeps exclusives locked", () => {
    const state = experience(detroit, "doors_open", "at_venue", "outside_venue");
    expect(state.showExclusivePurchasable).toBe(false);
    expect(state.venuePresenceActive).toBe(false);
  });

  it("doors open + inside venue unlocks show exclusives", () => {
    const state = experience(detroit, "doors_open", "at_venue", "inside_venue");
    expect(state.showExclusivePurchasable).toBe(true);
    expect(state.primaryMessage).toMatch(/you're here/i);
    expect(isVenuePresenceActive("doors_open", "inside_venue")).toBe(true);
  });

  it("encore + inside venue enables live drop when configured", () => {
    const state = experience(detroit, "encore", "at_venue", "inside_venue");
    expect(state.liveDropVisible).toBe(true);
    expect(state.liveDropPurchasable).toBe(true);
  });

  it("T+1 + attended enables last chance", () => {
    const state = experience(detroit, "t_plus_1", "attended", "outside_venue");
    expect(state.showExclusiveTreatment).toBe("last_chance");
    expect(state.showExclusivePurchasable).toBe(true);
    expect(state.hasAttendanceCredential).toBe(true);
  });

  it("T+1 + unknown denies attendee last chance", () => {
    const state = experience(detroit, "t_plus_1", "unknown", "outside_venue");
    expect(state.showExclusivePurchasable).toBe(false);
  });

  it("T+2 + attended closes show-exclusive purchasing", () => {
    const state = experience(detroit, "t_plus_2", "attended", "outside_venue");
    expect(state.showExclusivePurchasable).toBe(false);
    expect(state.showExclusiveTreatment).toBe("history_only");
  });

  it("returning fan second show surfaces welcome-back messaging", () => {
    const state = experience(detroit, "t_minus_1", "returning_fan", "outside_venue", "second_show");
    expect(state.relationshipTreatment).toMatch(/welcome back/i);
  });

  it("I'm Going never equals attendance credential", () => {
    expect(fanStateIsGoing("going")).toBe(true);
    expect(fanStateHasAttendanceCredential("going")).toBe(false);
    const state = experience(detroit, "doors_open", "going", "inside_venue");
    expect(state.hasAttendanceCredential).toBe(false);
  });

  it("time alone does not unlock venue-exclusive merchandise", () => {
    const state = experience(detroit, "doors_open", "unknown", "outside_venue");
    expect(state.showExclusivePurchasable).toBe(false);
  });
});

describe("resolveDropProductPresentation", () => {
  it("T-30 Toronto tee on drops is teaser not buy now", () => {
    const toronto = getDemoShow("atlas-toronto")!;
    const state = experience(toronto, "t_minus_30", "unknown");
    const presentation = resolveDropProductPresentation(
      {
        accessType: "event_specific",
        eventId: toronto.eventId,
        dropEventId: toronto.eventId,
      },
      state,
      toronto.eventId,
    );
    expect(presentation.canBuy).toBe(false);
    expect(presentation.teaser).toBe(true);
    expect(presentation.actionLabel).toBe("Coming soon");
  });

  it("T-30 cross-show exclusive is teaser not unlocks at the show", () => {
    const detroit = getDemoShow("atlas-detroit")!;
    const toronto = getDemoShow("atlas-toronto")!;
    const state = experience(detroit, "t_minus_30", "unknown");
    const presentation = resolveDropProductPresentation(
      {
        accessType: "event_specific",
        eventId: toronto.eventId,
        dropEventId: toronto.eventId,
      },
      state,
      detroit.eventId,
    );
    expect(presentation.teaser).toBe(true);
    expect(presentation.actionLabel).toBe("Coming soon");
  });
});

describe("demo drops visibility", () => {
  it("T-30 Detroit hides Toronto preview drop", () => {
    const detroit = getDemoShow("atlas-detroit")!;
    const toronto = getDemoShow("atlas-toronto")!;
    expect(isDropVisibleInDemoScenario({ eventId: null }, detroit.eventId)).toBe(true);
    expect(isDropVisibleInDemoScenario({ eventId: detroit.eventId }, detroit.eventId)).toBe(true);
    expect(isDropVisibleInDemoScenario({ eventId: toronto.eventId }, detroit.eventId)).toBe(false);
  });

  it("only flash and post-show drops get countdown banners", () => {
    const detroit = getDemoShow("atlas-detroit")!;
    const now = experience(detroit, "encore", "at_venue", "inside_venue").venuePresenceActive
      ? new Date()
      : new Date(detroit.endsAt.getTime() + 60_000);
    const endsAt = new Date(now.getTime() + 60 * 60_000);

    expect(
      shouldShowDropCountdown(
        { endsAt, exclusivityType: "standard", eventId: detroit.eventId },
        detroit.eventId,
        now,
      ),
    ).toBe(false);
    expect(
      shouldShowDropCountdown(
        { endsAt, exclusivityType: "flash", eventId: detroit.eventId },
        detroit.eventId,
        now,
      ),
    ).toBe(true);
  });
});
