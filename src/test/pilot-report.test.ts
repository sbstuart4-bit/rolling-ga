/**
 * Phase 6 — Pilot report + executive outcome.
 */
import { randomUUID } from "node:crypto";
import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { eventPilotGoals, events, orders } from "@/db/schema";
import {
  db as getDb,
  createUser,
  createArtist,
  createVenue,
  createTour,
  createEvent,
  authContextFor,
  membershipFor,
} from "./helpers";
import {
  evaluatePilotGoal,
  evaluatePilotGoalStatus,
  evaluatePilotGoals,
  pilotReportHref,
} from "@/lib/pilot-report/goals";
import { resolvePilotMetrics, buildPilotCompleteness, buildPilotConclusion } from "@/lib/pilot-report/build";
import { MARISOL_BROOKLYN_PILOT_GOALS_WITH_EVENT } from "@/lib/pilot-report/marisol-brooklyn-goals";
import { MARISOL_BROOKLYN_EVENT_ID } from "@/lib/demo-user-ids";
import { getArtistGuidedStep } from "@/lib/artist-guided-demo";
import { seedBrooklynPilotGoals } from "@/db/seed/brooklyn-pilot-goals";
import { loadPilotReportSnapshot } from "@/server/studio/pilot-report-queries";
import type { ShowEconomicsSnapshot } from "@/lib/show-economics/types";

function mockEconomics(overrides: Partial<ShowEconomicsSnapshot> = {}): ShowEconomicsSnapshot {
  const base: ShowEconomicsSnapshot = {
    eventId: "evt_test",
    eventLabel: "Test",
    isDemoData: true,
    config: {
      platformFeeBasisPoints: 500,
      digitalVenueCommissionTreatment: "UNKNOWN",
      digitalVenueCommissionPercent: null,
    },
    physical: {
      physicalMerchGmvCents: 10_000_00,
      unitsBrought: 100,
      unitsSold: 80,
      stockoutCount: 2,
      venueCommissionTreatment: "UNKNOWN",
      venueCommissionPercent: null,
      laborCostCents: 500_00,
      otherPhysicalCostCents: 200_00,
      physicalProductCostCents: 3000_00,
    },
    physicalComputed: {
      unsoldUnits: 20,
      physicalAovCents: 125_00,
      venueCommissionCents: null,
      venueCommissionLabel: "Unknown",
      estimatedProceedsCents: null,
      proceedsComplete: false,
      missingInputs: ["venue commission"],
    },
    rollingGa: {
      gmvCents: 8_000_00,
      showNightGmvCents: 5_000_00,
      postShowGmvCents: 3_000_00,
      orderCount: 40,
      unitCount: 45,
      aovCents: 200_00,
      purchasingFans: 35,
      repeatPurchasers: 8,
      fulfillmentCostCents: 400_00,
      shippingPaidByFanCents: 200_00,
      shippingSubsidizedByArtistCents: 100_00,
      productCostCents: 2000_00,
      productCostComplete: true,
    },
    rollingGaBridge: {
      proceedsCents: null,
      complete: false,
      missing: ["digital venue commission"],
      lines: [],
    },
    combined: {
      physicalProceedsCents: null,
      rollingGaProceedsCents: null,
      combinedProceedsCents: null,
      combinedComplete: false,
    },
    connectedFanRelationships: 30,
    postShowPurchasers: 12,
    repeatPurchasers: 8,
    postShowRelationshipGmvCents: 3_000_00,
    activatedPostShowGmvCents: 1_800_00,
    organicPostShowGmvCents: 1_200_00,
    comparisonRows: [],
  };
  return { ...base, ...overrides };
}

describe("pilot goal evaluation", () => {
  it("exceeds target when actual is above higher-direction target", () => {
    expect(evaluatePilotGoalStatus("higher", 100, 150)).toBe("exceeded_target");
  });

  it("meets target when actual equals higher-direction target", () => {
    expect(evaluatePilotGoalStatus("higher", 100, 100)).toBe("met_target");
  });

  it("is below target when actual is under higher-direction target", () => {
    expect(evaluatePilotGoalStatus("higher", 100, 50)).toBe("below_target");
  });

  it("exceeds lower-direction target when actual is below target", () => {
    expect(evaluatePilotGoalStatus("lower", 100, 80)).toBe("exceeded_target");
  });

  it("returns not_enough_data when actual is missing", () => {
    expect(evaluatePilotGoalStatus("higher", 100, null)).toBe("not_enough_data");
  });

  it("evaluates goals from metrics without hard-coded labels", () => {
    const goal = MARISOL_BROOKLYN_PILOT_GOALS_WITH_EVENT[0];
    const evaluated = evaluatePilotGoal(goal, { digital_adoption_rate: 0.5 });
    expect(evaluated.status).toBe("exceeded_target");
    expect(evaluated.formattedActual).toBe("50.0%");
  });

  it("computes delivery promise goal from ratio metric", () => {
    const goal = MARISOL_BROOKLYN_PILOT_GOALS_WITH_EVENT.find(
      (g) => g.metricKey === "delivery_promise_rate",
    )!;
    const evaluated = evaluatePilotGoals([goal], { delivery_promise_rate: 0.95 });
    expect(evaluated[0].status).toBe("exceeded_target");
  });
});

describe("pilot report metrics composition", () => {
  it("resolves metrics from economics and cohort without duplicating math", () => {
    const economics = mockEconomics();
    const metrics = resolvePilotMetrics({
      economics,
      cohort: null,
      fulfillment: {
        deliveredCount: 30,
        deliveredWithinPromise: 28,
        deliveredPastPromise: 2,
        atRiskCount: 1,
        pastPromiseCount: 0,
        openExceptions: 1,
        deliveryPromiseRate: 28 / 30,
      },
      verifiedAttendees: 50,
    });
    expect(metrics.rolling_ga_gmv_cents).toBe(8_000_00);
    expect(metrics.activated_post_show_gmv_cents).toBe(1_800_00);
    expect(metrics.digital_adoption_rate).toBe(35 / 50);
  });

  it("preserves post-show GMV decomposition", () => {
    const economics = mockEconomics();
    expect(
      economics.activatedPostShowGmvCents + economics.organicPostShowGmvCents,
    ).toBe(economics.rollingGa.postShowGmvCents);
  });

  it("marks venue UNKNOWN in completeness", () => {
    const items = buildPilotCompleteness({
      economics: mockEconomics(),
      cohort: null,
      fulfillmentOrderCount: 10,
      activationMeasured: true,
    });
    const venue = items.find((i) => i.id === "venue_treatment");
    expect(venue?.level).toBe("unknown");
  });

  it("does not claim proceeds when venue treatment unknown", () => {
    const conclusion = buildPilotConclusion({
      economics: mockEconomics(),
      goals: [],
      completeness: buildPilotCompleteness({
        economics: mockEconomics(),
        cohort: null,
        fulfillmentOrderCount: 10,
        activationMeasured: true,
      }),
    });
    expect(conclusion.whatRemainsUnknown).toContain("Venue commission");
    expect(conclusion.recommendedNextTest).toContain("Confirm venue commission");
  });
});

describe("brooklyn pilot goals seed", () => {
  it("seeds goals idempotently", async () => {
    const artist = await createArtist("Marisol Reyes");
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    await getDb().insert(events).values({
      id: MARISOL_BROOKLYN_EVENT_ID,
      artistId: artist.id,
      tourId: tour.id,
      venueId: venue.id,
      slug: "marisol-brooklyn-pilot-test",
      startsAt: new Date("2026-06-12T20:00:00-04:00"),
      endsAt: new Date("2026-06-12T22:30:00-04:00"),
      timezone: "America/New_York",
    });

    expect(MARISOL_BROOKLYN_PILOT_GOALS_WITH_EVENT.length).toBe(6);

    const first = await seedBrooklynPilotGoals(getDb());
    const second = await seedBrooklynPilotGoals(getDb());
    expect(first).toBe(6);
    expect(second).toBe(6);

    const rows = await getDb()
      .select()
      .from(eventPilotGoals)
      .where(eq(eventPilotGoals.eventId, MARISOL_BROOKLYN_EVENT_ID));
    expect(rows.length).toBe(6);
    expect(rows[0].targetValue).toBeGreaterThan(0);
  });
});

describe("pilot report tenancy", () => {
  it("denies cross-artist report access", async () => {
    const member = await createUser();
    const fan = await createUser();
    const artistA = await createArtist("Artist A");
    const artistB = await createArtist("Artist B");
    const venue = await createVenue();
    const tourA = await createTour(artistA.id);
    const tourB = await createTour(artistB.id);
    const eventB = await createEvent(artistB.id, tourB.id, venue.id);

    await getDb().insert(orders).values({
      id: `ord_${randomUUID()}`,
      orderNumber: "RG-TEN-1",
      userId: fan.id,
      artistId: artistB.id,
      eventId: eventB.id,
      status: "paid",
      subtotalCents: 3000,
      totalCents: 3000,
      placedAt: new Date(),
      isDemo: true,
    });

    const ctx = authContextFor(member, {
      roles: ["artist_member"],
      memberships: [membershipFor(artistA)],
      activeArtistId: artistA.id,
    });

    const report = await loadPilotReportSnapshot(ctx, artistA.id, eventB.id);
    expect(report).toBeNull();
  });
});

describe("guided demo integration", () => {
  it("step 6 pilot report href targets Brooklyn", () => {
    expect(pilotReportHref(MARISOL_BROOKLYN_EVENT_ID)).toBe(
      `/studio/insights/pilot/${MARISOL_BROOKLYN_EVENT_ID}`,
    );
    const step6 = getArtistGuidedStep("marisol-artist-studio", 6)!;
    expect(step6.isConclusion).toBe(true);
  });
});
