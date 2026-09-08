import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import {
  MARISOL_ARTIST_STUDIO_STEPS,
  resolveArtistGuidedRoute,
} from "@/lib/artist-guided-demo";
import { MARISOL_BROOKLYN_EVENT_ID } from "@/lib/demo-user-ids";
import {
  computeCombinedEconomics,
  computePhysicalBaseline,
  computePlatformFeeCents,
  computeRollingGaBridge,
  computeVenueCommissionCents,
  validatePhysicalBaselineInput,
  venueCommissionLabel,
} from "@/lib/show-economics/calculations";
import {
  MARISOL_BROOKLYN_ECONOMICS_CONFIG,
  MARISOL_BROOKLYN_PHYSICAL_BASELINE,
} from "@/lib/show-economics/marisol-brooklyn-fixture";
import { eventShowEconomics } from "@/db/schema";
import { authContextFor, createArtist, createEvent, createTour, createUser, createVenue, db, membershipFor } from "./helpers";
import { loadShowEconomicsSnapshot } from "@/server/studio/show-economics-queries";

describe("venue commission treatment", () => {
  it("returns null commission for UNKNOWN without zero assumption", () => {
    const result = computeVenueCommissionCents(10_000_00, "UNKNOWN", null);
    expect(result.cents).toBeNull();
    expect(result.label).toBe("Contract treatment not confirmed");
    expect(venueCommissionLabel("UNKNOWN")).toBe("Contract treatment not confirmed");
  });

  it("returns zero for EXCLUDED", () => {
    const result = computeVenueCommissionCents(10_000_00, "EXCLUDED", 25);
    expect(result.cents).toBe(0);
  });

  it("computes percent for INCLUDED", () => {
    const result = computeVenueCommissionCents(10_000_00, "INCLUDED", 20);
    expect(result.cents).toBe(2_000_00);
  });

  it("requires percent when INCLUDED", () => {
    const result = computeVenueCommissionCents(10_000_00, "INCLUDED", null);
    expect(result.cents).toBeNull();
  });
});

describe("Rolling GA economic bridge", () => {
  const baseRollingGa = {
    gmvCents: 12_000_00,
    showNightGmvCents: 9_000_00,
    postShowGmvCents: 3_000_00,
    orderCount: 40,
    unitCount: 52,
    aovCents: 300_00,
    purchasingFans: 38,
    repeatPurchasers: 6,
    fulfillmentCostCents: 800_00,
    shippingPaidByFanCents: 600_00,
    shippingSubsidizedByArtistCents: 200_00,
    productCostCents: 3_600_00,
    productCostComplete: true,
  };

  it("deducts platform fee, fulfillment, shipping subsidy and venue commission", () => {
    const bridge = computeRollingGaBridge(baseRollingGa, {
      platformFeeBasisPoints: 500,
      digitalVenueCommissionTreatment: "INCLUDED",
      digitalVenueCommissionPercent: 15,
    });

    expect(computePlatformFeeCents(12_000_00, 500)).toBe(600_00);
    expect(bridge.lines.find((l) => l.key === "platform_fee")?.amountCents).toBe(600_00);
    expect(bridge.lines.find((l) => l.key === "venue_commission")?.amountCents).toBe(1_800_00);
    expect(bridge.complete).toBe(true);
    // 12000 - 600 - 800 - 200 - 1800 - 3600 = 5000
    expect(bridge.proceedsCents).toBe(5_000_00);
  });

  it("marks proceeds incomplete when digital venue treatment is UNKNOWN", () => {
    const bridge = computeRollingGaBridge(baseRollingGa, {
      platformFeeBasisPoints: 500,
      digitalVenueCommissionTreatment: "UNKNOWN",
      digitalVenueCommissionPercent: null,
    });

    expect(bridge.complete).toBe(false);
    expect(bridge.proceedsCents).toBeNull();
    expect(bridge.missing).toContain("digital channel venue commission treatment");
    expect(bridge.lines.find((l) => l.key === "venue_commission")?.amountCents).toBeNull();
  });

  it("applies EXCLUDED venue commission as zero in proceeds", () => {
    const bridge = computeRollingGaBridge(baseRollingGa, {
      platformFeeBasisPoints: 500,
      digitalVenueCommissionTreatment: "EXCLUDED",
      digitalVenueCommissionPercent: null,
    });

    expect(bridge.complete).toBe(true);
    expect(bridge.lines.find((l) => l.key === "venue_commission")?.amountCents).toBe(0);
    // 12000 - 600 - 800 - 200 - 0 - 3600 = 6800
    expect(bridge.proceedsCents).toBe(6_800_00);
  });
});

describe("physical baseline", () => {
  it("computes unsold units and AOV from Marisol fixture", () => {
    const computed = computePhysicalBaseline(MARISOL_BROOKLYN_PHYSICAL_BASELINE);
    expect(computed.unsoldUnits).toBe(68); // 420 - 318 - 34
    expect(computed.physicalAovCents).toBe(Math.round(18_420_00 / 318));
    expect(computed.venueCommissionCents).toBeNull();
    expect(computed.proceedsComplete).toBe(false);
    expect(computed.missingInputs).toContain("venue commission treatment");
  });

  it("computes physical proceeds when venue commission is INCLUDED", () => {
    const computed = computePhysicalBaseline({
      ...MARISOL_BROOKLYN_PHYSICAL_BASELINE,
      venueCommissionTreatment: "INCLUDED",
      venueCommissionPercent: 20,
    });
    expect(computed.venueCommissionCents).toBe(3_684_00);
    expect(computed.proceedsComplete).toBe(true);
    // 18420 - 3684 - 2800 - 950 - 6120 = 4866
    expect(computed.estimatedProceedsCents).toBe(4_866_00);
  });

  it("reports missing baseline when physical GMV absent", () => {
    const computed = computePhysicalBaseline({
      physicalMerchGmvCents: null,
      unitsBrought: null,
      unitsSold: null,
      stockoutCount: null,
      venueCommissionTreatment: "UNKNOWN",
      venueCommissionPercent: null,
      laborCostCents: null,
      otherPhysicalCostCents: null,
      physicalProductCostCents: null,
    });
    expect(computed.proceedsComplete).toBe(false);
    expect(computed.missingInputs).toContain("physical merch GMV");
  });
});

describe("baseline validation", () => {
  it("rejects invalid unit counts", () => {
    const result = validatePhysicalBaselineInput({
      ...MARISOL_BROOKLYN_PHYSICAL_BASELINE,
      unitsSold: 500,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.unitsSold).toMatch(/cannot exceed units brought/i);
  });

  it("rejects sold plus stockouts exceeding brought", () => {
    const result = validatePhysicalBaselineInput({
      ...MARISOL_BROOKLYN_PHYSICAL_BASELINE,
      unitsBrought: 100,
      unitsSold: 90,
      stockoutCount: 15,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.stockoutCount).toBeDefined();
  });

  it("rejects invalid commission percent when INCLUDED", () => {
    const missing = validatePhysicalBaselineInput({
      ...MARISOL_BROOKLYN_PHYSICAL_BASELINE,
      venueCommissionTreatment: "INCLUDED",
      venueCommissionPercent: null,
    });
    expect(missing.ok).toBe(false);

    const over = validatePhysicalBaselineInput({
      ...MARISOL_BROOKLYN_PHYSICAL_BASELINE,
      venueCommissionTreatment: "INCLUDED",
      venueCommissionPercent: 150,
    });
    expect(over.ok).toBe(false);
  });
});

describe("combined show economics", () => {
  it("sums physical and Rolling GA proceeds when both complete", () => {
    const physical = computePhysicalBaseline({
      ...MARISOL_BROOKLYN_PHYSICAL_BASELINE,
      venueCommissionTreatment: "EXCLUDED",
    });
    const rolling = computeRollingGaBridge(
      {
        gmvCents: 5_000_00,
        showNightGmvCents: 4_000_00,
        postShowGmvCents: 1_000_00,
        orderCount: 10,
        unitCount: 12,
        aovCents: 500_00,
        purchasingFans: 10,
        repeatPurchasers: 2,
        fulfillmentCostCents: 200_00,
        shippingPaidByFanCents: 100_00,
        shippingSubsidizedByArtistCents: 50_00,
        productCostCents: 1_500_00,
        productCostComplete: true,
      },
      {
        platformFeeBasisPoints: 500,
        digitalVenueCommissionTreatment: "EXCLUDED",
        digitalVenueCommissionPercent: null,
      },
    );

    const combined = computeCombinedEconomics(physical, rolling);
    expect(combined.combinedComplete).toBe(true);
    expect(combined.combinedProceedsCents).toBe(
      (physical.estimatedProceedsCents ?? 0) + (rolling.proceedsCents ?? 0),
    );
  });
});

describe("Marisol Brooklyn demo fixture", () => {
  it("defaults digital and physical venue treatment to UNKNOWN", () => {
    expect(MARISOL_BROOKLYN_ECONOMICS_CONFIG.digitalVenueCommissionTreatment).toBe("UNKNOWN");
    expect(MARISOL_BROOKLYN_PHYSICAL_BASELINE.venueCommissionTreatment).toBe("UNKNOWN");
  });

  it("uses representative physical baseline numbers", () => {
    expect(MARISOL_BROOKLYN_PHYSICAL_BASELINE.physicalMerchGmvCents).toBe(18_420_00);
    expect(MARISOL_BROOKLYN_PHYSICAL_BASELINE.unitsBrought).toBe(420);
    expect(MARISOL_BROOKLYN_PHYSICAL_BASELINE.stockoutCount).toBe(34);
  });
});

describe("guided demo integration", () => {
  it("step 2 insights route resolves for Brooklyn", () => {
    const step2 = MARISOL_ARTIST_STUDIO_STEPS[1];
    expect(step2.step).toBe(2);
    expect(step2.title).toMatch(/what sold/i);
    expect(
      resolveArtistGuidedRoute(step2.route, { eventId: MARISOL_BROOKLYN_EVENT_ID, fanId: "fan" }),
    ).toBe(`/studio/insights?event=${MARISOL_BROOKLYN_EVENT_ID}`);
  });

  it("economics route is scoped to Brooklyn event", () => {
    expect(`/studio/insights/economics/${MARISOL_BROOKLYN_EVENT_ID}`).toMatch(
      /evt_marisol_brooklyn$/,
    );
  });

  it("step 6 uses conclusion route with economics summary context", () => {
    const step6 = MARISOL_ARTIST_STUDIO_STEPS[5];
    expect(step6.isConclusion).toBe(true);
    expect(step6.route).toContain("conclusion=1");
  });
});

describe("show economics snapshot", () => {
  it("loads Marisol Brooklyn economics for artist member", async () => {
    const artist = await createArtist("Marisol Test");
    const tour = await createTour(artist.id);
    const venue = await createVenue();
    const event = await createEvent(artist.id, tour.id, venue.id);

    await db().insert(eventShowEconomics).values({
      eventId: event.id,
      platformFeeBasisPoints: MARISOL_BROOKLYN_ECONOMICS_CONFIG.platformFeeBasisPoints,
      digitalVenueCommissionTreatment: "UNKNOWN",
      physicalMerchGmvCents: MARISOL_BROOKLYN_PHYSICAL_BASELINE.physicalMerchGmvCents,
      unitsBrought: MARISOL_BROOKLYN_PHYSICAL_BASELINE.unitsBrought,
      unitsSold: MARISOL_BROOKLYN_PHYSICAL_BASELINE.unitsSold,
      stockoutCount: MARISOL_BROOKLYN_PHYSICAL_BASELINE.stockoutCount,
      physicalVenueCommissionTreatment: "UNKNOWN",
      laborCostCents: MARISOL_BROOKLYN_PHYSICAL_BASELINE.laborCostCents,
      otherPhysicalCostCents: MARISOL_BROOKLYN_PHYSICAL_BASELINE.otherPhysicalCostCents,
      physicalProductCostCents: MARISOL_BROOKLYN_PHYSICAL_BASELINE.physicalProductCostCents,
    });

    const member = await createUser();
    const ctx = authContextFor(member, {
      roles: ["artist_member"],
      memberships: [membershipFor(artist)],
      activeArtistId: artist.id,
    });
    const snapshot = await loadShowEconomicsSnapshot(ctx, artist.id, event.id);

    expect(snapshot).not.toBeNull();
    expect(snapshot!.physical.physicalMerchGmvCents).toBe(18_420_00);
    expect(snapshot!.rollingGa.gmvCents).toBe(0);
    expect(snapshot!.rollingGaBridge.complete).toBe(false);
    expect(snapshot!.physicalComputed.proceedsComplete).toBe(false);
  });

  it("upserts baseline idempotently", async () => {
    const artist = await createArtist();
    const tour = await createTour(artist.id);
    const venue = await createVenue();
    const event = await createEvent(artist.id, tour.id, venue.id);

    const row = {
      eventId: event.id,
      platformFeeBasisPoints: 500,
      digitalVenueCommissionTreatment: "UNKNOWN" as const,
      physicalMerchGmvCents: 5_000_00,
      unitsBrought: 100,
      unitsSold: 80,
      stockoutCount: 5,
      physicalVenueCommissionTreatment: "UNKNOWN" as const,
    };

    await db().insert(eventShowEconomics).values(row);
    await db()
      .insert(eventShowEconomics)
      .values({ ...row, physicalMerchGmvCents: 6_000_00 })
      .onConflictDoUpdate({
        target: eventShowEconomics.eventId,
        set: { physicalMerchGmvCents: 6_000_00 },
      });

    const [stored] = await db()
      .select()
      .from(eventShowEconomics)
      .where(eq(eventShowEconomics.eventId, event.id));

    expect(stored.physicalMerchGmvCents).toBe(6_000_00);
  });
});
