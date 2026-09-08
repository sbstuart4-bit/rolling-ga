/**
 * Ops Phase 1 — Show command center.
 */
import { randomUUID } from "node:crypto";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { events, orders, userRoles, users } from "@/db/schema";
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
  compareAttentionItems,
  computeAttentionPriority,
  deriveShowOperationalHealth,
  deriveShowOperationalState,
  formatShowTimingLabel,
  isShowRelevant,
  promiseStatePriority,
} from "@/lib/ops";
import { countFulfillmentPipeline, aggregateDeliveryPerformance } from "@/lib/fulfillment";
import { MARISOL_BROOKLYN_EVENT_ID } from "@/lib/demo-user-ids";
import { seedBrooklynFulfillment } from "@/db/seed/brooklyn-fulfillment";
import { seedNashvilleFulfillment } from "@/db/seed/nashville-fulfillment";
import {
  loadOpsCommandCenter,
  loadOpsFulfillmentOrderDetail,
  reconcileOpsWithStudioBrooklyn,
} from "@/server/ops/fulfillment-queries";
import { loadShowFulfillmentSnapshot } from "@/server/studio/fulfillment-queries";
import { setDemoClockToDate } from "@/server/demo/clock";
import { demoCalendarDate } from "@/lib/demo-calendar";

const getAuthContext = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getAuthContext }));

describe("ops show state + health", () => {
  const now = demoCalendarDate(6, 13, 10, 0);
  const startsAt = demoCalendarDate(6, 12, 20, 0);
  const endsAt = demoCalendarDate(6, 12, 22, 30);

  it("derives live state during show window", () => {
    const liveNow = demoCalendarDate(6, 12, 21, 0);
    const pipeline = countFulfillmentPipeline(["received", "production"]);
    const performance = aggregateDeliveryPerformance(
      [
        {
          promisedDeliveryAt: demoCalendarDate(6, 13, 18, 0),
          actualDeliveredAt: null,
          placedAt: demoCalendarDate(6, 12, 21, 0),
          fulfillmentStatus: "received",
          hasOpenException: false,
        },
      ],
      liveNow,
    );

    expect(
      deriveShowOperationalState({
        startsAt,
        endsAt,
        now: liveNow,
        pipeline,
        performance,
        orderCount: 1,
      }),
    ).toBe("live");
  });

  it("derives fulfilling after show with incomplete pipeline", () => {
    const pipeline = countFulfillmentPipeline(["shipped", "delivered", "delivered"]);
    const performance = aggregateDeliveryPerformance(
      [
        {
          promisedDeliveryAt: demoCalendarDate(6, 13, 18, 0),
          actualDeliveredAt: null,
          placedAt: demoCalendarDate(6, 12, 21, 0),
          fulfillmentStatus: "shipped",
          hasOpenException: false,
        },
      ],
      now,
    );

    expect(
      deriveShowOperationalState({
        startsAt,
        endsAt,
        now,
        pipeline,
        performance,
        orderCount: 3,
      }),
    ).toBe("fulfilling");
  });

  it("derives at_risk when past promise exists", () => {
    const pipeline = countFulfillmentPipeline(["production", "shipped"]);
    const performance = {
      deliveredCount: 0,
      deliveredWithinPromise: 0,
      deliveredPastPromise: 0,
      atRiskCount: 0,
      pastPromiseCount: 2,
      openExceptions: 0,
      deliveryPromiseRate: null,
    };

    expect(
      deriveShowOperationalState({
        startsAt,
        endsAt,
        now,
        pipeline,
        performance,
        orderCount: 2,
      }),
    ).toBe("at_risk");
  });

  it("derives complete when pipeline finished", () => {
    const pipeline = countFulfillmentPipeline(["delivered", "delivered"]);
    const performance = aggregateDeliveryPerformance([], now);

    expect(
      deriveShowOperationalState({
        startsAt,
        endsAt,
        now,
        pipeline,
        performance,
        orderCount: 2,
      }),
    ).toBe("complete");
  });

  it("derives health action_needed for past promise", () => {
    expect(
      deriveShowOperationalHealth({
        deliveredCount: 0,
        deliveredWithinPromise: 0,
        deliveredPastPromise: 0,
        atRiskCount: 0,
        pastPromiseCount: 1,
        openExceptions: 0,
        deliveryPromiseRate: null,
      }),
    ).toBe("action_needed");
  });

  it("derives health watch for at-risk only", () => {
    expect(
      deriveShowOperationalHealth({
        deliveredCount: 0,
        deliveredWithinPromise: 0,
        deliveredPastPromise: 0,
        atRiskCount: 3,
        pastPromiseCount: 0,
        openExceptions: 0,
        deliveryPromiseRate: null,
      }),
    ).toBe("watch");
  });

  it("formats timing labels from clock", () => {
    const label = formatShowTimingLabel({
      startsAt,
      endsAt,
      now,
      operationalState: "fulfilling",
    });
    expect(label).toMatch(/Show ended/i);
  });
});

describe("ops prioritization", () => {
  it("ranks past promise above at risk", () => {
    expect(promiseStatePriority("past_promise")).toBeLessThan(promiseStatePriority("at_risk"));
  });

  it("prioritizes open exceptions highly", () => {
    expect(
      computeAttentionPriority({
        promiseState: "within_promise",
        hasOpenException: true,
        fulfillmentStatus: "production",
      }),
    ).toBe(1);
  });

  it("sorts by priority then promise deadline", () => {
    const sorted = [
      {
        orderId: "b",
        orderNumber: "B",
        artistName: "A",
        showLabel: "S",
        eventId: "e",
        reasonLabel: "At risk",
        promiseState: "at_risk" as const,
        promisedDeliveryAt: new Date("2026-06-14T18:00:00"),
        fulfillmentStatus: "production" as const,
        hasOpenException: false,
        exceptionType: null,
        exceptionId: null,
        openedAt: null,
        priority: 2,
      },
      {
        orderId: "a",
        orderNumber: "A",
        artistName: "A",
        showLabel: "S",
        eventId: "e",
        reasonLabel: "Past promise",
        promiseState: "past_promise" as const,
        promisedDeliveryAt: new Date("2026-06-15T18:00:00"),
        fulfillmentStatus: "production" as const,
        hasOpenException: false,
        exceptionType: null,
        exceptionId: null,
        openedAt: null,
        priority: 0,
      },
    ].sort(compareAttentionItems);

    expect(sorted[0].orderId).toBe("a");
  });
});

describe("ops authorization + data", () => {
  beforeEach(() => {
    getAuthContext.mockReset();
    setDemoClockToDate(demoCalendarDate(6, 13, 10, 0));
  });

  it("denies artist member from ops command center", async () => {
    const member = await createUser();
    const artist = await createArtist("Ops Blocked Artist");
    const ctx = authContextFor(member, {
      roles: ["artist_member"],
      memberships: [membershipFor(artist)],
      activeArtistId: artist.id,
    });

    await expect(loadOpsCommandCenter(ctx)).rejects.toThrow(/Ops access denied/);
  });

  it("allows fulfillment operator cross-artist access", async () => {
    const artistA = await createArtist("Ops Artist A");
    const artistB = await createArtist("Ops Artist B");
    const venue = await createVenue();
    const tourA = await createTour(artistA.id);
    const tourB = await createTour(artistB.id);
    const eventA = await createEvent(artistA.id, tourA.id, venue.id, {
      startsAt: demoCalendarDate(6, 12, 20, 0),
      endsAt: demoCalendarDate(6, 12, 22, 30),
    });
    await createEvent(artistB.id, tourB.id, venue.id, {
      startsAt: demoCalendarDate(6, 12, 20, 0),
      endsAt: demoCalendarDate(6, 12, 22, 30),
    });

    const fan = await createUser();
    const orderId = `ord_ops_${randomUUID()}`;
    await getDb().insert(orders).values({
      id: orderId,
      artistId: artistA.id,
      userId: fan.id,
      eventId: eventA.id,
      orderNumber: "RGA-OPS-001",
      status: "paid",
      fulfillmentStatus: "production",
      placedAt: demoCalendarDate(6, 12, 21, 0),
      promisedDeliveryAt: demoCalendarDate(6, 13, 18, 0),
      subtotalCents: 5000,
      totalCents: 5000,
      shippingName: "Test Fan",
      isDemo: true,
    });

    const opsUser = await createUser();
    await getDb().insert(userRoles).values({ userId: opsUser.id, role: "fulfillment_operator" });
    const opsCtx = authContextFor(opsUser, { roles: ["fulfillment_operator"] });

    const snapshot = await loadOpsCommandCenter(opsCtx);
    expect(snapshot.shows.some((s) => s.eventId === eventA.id)).toBe(true);
  });

  it("reconciles Marisol Brooklyn with Studio fulfillment snapshot", async () => {
    const member = await createUser();
    const fan = await createUser();
    const artist = await createArtist("Marisol Reyes");
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    await getDb().insert(events).values({
      id: MARISOL_BROOKLYN_EVENT_ID,
      artistId: artist.id,
      tourId: tour.id,
      venueId: venue.id,
      slug: "marisol-brooklyn-ops-test",
      startsAt: demoCalendarDate(6, 12, 20, 0),
      endsAt: demoCalendarDate(6, 12, 22, 30),
      timezone: "America/New_York",
    });

    for (let i = 0; i < 5; i++) {
      await getDb().insert(orders).values({
        id: `ord_bk_ops_${i}`,
        artistId: artist.id,
        userId: fan.id,
        eventId: MARISOL_BROOKLYN_EVENT_ID,
        orderNumber: `RGA-BK-${i}`,
        status: "paid",
        placedAt: demoCalendarDate(6, 12, 21, i * 5),
        subtotalCents: 4500,
        totalCents: 4500,
        shippingName: "Fan",
        isDemo: true,
      });
    }

    await seedBrooklynFulfillment(getDb(), MARISOL_BROOKLYN_EVENT_ID, artist.id);

    const opsUser = await createUser();
    await getDb().insert(userRoles).values({ userId: opsUser.id, role: "rga_admin" });
    const opsCtx = authContextFor(opsUser, { roles: ["rga_admin"] });
    const artistCtx = authContextFor(member, {
      roles: ["artist_member"],
      memberships: [membershipFor(artist)],
      activeArtistId: artist.id,
    });

    const studio = await loadShowFulfillmentSnapshot(artistCtx, artist.id, MARISOL_BROOKLYN_EVENT_ID);
    expect(studio).not.toBeNull();

    const reconciled = await reconcileOpsWithStudioBrooklyn(
      opsCtx,
      artist.id,
      MARISOL_BROOKLYN_EVENT_ID,
      studio!,
    );
    expect(reconciled).toBe(true);
  });

  it("seeds Nashville fulfillment idempotently", async () => {
    const artist = await createArtist("Nova");
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id, {
      startsAt: demoCalendarDate(6, 12, 20, 0),
      endsAt: demoCalendarDate(6, 12, 22, 30),
    });
    const fan = await createUser();
    await getDb().insert(orders).values({
      id: `ord_nv_${randomUUID()}`,
      artistId: artist.id,
      userId: fan.id,
      eventId: event.id,
      orderNumber: "RGA-NV-1",
      status: "paid",
      placedAt: demoCalendarDate(6, 12, 23, 0),
      subtotalCents: 3000,
      totalCents: 3000,
      shippingName: "Fan",
      isDemo: true,
    });

    expect(await seedNashvilleFulfillment(getDb(), event.id, artist.id)).toBe(1);
    expect(await seedNashvilleFulfillment(getDb(), event.id, artist.id)).toBe(1);
  });

  it("loads ops order detail for authorized operator", async () => {
    const artist = await createArtist("Detail Artist");
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const fan = await createUser();
    const orderId = `ord_detail_${randomUUID()}`;

    await getDb().insert(orders).values({
      id: orderId,
      artistId: artist.id,
      userId: fan.id,
      eventId: event.id,
      orderNumber: "RGA-DETAIL-1",
      status: "paid",
      fulfillmentStatus: "received",
      placedAt: demoCalendarDate(6, 12, 21, 0),
      subtotalCents: 5000,
      totalCents: 5000,
      shippingName: "Detail Fan",
      isDemo: true,
    });

    const opsUser = await createUser();
    await getDb().insert(userRoles).values({ userId: opsUser.id, role: "fulfillment_operator" });
    const detail = await loadOpsFulfillmentOrderDetail(
      authContextFor(opsUser, { roles: ["fulfillment_operator"] }),
      orderId,
    );
    expect(detail?.orderNumber).toBe("RGA-DETAIL-1");
  });
});

describe("relevant show selection", () => {
  it("includes shows with incomplete fulfillment after end", () => {
    const now = demoCalendarDate(6, 13, 10, 0);
    const startsAt = demoCalendarDate(6, 12, 20, 0);
    const endsAt = demoCalendarDate(6, 12, 22, 30);
    const pipeline = countFulfillmentPipeline(["shipped"]);

    expect(
      isShowRelevant({
        startsAt,
        endsAt,
        now,
        orderCount: 10,
        pipeline,
      }),
    ).toBe(true);
  });
});
