import { describe, it, expect, vi, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { artistMembers, drops, orderItems, orders } from "@/db/schema";
import {
  attributeOrderToEvent,
  resolveLineEventAttribution,
  sumAttributedGmv,
} from "@/lib/fan-attribution";
import {
  authContextFor,
  createArtist,
  createConsent,
  createDrop,
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
import {
  loadFanRelationshipMetrics,
  loadFanRelationshipProfile,
  loadShowCohortMetrics,
} from "@/server/studio/fan-relationship-queries";

const getAuthContext = vi.hoisted(() => vi.fn());
vi.mock("@/server/auth/session", () => ({ getAuthContext }));

beforeEach(() => {
  getAuthContext.mockReset();
});

function eventWindow(starts: Date, ends: Date) {
  return {
    eventId: "evt",
    startsAt: starts,
    endsAt: ends,
    postShowClosesAt: new Date(ends.getTime() + 8 * 60 * 60_000),
  };
}

describe("fan attribution", () => {
  const starts = new Date("2027-09-12T20:00:00Z");
  const ends = new Date("2027-09-12T23:00:00Z");
  const verified = new Set(["evt"]);

  it("attributes show-night purchase via event-scoped order and drop link", () => {
    const order = {
      orderId: "ord_1",
      orderEventId: "evt",
      placedAt: new Date("2027-09-12T21:00:00Z"),
      commerceSource: "event_scoped",
      lines: [{ dropId: "drp", dropEventId: "evt", lineTotalCents: 5500 }],
    };
    const attributed = attributeOrderToEvent(order, eventWindow(starts, ends), verified);
    expect(sumAttributedGmv(attributed, "show_night")).toBe(5500);
    expect(sumAttributedGmv(attributed, "post_show")).toBe(0);
  });

  it("attributes post-show purchase via drop event link", () => {
    const order = {
      orderId: "ord_2",
      orderEventId: "evt",
      placedAt: new Date("2027-12-10T18:00:00Z"),
      commerceSource: "event_scoped",
      lines: [{ dropId: "drp_ann", dropEventId: "evt", lineTotalCents: 7000 }],
    };
    const attributed = attributeOrderToEvent(order, eventWindow(starts, ends), verified);
    expect(sumAttributedGmv(attributed, "post_show")).toBe(7000);
  });

  it("leaves generic later purchase unattributed to the show", () => {
    const order = {
      orderId: "ord_3",
      orderEventId: null,
      placedAt: new Date("2027-12-20T12:00:00Z"),
      commerceSource: "generic",
      lines: [{ dropId: null, dropEventId: null, lineTotalCents: 4500 }],
    };
    const attributed = attributeOrderToEvent(order, eventWindow(starts, ends), verified);
    expect(sumAttributedGmv(attributed)).toBe(0);
    expect(resolveLineEventAttribution(order, order.lines[0], verified)).toBeNull();
  });

  it("does not attribute order with event_id but no drop or event_scoped source", () => {
    const order = {
      orderId: "ord_4",
      orderEventId: "evt",
      placedAt: new Date("2027-09-12T21:00:00Z"),
      commerceSource: "generic",
      lines: [{ dropId: null, dropEventId: null, lineTotalCents: 3000 }],
    };
    expect(resolveLineEventAttribution(order, order.lines[0], verified)).toBeNull();
  });
});

describe("studio fan relationship queries", () => {
  async function seedShowCommerce(opts: {
    fanId: string;
    artistId: string;
    managerId: string;
    showNightCents?: number;
    postShowCents?: number;
    genericCents?: number;
    withConsent?: boolean;
  }) {
    const venue = await createVenue();
    const tour = await createTour(opts.artistId);
    const starts = new Date("2027-09-12T20:00:00Z");
    const ends = new Date("2027-09-12T23:00:00Z");
    const event = await createEvent(opts.artistId, tour.id, venue.id, { startsAt: starts, endsAt: ends });
    await createVerifiedAttendance(opts.fanId, event.id);

    if (opts.withConsent !== false) {
      await createConsent(opts.fanId, opts.artistId, "attendee_offers");
    }

    await db().insert(artistMembers).values({
      userId: opts.managerId,
      artistId: opts.artistId,
      role: "management",
      canPublish: true,
    });

    const product = await createProduct(opts.artistId, { basePriceCents: 5500, eventId: event.id });
    const variant = await createVariantWithInventory(product.id);
    const drop = await createDrop(opts.artistId, { eventId: event.id, startsAt: starts, endsAt: ends });

    if (opts.showNightCents) {
      const [order] = await db()
        .insert(orders)
        .values({
          orderNumber: `RG-${Date.now()}-SN`,
          userId: opts.fanId,
          artistId: opts.artistId,
          eventId: event.id,
          commerceSource: "event_scoped",
          status: "paid",
          subtotalCents: opts.showNightCents,
          taxCents: 0,
          shippingCarrierCostCents: 0,
          shippingCustomerChargeCents: 0,
          shippingArtistSubsidyCents: 0,
          totalCents: opts.showNightCents,
          placedAt: new Date("2027-09-12T21:00:00Z"),
        })
        .returning();
      await db().insert(orderItems).values({
        orderId: order.id,
        productId: product.id,
        variantId: variant.id,
        dropId: drop.id,
        nameSnapshot: "Show tee",
        quantity: 1,
        unitPriceCents: opts.showNightCents,
        totalCents: opts.showNightCents,
      });
    }

    if (opts.postShowCents) {
      const [order] = await db()
        .insert(orders)
        .values({
          orderNumber: `RG-${Date.now()}-PS`,
          userId: opts.fanId,
          artistId: opts.artistId,
          eventId: event.id,
          commerceSource: "event_scoped",
          status: "paid",
          subtotalCents: opts.postShowCents,
          taxCents: 0,
          shippingCarrierCostCents: 0,
          shippingCustomerChargeCents: 0,
          shippingArtistSubsidyCents: 0,
          totalCents: opts.postShowCents,
          placedAt: new Date("2027-12-10T18:00:00Z"),
        })
        .returning();
      await db().insert(orderItems).values({
        orderId: order.id,
        productId: product.id,
        variantId: variant.id,
        dropId: drop.id,
        nameSnapshot: "Anniversary hoodie",
        quantity: 1,
        unitPriceCents: opts.postShowCents,
        totalCents: opts.postShowCents,
      });
    }

    if (opts.genericCents) {
      const genericProduct = await createProduct(opts.artistId, { basePriceCents: opts.genericCents });
      const genericVariant = await createVariantWithInventory(genericProduct.id);
      const [order] = await db()
        .insert(orders)
        .values({
          orderNumber: `RG-${Date.now()}-GN`,
          userId: opts.fanId,
          artistId: opts.artistId,
          eventId: null,
          commerceSource: "generic",
          status: "paid",
          subtotalCents: opts.genericCents,
          taxCents: 0,
          shippingCarrierCostCents: 0,
          shippingCustomerChargeCents: 0,
          shippingArtistSubsidyCents: 0,
          totalCents: opts.genericCents,
          placedAt: new Date("2028-01-05T12:00:00Z"),
        })
        .returning();
      await db().insert(orderItems).values({
        orderId: order.id,
        productId: genericProduct.id,
        variantId: genericVariant.id,
        nameSnapshot: "Generic tee",
        quantity: 1,
        unitPriceCents: opts.genericCents,
        totalCents: opts.genericCents,
      });
    }

    await db()
      .update(drops)
      .set({ eventId: event.id })
      .where(eq(drops.id, drop.id));

    return { event, tour, venue };
  }

  it("blocks fan profile without attendee_offers consent", async () => {
    const manager = await createUser();
    const fan = await createUser();
    const artist = await createArtist();
    const { event } = await seedShowCommerce({
      fanId: fan.id,
      artistId: artist.id,
      managerId: manager.id,
      showNightCents: 5500,
      withConsent: false,
    });

    getAuthContext.mockResolvedValue(
      authContextFor(manager, { memberships: [membershipFor(artist)], activeArtistId: artist.id }),
    );

    const profile = await loadFanRelationshipProfile(
      authContextFor(manager, { memberships: [membershipFor(artist)], activeArtistId: artist.id }),
      artist.id,
      fan.id,
    );
    expect(profile).toBeNull();
    void event;
  });

  it("calculates observed fan value with attributed show-night and post-show GMV", async () => {
    const manager = await createUser();
    const fan = await createUser();
    const artist = await createArtist();

    await seedShowCommerce({
      fanId: fan.id,
      artistId: artist.id,
      managerId: manager.id,
      showNightCents: 5500,
      postShowCents: 7000,
    });

    const ctx = authContextFor(manager, {
      memberships: [membershipFor(artist)],
      activeArtistId: artist.id,
    });

    const profile = await loadFanRelationshipProfile(ctx, artist.id, fan.id);
    expect(profile).not.toBeNull();
    expect(profile!.observedValue.showNightGmvCents).toBe(5500);
    expect(profile!.observedValue.postShowGmvCents).toBe(7000);
    expect(profile!.observedValue.totalObservedGmvCents).toBe(12500);
    expect(profile!.observedValue.orderCount).toBe(2);
  });

  it("excludes unattributed generic purchases from observed show value", async () => {
    const manager = await createUser();
    const fan = await createUser();
    const artist = await createArtist();

    await seedShowCommerce({
      fanId: fan.id,
      artistId: artist.id,
      managerId: manager.id,
      showNightCents: 5500,
      genericCents: 4500,
    });

    const ctx = authContextFor(manager, {
      memberships: [membershipFor(artist)],
      activeArtistId: artist.id,
    });

    const profile = await loadFanRelationshipProfile(ctx, artist.id, fan.id);
    expect(profile!.observedValue.totalObservedGmvCents).toBe(5500);
    expect(profile!.observedValue.unattributedGmvCents).toBe(4500);
  });

  it("enforces artist isolation on fan profile", async () => {
    const manager = await createUser();
    const fan = await createUser();
    const artistA = await createArtist("Artist A");
    const artistB = await createArtist("Artist B");

    await seedShowCommerce({
      fanId: fan.id,
      artistId: artistA.id,
      managerId: manager.id,
      showNightCents: 5500,
    });

    await db().insert(artistMembers).values({
      userId: manager.id,
      artistId: artistB.id,
      role: "management",
      canPublish: true,
    });

    const ctx = authContextFor(manager, {
      memberships: [membershipFor(artistB)],
      activeArtistId: artistB.id,
    });

    const profile = await loadFanRelationshipProfile(ctx, artistB.id, fan.id);
    expect(profile).toBeNull();
  });

  it("computes cohort metrics with repeat purchase rate", async () => {
    const manager = await createUser();
    const fan = await createUser();
    const artist = await createArtist();

    const { event } = await seedShowCommerce({
      fanId: fan.id,
      artistId: artist.id,
      managerId: manager.id,
      showNightCents: 5500,
      postShowCents: 7000,
    });

    const ctx = authContextFor(manager, {
      memberships: [membershipFor(artist)],
      activeArtistId: artist.id,
    });

    const cohort = await loadShowCohortMetrics(ctx, artist.id, event.id);
    expect(cohort).not.toBeNull();
    expect(cohort!.originalVerifiedAttendees).toBe(1);
    expect(cohort!.showNightGmvCents).toBe(5500);
    expect(cohort!.postShowGmv90DaysCents).toBe(7000);
    expect(cohort!.totalObservedGmvCents).toBe(12500);
    expect(cohort!.repeatPurchaseRate).toBe(1);
    expect(cohort!.observedGmvPerVerifiedFanCents).toBe(12500);
  });

  it("loads aggregate relationship metrics for connected repeat purchasers", async () => {
    const manager = await createUser();
    const fan = await createUser();
    const artist = await createArtist();

    await seedShowCommerce({
      fanId: fan.id,
      artistId: artist.id,
      managerId: manager.id,
      showNightCents: 5500,
      postShowCents: 7000,
    });

    const ctx = authContextFor(manager, {
      memberships: [membershipFor(artist)],
      activeArtistId: artist.id,
    });

    const metrics = await loadFanRelationshipMetrics(ctx, artist.id);
    expect(metrics.verifiedFans).toBe(1);
    expect(metrics.connectedFans).toBe(1);
    expect(metrics.purchasingFans).toBe(1);
    expect(metrics.repeatPurchasers).toBe(1);
    expect(metrics.postShowGmvCents).toBe(7000);
  });
});
