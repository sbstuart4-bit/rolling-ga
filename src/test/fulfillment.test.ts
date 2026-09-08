/**
 * Phase 5 — Fulfillment + delivery promise.
 */
import { randomUUID } from "node:crypto";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { orderFulfillmentExceptions, orders } from "@/db/schema";
import {
  db as getDb,
  createUser,
  createArtist,
  createVenue,
  createTour,
  createEvent,
  createProduct,
  createVariantWithInventory,
  authContextFor,
  membershipFor,
} from "./helpers";
import {
  aggregateDeliveryPerformance,
  buildFulfillmentTimeline,
  classifyDeliveryPromiseState,
  computePromisedDeliveryAt,
  countFulfillmentPipeline,
  fulfillmentHref,
  isDeliveredWithinPromise,
  resolveFulfillmentStatus,
} from "@/lib/fulfillment";
import { seedBrooklynFulfillment } from "@/db/seed/brooklyn-fulfillment";
import { MARISOL_BROOKLYN_EVENT_ID } from "@/lib/demo-user-ids";
import { getArtistGuidedStep } from "@/lib/artist-guided-demo";
import { fulfillmentHref as hrefFromLib } from "@/lib/fulfillment";
import {
  loadFulfillmentOrderDetail,
  loadShowFulfillmentSnapshot,
} from "@/server/studio/fulfillment-queries";
import { demoNow } from "@/server/demo/clock";

const getAuthContext = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getAuthContext }));

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

describe("fulfillment lifecycle lib", () => {
  it("maps commerce status to fulfillment status when explicit column is null", () => {
    expect(resolveFulfillmentStatus(null, "paid")).toBe("received");
    expect(resolveFulfillmentStatus(null, "picking")).toBe("production");
    expect(resolveFulfillmentStatus(null, "packed")).toBe("packed");
    expect(resolveFulfillmentStatus(null, "shipped")).toBe("shipped");
    expect(resolveFulfillmentStatus(null, "delivered")).toBe("delivered");
    expect(resolveFulfillmentStatus(null, "exception")).toBe("exception");
    expect(resolveFulfillmentStatus(null, "cancelled")).toBeNull();
  });

  it("prefers explicit fulfillment status over commerce mapping", () => {
    expect(resolveFulfillmentStatus("production", "paid")).toBe("production");
  });

  it("counts current-state pipeline buckets", () => {
    const counts = countFulfillmentPipeline([
      "received",
      "production",
      "production",
      "packed",
      "shipped",
      "delivered",
      "delivered",
      "exception",
    ]);
    expect(counts.total).toBe(8);
    expect(counts.received).toBe(1);
    expect(counts.production).toBe(2);
    expect(counts.delivered).toBe(2);
    expect(counts.exception).toBe(1);
  });

  it("builds timeline from persisted timestamps only", () => {
    const placedAt = new Date("2026-06-12T22:00:00Z");
    const timeline = buildFulfillmentTimeline({
      fulfillmentReceivedAt: placedAt,
      productionStartedAt: new Date(placedAt.getTime() + HOUR),
      fulfillmentPackedAt: null,
      fulfillmentShippedAt: null,
      actualDeliveredAt: null,
      placedAt,
    });
    expect(timeline.filter((e) => e.at != null)).toHaveLength(2);
  });
});

describe("delivery promise rules", () => {
  const eventStartsAt = new Date("2026-06-12T20:00:00-04:00");
  const eventEndsAt = new Date("2026-06-12T22:30:00-04:00");

  it("promises show-night orders by 6pm the following day", () => {
    const placedAt = new Date("2026-06-12T21:00:00-04:00");
    const promised = computePromisedDeliveryAt({
      placedAt,
      eventStartsAt,
      eventEndsAt,
      timezone: "America/New_York",
      estimatedDeliveryTo: null,
      estimatedDeliveryFrom: null,
    });
    expect(promised.getHours()).toBe(18);
    expect(promised.getDate()).toBe(13);
  });

  it("uses estimated delivery for post-show orders", () => {
    const placedAt = new Date("2026-06-15T12:00:00-04:00");
    const estimatedTo = new Date("2026-06-22T12:00:00-04:00");
    const promised = computePromisedDeliveryAt({
      placedAt,
      eventStartsAt,
      eventEndsAt,
      timezone: "America/New_York",
      estimatedDeliveryTo: estimatedTo,
      estimatedDeliveryFrom: null,
    });
    expect(promised).toEqual(estimatedTo);
  });

  it("classifies delivered within promise", () => {
    const promised = new Date("2026-06-13T18:00:00-04:00");
    const delivered = new Date("2026-06-13T14:00:00-04:00");
    expect(isDeliveredWithinPromise(promised, delivered)).toBe(true);
    expect(
      classifyDeliveryPromiseState({
        promisedDeliveryAt: promised,
        actualDeliveredAt: delivered,
        placedAt: new Date("2026-06-12T21:00:00-04:00"),
        fulfillmentStatus: "delivered",
        now: demoNow(),
      }),
    ).toBe("delivered_within_promise");
  });

  it("classifies delivered after promise", () => {
    const promised = new Date("2026-06-13T18:00:00-04:00");
    const delivered = new Date("2026-06-14T10:00:00-04:00");
    expect(
      classifyDeliveryPromiseState({
        promisedDeliveryAt: promised,
        actualDeliveredAt: delivered,
        placedAt: new Date("2026-06-12T21:00:00-04:00"),
        fulfillmentStatus: "delivered",
        now: demoNow(),
      }),
    ).toBe("delivered_past_promise");
  });

  it("classifies undelivered at-risk when 75% of window elapsed", () => {
    const placedAt = new Date("2026-06-12T20:00:00Z");
    const promised = new Date(placedAt.getTime() + 4 * DAY);
    const now = new Date(placedAt.getTime() + 3.1 * DAY);
    expect(
      classifyDeliveryPromiseState({
        promisedDeliveryAt: promised,
        actualDeliveredAt: null,
        placedAt,
        fulfillmentStatus: "shipped",
        now,
      }),
    ).toBe("at_risk");
  });

  it("classifies undelivered past promise", () => {
    const placedAt = new Date("2026-06-12T20:00:00Z");
    const promised = new Date(placedAt.getTime() + DAY);
    const now = new Date(promised.getTime() + HOUR);
    expect(
      classifyDeliveryPromiseState({
        promisedDeliveryAt: promised,
        actualDeliveredAt: null,
        placedAt,
        fulfillmentStatus: "production",
        now,
      }),
    ).toBe("past_promise");
  });

  it("computes delivery promise rate from delivered orders only", () => {
    const now = new Date();
    const metrics = aggregateDeliveryPerformance(
      [
        {
          promisedDeliveryAt: new Date(now.getTime() - DAY),
          actualDeliveredAt: new Date(now.getTime() - 2 * DAY),
          placedAt: new Date(now.getTime() - 3 * DAY),
          fulfillmentStatus: "delivered",
          hasOpenException: false,
        },
        {
          promisedDeliveryAt: new Date(now.getTime() - DAY),
          actualDeliveredAt: new Date(now.getTime() + HOUR),
          placedAt: new Date(now.getTime() - 3 * DAY),
          fulfillmentStatus: "delivered",
          hasOpenException: false,
        },
        {
          promisedDeliveryAt: new Date(now.getTime() + DAY),
          actualDeliveredAt: null,
          placedAt: new Date(now.getTime() - 3 * DAY),
          fulfillmentStatus: "shipped",
          hasOpenException: false,
        },
      ],
      now,
    );
    expect(metrics.deliveredCount).toBe(2);
    expect(metrics.deliveredWithinPromise).toBe(1);
    expect(metrics.deliveryPromiseRate).toBe(0.5);
    expect(metrics.atRiskCount).toBe(1);
  });
});

describe("brooklyn fulfillment seed", () => {
  async function brooklynOrdersFixture() {
    const owner = await createUser();
    const venue = await createVenue();
    const artist = await createArtist("Marisol Reyes");
    const tour = await createTour(artist.id);
    const startsAt = new Date("2026-06-12T20:00:00-04:00");
    const endsAt = new Date("2026-06-12T22:30:00-04:00");
    const event = await createEvent(artist.id, tour.id, venue.id, {
      startsAt,
      endsAt,
    });
    const product = await createProduct(artist.id);
    const variant = await createVariantWithInventory(product.id);

    for (let i = 0; i < 12; i++) {
      await getDb().insert(orders).values({
        id: `ord_fulfill_test_${i}`,
        orderNumber: `RG-FUL-${i}`,
        userId: owner.id,
        artistId: artist.id,
        eventId: event.id,
        status: "paid",
        subtotalCents: 3500,
        totalCents: 3500,
        placedAt: new Date(startsAt.getTime() + i * 15 * 60_000),
        isDemo: true,
      });
      await getDb().insert(orderFulfillmentExceptions).values({
        id: `ofx_old_${i}`,
        orderId: `ord_fulfill_test_${i}`,
        type: "other",
        status: "open",
        isDemo: true,
      });
    }

    return { artist, event };
  }

  it("applies deterministic fulfillment idempotently", async () => {
    const { artist, event } = await brooklynOrdersFixture();
    const first = await seedBrooklynFulfillment(getDb(), event.id, artist.id);
    const second = await seedBrooklynFulfillment(getDb(), event.id, artist.id);
    expect(first).toBe(12);
    expect(second).toBe(12);

    const rows = await getDb()
      .select({
        fulfillmentStatus: orders.fulfillmentStatus,
        promisedDeliveryAt: orders.promisedDeliveryAt,
      })
      .from(orders)
      .where(eq(orders.eventId, event.id));

    expect(rows.every((r) => r.fulfillmentStatus != null)).toBe(true);
    expect(rows.every((r) => r.promisedDeliveryAt != null)).toBe(true);
    expect(rows.filter((r) => r.fulfillmentStatus === "delivered").length).toBeGreaterThan(5);
  });
});

describe("show-scoped fulfillment queries", () => {
  beforeEach(() => {
    getAuthContext.mockReset();
  });

  async function scenario() {
    const member = await createUser();
    const fan = await createUser();
    const otherArtist = await createArtist("Other Artist");
    const artist = await createArtist("Marisol Reyes");
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const otherTour = await createTour(otherArtist.id);
    const otherEvent = await createEvent(otherArtist.id, otherTour.id, venue.id);

    const ctx = authContextFor(member, {
      roles: ["artist_member"],
      memberships: [membershipFor(artist)],
      activeArtistId: artist.id,
    });

    const placedAt = new Date();
    const promised = new Date(placedAt.getTime() + 2 * DAY);
    const deliveredAt = new Date(placedAt.getTime() + DAY);
    const orderAId = `ord_${randomUUID()}`;
    const orderBId = `ord_${randomUUID()}`;

    await getDb().insert(orders).values({
      id: orderAId,
      orderNumber: `RG-SCOPE-${orderAId.slice(-6)}`,
      userId: fan.id,
      artistId: artist.id,
      eventId: event.id,
      status: "delivered",
      fulfillmentStatus: "delivered",
      promisedDeliveryAt: promised,
      actualDeliveredAt: deliveredAt,
      fulfillmentReceivedAt: placedAt,
      placedAt,
      subtotalCents: 4000,
      totalCents: 4000,
      isDemo: true,
    });

    await getDb().insert(orders).values({
      id: orderBId,
      orderNumber: `RG-SCOPE-${orderBId.slice(-6)}`,
      userId: fan.id,
      artistId: otherArtist.id,
      eventId: otherEvent.id,
      status: "paid",
      fulfillmentStatus: "received",
      placedAt,
      subtotalCents: 4000,
      totalCents: 4000,
      isDemo: true,
    });

    return { ctx, artist, event, orderAId, orderBId };
  }

  it("loads show-scoped snapshot for authorized artist", async () => {
    const { ctx, artist, event } = await scenario();

    const snapshot = await loadShowFulfillmentSnapshot(ctx, artist.id, event.id);
    expect(snapshot).not.toBeNull();
    expect(snapshot!.orders).toHaveLength(1);
    expect(snapshot!.pipeline.delivered).toBe(1);
    expect(snapshot!.performance.deliveredWithinPromise).toBe(1);
  });

  it("denies cross-artist order detail access", async () => {
    const { ctx, artist, orderBId } = await scenario();

    const detail = await loadFulfillmentOrderDetail(ctx, artist.id, orderBId);
    expect(detail).toBeNull();
  });

  it("loads order detail for authorized artist", async () => {
    const { ctx, artist, orderAId } = await scenario();
    const detail = await loadFulfillmentOrderDetail(ctx, artist.id, orderAId);
    expect(detail?.orderId).toBe(orderAId);
    expect(detail?.timeline.some((e) => e.at != null)).toBe(true);
  });
});

describe("guided demo fulfillment integration", () => {
  it("step 2 fulfillment href targets Brooklyn orders", () => {
    expect(fulfillmentHref(MARISOL_BROOKLYN_EVENT_ID)).toBe(
      `/studio/orders?event=${MARISOL_BROOKLYN_EVENT_ID}`,
    );
    expect(hrefFromLib(MARISOL_BROOKLYN_EVENT_ID)).toContain("/studio/orders");
  });

  it("step 6 remains conclusion route on insights", () => {
    const step6 = getArtistGuidedStep("marisol-artist-studio", 6)!;
    expect(step6.route).toContain("conclusion=1");
    expect(step6.isConclusion).toBe(true);
  });
});

describe("exception model", () => {
  it("stores open and resolved exceptions", async () => {
    const fan = await createUser();
    const member = await createUser();
    const artist = await createArtist("Test");
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const orderId = `ord_${randomUUID()}`;

    await getDb().insert(orders).values({
      id: orderId,
      orderNumber: `RG-EX-${orderId.slice(-6)}`,
      userId: fan.id,
      artistId: artist.id,
      eventId: event.id,
      status: "exception",
      fulfillmentStatus: "exception",
      subtotalCents: 3000,
      totalCents: 3000,
      placedAt: new Date(),
      isDemo: true,
    });

    await getDb().insert(orderFulfillmentExceptions).values({
      id: `ofx_${randomUUID()}`,
      orderId,
      type: "address_issue",
      status: "open",
      note: "Invalid zip",
      isDemo: true,
    });

    const ctx = authContextFor(member, {
      roles: ["artist_member"],
      memberships: [membershipFor(artist)],
      activeArtistId: artist.id,
    });
    const snapshot = await loadShowFulfillmentSnapshot(ctx, artist.id, event.id);
    expect(snapshot?.openExceptions).toHaveLength(1);
    expect(snapshot?.openExceptions[0]?.type).toBe("address_issue");
  });
});

describe("fan order ownership", () => {
  it("getOrder scopes to fan user id", async () => {
    const fanA = await createUser();
    const fanB = await createUser();
    const artist = await createArtist("Fan scope");
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const orderId = `ord_${randomUUID()}`;

    await getDb().insert(orders).values({
      id: orderId,
      orderNumber: `RG-FAN-${orderId.slice(-6)}`,
      userId: fanA.id,
      artistId: artist.id,
      eventId: event.id,
      status: "shipped",
      fulfillmentStatus: "shipped",
      subtotalCents: 2500,
      totalCents: 2500,
      placedAt: new Date(),
      isDemo: true,
    });

    const { getOrder } = await import("@/server/commerce/queries");
    expect(await getOrder(orderId, fanA.id)).not.toBeNull();
    expect(await getOrder(orderId, fanB.id)).toBeNull();
  });
});
