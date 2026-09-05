import { describe, it, expect, vi, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { carts, products } from "@/db/schema";
import {
  aggregateContributions,
  computeContribution,
  consentRate,
  classifyCommerceMoment,
  perAttendeeMetric,
} from "@/lib/insights-economics";
import {
  authContextFor,
  createArtist,
  createEvent,
  createProduct,
  createTour,
  createUser,
  createVariantWithInventory,
  createVerifiedAttendance,
  createVenue,
  db,
  membershipFor,
} from "./helpers";
import { loadEventInsights, loadPilotInsights } from "@/server/studio/insights-queries";
import { createOrderFromCheckout } from "@/server/payments/dev-order";

const getAuthContext = vi.hoisted(() => vi.fn());
vi.mock("@/server/auth/session", () => ({ getAuthContext }));

beforeEach(() => {
  getAuthContext.mockReset();
});

describe("insights economics", () => {
  it("calculates GMV per attendee", () => {
    const result = perAttendeeMetric(450000, 150);
    expect(result.status).toBe("available");
    if (result.status === "available") expect(result.value).toBe(3000);
  });

  it("calculates contribution when all costs exist", () => {
    const result = computeContribution({
      subtotalCents: 10000,
      shippingCarrierCostCents: 800,
      shippingCustomerChargeCents: 500,
      shippingArtistSubsidyCents: 300,
      lines: [{ quantity: 2, unitPriceCents: 5000, unitCostCents: 1500 }],
    });
    expect(result.complete).toBe(true);
    expect(result.contributionCents).toBe(10000 - 3000 - 800 - 300);
  });

  it("marks contribution incomplete when product cost missing", () => {
    const result = computeContribution({
      subtotalCents: 5000,
      shippingCarrierCostCents: 0,
      shippingCustomerChargeCents: 0,
      shippingArtistSubsidyCents: 0,
      lines: [{ quantity: 1, unitPriceCents: 5000, unitCostCents: null }],
    });
    expect(result.complete).toBe(false);
    expect(result.missingInputs).toContain("product cost");
  });

  it("aggregates contribution across orders", () => {
    const result = aggregateContributions([
      {
        subtotalCents: 5000,
        shippingCarrierCostCents: 400,
        shippingCustomerChargeCents: 400,
        shippingArtistSubsidyCents: 0,
        lines: [{ quantity: 1, unitPriceCents: 5000, unitCostCents: 1000 }],
      },
      {
        subtotalCents: 3000,
        shippingCarrierCostCents: 400,
        shippingCustomerChargeCents: 0,
        shippingArtistSubsidyCents: 400,
        lines: [{ quantity: 1, unitPriceCents: 3000, unitCostCents: 800 }],
      },
    ]);
    expect(result.merchRevenueCents).toBe(8000);
    expect(result.complete).toBe(true);
    expect(result.contributionCents).toBe(8000 - 1800 - 800 - 400);
  });

  it("computes consent rate separately from verified attendance", () => {
    const rate = consentRate(25, 100);
    expect(rate.status).toBe("available");
    if (rate.status === "available") expect(rate.value).toBe(0.25);
  });

  it("classifies commerce moments from timestamps", () => {
    const starts = new Date("2027-09-12T20:00:00Z");
    const ends = new Date("2027-09-12T23:00:00Z");
    expect(
      classifyCommerceMoment({
        placedAt: new Date("2027-09-12T18:00:00Z"),
        startsAt: starts,
        endsAt: ends,
        postShowClosesAt: new Date("2027-09-13T07:00:00Z"),
        hasFlashDrop: false,
      }),
    ).toBe("pre_show");
    expect(
      classifyCommerceMoment({
        placedAt: new Date("2027-09-12T21:00:00Z"),
        startsAt: starts,
        endsAt: ends,
        postShowClosesAt: new Date("2027-09-13T07:00:00Z"),
        hasFlashDrop: true,
      }),
    ).toBe("encore_flash");
  });
});

describe("studio insights queries", () => {
  it("loads event insights with commerce attribution", async () => {
    const manager = await createUser();
    const fan = await createUser();
    const artist = await createArtist("Nightfall");
    const tour = await createTour(artist.id);
    const venue = await createVenue();
    const event = await createEvent(artist.id, tour.id, venue.id);

    const physical = await createProduct(artist.id, {
      name: "Tour Tee",
      tourId: tour.id,
      basePriceCents: 4500,
    });
    const variant = await createVariantWithInventory(physical.id, 10);

    await db().insert(products).values({
      artistId: artist.id,
      slug: `digital-${Date.now()}`,
      name: "Live EP Download",
      category: "digital",
      accessType: "public",
      basePriceCents: 999,
      unitCostCents: 200,
      sku: `DIG-${Date.now()}`,
      tourId: tour.id,
      isDigital: true,
      active: true,
    });

    await createVerifiedAttendance(fan.id, event.id);
    await createVerifiedAttendance((await createUser()).id, event.id);

    const [cart] = await db().insert(carts).values({ userId: fan.id }).returning();

    await createOrderFromCheckout({
      userId: fan.id,
      artistId: artist.id,
      eventId: event.id,
      commerceSource: "event_scoped",
      cartId: cart.id,
      lines: [
        {
          productId: physical.id,
          variantId: variant.id,
          name: physical.name,
          quantity: 1,
          unitPriceCents: 4500,
          unitCostCents: 1100,
        },
      ],
      subtotalCents: 4500,
      shippingCarrierCostCents: 600,
      shippingCustomerChargeCents: 0,
      shippingArtistSubsidyCents: 600,
      taxCents: 0,
      totalCents: 4500,
      shippingName: "Test Fan",
      shippingLine1: "123 Main St",
      shippingCity: "Detroit",
      shippingRegion: "MI",
      shippingPostalCode: "48201",
      shippingCountry: "US",
    });

    const ctx = authContextFor(manager, {
      roles: ["artist_member"],
      memberships: [membershipFor(artist, true)],
    });

    const snapshot = await loadEventInsights(ctx, artist.id, event.id);
    expect(snapshot).not.toBeNull();
    expect(snapshot!.fans.verifiedAttendees).toBe(2);
    expect(snapshot!.rollingGa.orderCount).toBe(1);
    expect(snapshot!.rollingGa.eventScopedOrderCount).toBe(1);
    expect(snapshot!.baselineConnected).toBe(false);
    expect(snapshot!.scorecard.merchGmvPerAttendee.status).toBe("available");
  });

  it("blocks cross-artist insights access", async () => {
    const managerB = await createUser();
    const artistA = await createArtist("A");
    const artistB = await createArtist("B");
    const tour = await createTour(artistA.id);
    const venue = await createVenue();
    const event = await createEvent(artistA.id, tour.id, venue.id);

    const ctxB = authContextFor(managerB, {
      roles: ["artist_member"],
      memberships: [membershipFor(artistB, true)],
    });

    const snapshot = await loadEventInsights(ctxB, artistB.id, event.id);
    expect(snapshot).toBeNull();
  });

  it("aggregates pilot cohort across shows", async () => {
    const manager = await createUser();
    const artist = await createArtist();
    const tour = await createTour(artist.id);
    const venue = await createVenue();
    const event1 = await createEvent(artist.id, tour.id, venue.id);
    const event2 = await createEvent(artist.id, tour.id, venue.id);

    await createVerifiedAttendance((await createUser()).id, event1.id);
    await createVerifiedAttendance((await createUser()).id, event2.id);

    const ctx = authContextFor(manager, {
      roles: ["artist_member"],
      memberships: [membershipFor(artist, true)],
    });

    const pilot = await loadPilotInsights(ctx, artist.id, [event1.id, event2.id]);
    expect(pilot?.shows).toHaveLength(2);
    expect(pilot?.baselineConnected).toBe(false);
  });
});
