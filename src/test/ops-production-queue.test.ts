/**
 * Ops Phase 2 — Production queue.
 */
import { randomUUID } from "node:crypto";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import {
  events,
  orderFulfillmentExceptions,
  orderItems,
  orders,
  productionWork,
  products,
  userRoles,
} from "@/db/schema";
import { seedBrooklynFulfillment } from "@/db/seed/brooklyn-fulfillment";
import { seedProductionWorkForEvent } from "@/db/seed/production-work";
import { seedNashvilleFulfillment } from "@/db/seed/nashville-fulfillment";
import {
  aggregateVariantGroups,
  compareProductionPriority,
  computeProductionPriority,
  deriveOrderProductionStatus,
  isOrderProductionComplete,
  ordersBlockedByEvent,
  requiresProductionWork,
  resolveProductionRequirementMode,
} from "@/lib/production";
import { MARISOL_BROOKLYN_EVENT_ID } from "@/lib/demo-user-ids";
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
  loadProductionQueue,
  loadOrderProductionStatus,
  loadShowProductionSummary,
} from "@/server/ops/production-queries";
import {
  completeProductionAction,
  startProductionAction,
} from "@/server/ops/production-actions";
import { loadOpsCommandCenter } from "@/server/ops/fulfillment-queries";
import { setDemoClockToDate } from "@/server/demo/clock";
import { demoCalendarDate } from "@/lib/demo-calendar";

const getAuthContext = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getAuthContext }));

async function opsContext() {
  const opsUser = await createUser();
  await getDb().insert(userRoles).values({ userId: opsUser.id, role: "fulfillment_operator" });
  const ctx = authContextFor(opsUser, { roles: ["fulfillment_operator"] });
  getAuthContext.mockResolvedValue(ctx);
  return ctx;
}

async function seedMinimalProductionOrder(input: {
  eventId: string;
  artistId: string;
  orderId: string;
  itemId: string;
  productId: string;
  quantity: number;
  fulfillmentStatus: "received" | "production";
  promisedDeliveryAt: Date;
}) {
  const fan = await createUser();
  await getDb().insert(products).values({
    id: input.productId,
    artistId: input.artistId,
    slug: input.productId,
    name: "Test Tee",
    category: "apparel",
    basePriceCents: 3500,
    sku: input.productId,
    isDigital: false,
  });

  await getDb().insert(orders).values({
    id: input.orderId,
    artistId: input.artistId,
    userId: fan.id,
    eventId: input.eventId,
    orderNumber: `RGA-${input.orderId}`,
    status: "paid",
    fulfillmentStatus: input.fulfillmentStatus,
    placedAt: demoCalendarDate(6, 12, 21, 0),
    promisedDeliveryAt: input.promisedDeliveryAt,
    subtotalCents: 3500 * input.quantity,
    totalCents: 3500 * input.quantity,
    shippingName: "Test Fan",
    isDemo: true,
  });

  await getDb().insert(orderItems).values({
    id: input.itemId,
    orderId: input.orderId,
    productId: input.productId,
    nameSnapshot: "Test Tee",
    sizeSnapshot: "M",
    quantity: input.quantity,
    unitPriceCents: 3500,
    totalCents: 3500 * input.quantity,
  });

  await seedProductionWorkForEvent(getDb(), input.eventId, input.artistId);
}

async function attachPhysicalLine(input: {
  orderId: string;
  artistId: string;
  itemId: string;
  productId: string;
  quantity: number;
}) {
  await getDb().insert(products).values({
    id: input.productId,
    artistId: input.artistId,
    slug: input.productId,
    name: "Show Tee",
    category: "apparel",
    basePriceCents: 3500,
    sku: input.productId,
    isDigital: false,
  });

  await getDb().insert(orderItems).values({
    id: input.itemId,
    orderId: input.orderId,
    productId: input.productId,
    nameSnapshot: "Show Tee",
    sizeSnapshot: "M",
    quantity: input.quantity,
    unitPriceCents: 3500,
    totalCents: 3500 * input.quantity,
  });
}

describe("production requirement mode", () => {
  it("treats digital products as stocked", () => {
    expect(resolveProductionRequirementMode(true)).toBe("stocked");
    expect(requiresProductionWork("stocked")).toBe(false);
  });

  it("treats physical products as on demand", () => {
    expect(resolveProductionRequirementMode(false)).toBe("on_demand");
    expect(requiresProductionWork("on_demand")).toBe(true);
  });
});

describe("production priority", () => {
  const queuedAt = demoCalendarDate(6, 12, 21, 0);

  it("ranks past promise above at risk", () => {
    const past = computeProductionPriority({
      promiseState: "past_promise",
      hasProductionException: false,
      promisedDeliveryAt: demoCalendarDate(6, 12, 18, 0),
      queuedAt,
    });
    const atRisk = computeProductionPriority({
      promiseState: "at_risk",
      hasProductionException: false,
      promisedDeliveryAt: demoCalendarDate(6, 13, 18, 0),
      queuedAt,
    });
    expect(
      compareProductionPriority(
        {
          priority: past.priority,
          promisedDeliveryAt: demoCalendarDate(6, 12, 18, 0),
          queuedAt,
        },
        {
          priority: atRisk.priority,
          promisedDeliveryAt: demoCalendarDate(6, 13, 18, 0),
          queuedAt,
        },
      ),
    ).toBeLessThan(0);
  });

  it("ranks production exceptions above normal queue", () => {
    const exception = computeProductionPriority({
      promiseState: "within_promise",
      hasProductionException: true,
      promisedDeliveryAt: demoCalendarDate(6, 14, 18, 0),
      queuedAt,
    });
    const normal = computeProductionPriority({
      promiseState: "within_promise",
      hasProductionException: false,
      promisedDeliveryAt: demoCalendarDate(6, 14, 18, 0),
      queuedAt,
    });
    expect(exception.priority).toBeLessThan(normal.priority);
    expect(exception.label).toMatch(/Production delay/i);
  });
});

describe("order production completeness", () => {
  it("requires every unit when quantity > 1", () => {
    const rows = [
      { orderItemId: "a", productName: "Tee", size: "M", status: "complete" as const, requirementMode: "on_demand" as const },
      { orderItemId: "a", productName: "Tee", size: "M", status: "queued" as const, requirementMode: "on_demand" as const },
    ];
    expect(isOrderProductionComplete(rows)).toBe(false);
    const status = deriveOrderProductionStatus(rows, "production");
    expect(status.lines[0].completeUnits).toBe(1);
    expect(status.lines[0].requiredUnits).toBe(2);
    expect(status.readyToPack).toBe(false);
  });

  it("derives ready to pack when all units complete", () => {
    const rows = [
      { orderItemId: "a", productName: "Tee", size: "M", status: "complete" as const, requirementMode: "on_demand" as const },
      { orderItemId: "a", productName: "Tee", size: "M", status: "complete" as const, requirementMode: "on_demand" as const },
    ];
    const status = deriveOrderProductionStatus(rows, "production");
    expect(status.readyToPack).toBe(true);
    expect(status.orderProductionState).toBe("ready_to_pack");
  });
});

describe("production aggregation", () => {
  it("aggregates variant demand across orders", () => {
    const units = [
      {
        id: "1",
        orderItemId: "i1",
        orderId: "o1",
        orderNumber: "A",
        artistId: "art",
        artistName: "Artist",
        eventId: "evt",
        showLabel: "Brooklyn",
        productId: "prd",
        productName: "Tee",
        variantId: "v1",
        size: "M",
        unitIndex: 0,
        status: "queued" as const,
        requirementMode: "on_demand" as const,
        promisedDeliveryAt: null,
        promiseState: "within_promise" as const,
        hasProductionException: false,
        openExceptionId: null,
        openExceptionType: null,
        commerceMoment: "show_night" as const,
        activationDropTitle: null,
        queuedAt: new Date(),
        startedAt: null,
        completedAt: null,
        priority: 5,
        priorityReason: "normal" as const,
        priorityLabel: "Normal",
      },
      {
        id: "2",
        orderItemId: "i2",
        orderId: "o2",
        orderNumber: "B",
        artistId: "art",
        artistName: "Artist",
        eventId: "evt",
        showLabel: "Brooklyn",
        productId: "prd",
        productName: "Tee",
        variantId: "v1",
        size: "M",
        unitIndex: 0,
        status: "queued" as const,
        requirementMode: "on_demand" as const,
        promisedDeliveryAt: null,
        promiseState: "within_promise" as const,
        hasProductionException: false,
        openExceptionId: null,
        openExceptionType: null,
        commerceMoment: "post_show" as const,
        activationDropTitle: null,
        queuedAt: new Date(),
        startedAt: null,
        completedAt: null,
        priority: 5,
        priorityReason: "normal" as const,
        priorityLabel: "Normal",
      },
    ];

    const groups = aggregateVariantGroups(units);
    expect(groups[0].unitsQueued).toBe(2);
    expect(groups[0].orderCount).toBe(2);
    expect(ordersBlockedByEvent(units).get("evt")).toBe(2);
  });
});

describe("production authorization + queue", () => {
  beforeEach(() => {
    getAuthContext.mockReset();
    setDemoClockToDate(demoCalendarDate(6, 13, 10, 0));
  });

  it("denies artist member from production queue", async () => {
    const member = await createUser();
    const artist = await createArtist("Blocked Artist");
    const ctx = authContextFor(member, {
      roles: ["artist_member"],
      memberships: [membershipFor(artist)],
      activeArtistId: artist.id,
    });

    await expect(loadProductionQueue(ctx)).rejects.toThrow(/Production access denied/);
  });

  it("denies fan from production queue", async () => {
    const fan = await createUser();
    const ctx = authContextFor(fan, { roles: ["fan"] });
    await expect(loadProductionQueue(ctx)).rejects.toThrow(/Production access denied/);
  });

  it("creates unit rows for quantity > 1 and supports start/complete", async () => {
    const ctx = await opsContext();
    const artist = await createArtist("Production Artist");
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id, {
      startsAt: demoCalendarDate(6, 12, 20, 0),
      endsAt: demoCalendarDate(6, 12, 22, 30),
    });

    const orderId = `ord_qty_${randomUUID()}`;
    const itemId = `oit_qty_${randomUUID()}`;
    const productId = `prd_qty_${randomUUID()}`;

    await seedMinimalProductionOrder({
      eventId: event.id,
      artistId: artist.id,
      orderId,
      itemId,
      productId,
      quantity: 2,
      fulfillmentStatus: "received",
      promisedDeliveryAt: demoCalendarDate(6, 13, 18, 0),
    });

    const units = await getDb()
      .select()
      .from(productionWork)
      .where(eq(productionWork.orderItemId, itemId));
    expect(units).toHaveLength(2);

    const queuedIds = units.filter((u) => u.status === "queued").map((u) => u.id);
    expect(queuedIds.length).toBe(1);

    const started = await startProductionAction(queuedIds);
    expect(started.updated).toBe(queuedIds.length);

    const inProduction = await getDb()
      .select()
      .from(productionWork)
      .where(eq(productionWork.orderItemId, itemId));
    expect(inProduction.every((u) => u.status === "in_production")).toBe(true);
    expect(inProduction.every((u) => u.startedAt != null)).toBe(true);

    const completed = await completeProductionAction(inProduction.map((u) => u.id));
    expect(completed.updated).toBe(2);

    const status = await loadOrderProductionStatus(ctx, orderId);
    expect(status.readyToPack).toBe(true);
  });

  it("ignores invalid regression on complete from queued", async () => {
    const ctx = await opsContext();
    const artist = await createArtist("Regression Artist");
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);

    const orderId = `ord_reg_${randomUUID()}`;
    const itemId = `oit_reg_${randomUUID()}`;
    const productId = `prd_reg_${randomUUID()}`;

    await seedMinimalProductionOrder({
      eventId: event.id,
      artistId: artist.id,
      orderId,
      itemId,
      productId,
      quantity: 2,
      fulfillmentStatus: "received",
      promisedDeliveryAt: demoCalendarDate(6, 13, 18, 0),
    });

    const units = await getDb()
      .select()
      .from(productionWork)
      .where(eq(productionWork.orderItemId, itemId));
    const queuedUnit = units.find((u) => u.status === "queued");
    expect(queuedUnit).toBeDefined();

    const result = await completeProductionAction([queuedUnit!.id]);
    expect(result.updated).toBe(0);

    const after = await getDb()
      .select()
      .from(productionWork)
      .where(eq(productionWork.id, queuedUnit!.id));
    expect(after[0].status).toBe("queued");
  });

  it("idempotently starts only queued units", async () => {
    const ctx = await opsContext();
    const artist = await createArtist("Idempotent Artist");
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);

    const orderId = `ord_idem_${randomUUID()}`;
    const itemId = `oit_idem_${randomUUID()}`;
    const productId = `prd_idem_${randomUUID()}`;

    await seedMinimalProductionOrder({
      eventId: event.id,
      artistId: artist.id,
      orderId,
      itemId,
      productId,
      quantity: 1,
      fulfillmentStatus: "received",
      promisedDeliveryAt: demoCalendarDate(6, 13, 18, 0),
    });

    const [unit] = await getDb()
      .select()
      .from(productionWork)
      .where(eq(productionWork.orderItemId, itemId));
    expect(unit.status).toBe("in_production");

    await startProductionAction([unit.id]);
    const second = await startProductionAction([unit.id]);
    expect(second.updated).toBe(0);
  });

  it("seeds Marisol Brooklyn production mix and exposes queue", async () => {
    const ctx = await opsContext();
    const fan = await createUser();
    const artist = await createArtist("Marisol Reyes");
    const venue = await createVenue();
    const tour = await createTour(artist.id);

    await getDb().insert(events).values({
      id: MARISOL_BROOKLYN_EVENT_ID,
      artistId: artist.id,
      tourId: tour.id,
      venueId: venue.id,
      slug: "marisol-brooklyn-production",
      startsAt: demoCalendarDate(6, 12, 20, 0),
      endsAt: demoCalendarDate(6, 12, 22, 30),
      timezone: "America/New_York",
    });

    for (let i = 0; i < 8; i++) {
      const orderId = `ord_bk_prod_${i}`;
      await getDb().insert(orders).values({
        id: orderId,
        artistId: artist.id,
        userId: fan.id,
        eventId: MARISOL_BROOKLYN_EVENT_ID,
        orderNumber: `RGA-BK-P-${i}`,
        status: "paid",
        placedAt: demoCalendarDate(6, 12, 21, i),
        subtotalCents: 4500,
        totalCents: 4500,
        shippingName: "Fan",
        isDemo: true,
      });
      await attachPhysicalLine({
        orderId,
        artistId: artist.id,
        itemId: `oit_bk_prod_${i}`,
        productId: `prd_bk_prod_${i}`,
        quantity: 1 + (i % 2),
      });
    }

    await seedBrooklynFulfillment(getDb(), MARISOL_BROOKLYN_EVENT_ID, artist.id);

    const activeOrders = await getDb()
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.eventId, MARISOL_BROOKLYN_EVENT_ID))
      .limit(4);
    for (const row of activeOrders) {
      await getDb()
        .update(orders)
        .set({ fulfillmentStatus: "production", status: "picking" })
        .where(eq(orders.id, row.id));
    }

    await seedProductionWorkForEvent(getDb(), MARISOL_BROOKLYN_EVENT_ID, artist.id);

    const snapshot = await loadProductionQueue(ctx, "all", MARISOL_BROOKLYN_EVENT_ID);
    expect(snapshot.summary.unitsNeedsProductionNow).toBeGreaterThan(0);
    expect(snapshot.variantGroups.length).toBeGreaterThan(0);
    expect(snapshot.urgentGroups.length).toBeGreaterThan(0);

    const showSummary = await loadShowProductionSummary(ctx, MARISOL_BROOKLYN_EVENT_ID);
    expect(showSummary?.unitsRemaining).toBeGreaterThan(0);
  });

  it("includes Nashville as second-show production demand", async () => {
    const ctx = await opsContext();
    const fan = await createUser();
    const nova = await createArtist("Nova Kestrel");
    const marisol = await createArtist("Marisol Reyes");
    const venue = await createVenue();
    const tourNova = await createTour(nova.id);
    const tourMarisol = await createTour(marisol.id);

    const nashvilleId = "evt_nova_nashville_test";
    await getDb().insert(events).values({
      id: nashvilleId,
      artistId: nova.id,
      tourId: tourNova.id,
      venueId: venue.id,
      slug: "nova-nashville-production",
      startsAt: demoCalendarDate(5, 28, 20, 0),
      endsAt: demoCalendarDate(5, 28, 22, 30),
      timezone: "America/Chicago",
    });

    const brooklynCrossId = "evt_marisol_brooklyn_cross_show";
    await getDb().insert(events).values({
      id: brooklynCrossId,
      artistId: marisol.id,
      tourId: tourMarisol.id,
      venueId: venue.id,
      slug: "marisol-brooklyn-cross",
      startsAt: demoCalendarDate(6, 12, 20, 0),
      endsAt: demoCalendarDate(6, 12, 22, 30),
      timezone: "America/New_York",
    });

    for (let i = 0; i < 4; i++) {
      const nvOrderId = `ord_nv_prod_${i}`;
      const bkOrderId = `ord_bk_cross_${i}`;
      await getDb().insert(orders).values({
        id: nvOrderId,
        artistId: nova.id,
        userId: fan.id,
        eventId: nashvilleId,
        orderNumber: `RGA-NV-P-${i}`,
        status: "paid",
        placedAt: demoCalendarDate(5, 28, 21, i),
        subtotalCents: 4000,
        totalCents: 4000,
        shippingName: "Fan",
        isDemo: true,
      });
      await attachPhysicalLine({
        orderId: nvOrderId,
        artistId: nova.id,
        itemId: `oit_nv_prod_${i}`,
        productId: `prd_nv_prod_${i}`,
        quantity: 1,
      });
      await getDb().insert(orders).values({
        id: bkOrderId,
        artistId: marisol.id,
        userId: fan.id,
        eventId: brooklynCrossId,
        orderNumber: `RGA-BK-C-${i}`,
        status: "paid",
        placedAt: demoCalendarDate(6, 12, 21, i),
        subtotalCents: 4500,
        totalCents: 4500,
        shippingName: "Fan",
        isDemo: true,
      });
      await attachPhysicalLine({
        orderId: bkOrderId,
        artistId: marisol.id,
        itemId: `oit_bk_cross_${i}`,
        productId: `prd_bk_cross_${i}`,
        quantity: 1,
      });
    }

    await seedNashvilleFulfillment(getDb(), nashvilleId, nova.id);
    await seedBrooklynFulfillment(getDb(), brooklynCrossId, marisol.id);

    for (const eventId of [nashvilleId, brooklynCrossId]) {
      const active = await getDb()
        .select({ id: orders.id })
        .from(orders)
        .where(eq(orders.eventId, eventId))
        .limit(2);
      for (const row of active) {
        await getDb()
          .update(orders)
          .set({ fulfillmentStatus: "production", status: "picking" })
          .where(eq(orders.id, row.id));
      }
    }

    await seedProductionWorkForEvent(getDb(), nashvilleId, nova.id);
    await seedProductionWorkForEvent(getDb(), brooklynCrossId, marisol.id);

    const snapshot = await loadProductionQueue(ctx);
    const eventIds = new Set(snapshot.showSummaries.map((s) => s.eventId));
    expect(eventIds.has(nashvilleId)).toBe(true);
    expect(eventIds.has(brooklynCrossId)).toBe(true);
  });

  it("surfaces production exceptions in priority", async () => {
    const ctx = await opsContext();
    const artist = await createArtist("Exception Artist");
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);

    const orderId = `ord_exc_${randomUUID()}`;
    const itemId = `oit_exc_${randomUUID()}`;
    const productId = `prd_exc_${randomUUID()}`;

    await seedMinimalProductionOrder({
      eventId: event.id,
      artistId: artist.id,
      orderId,
      itemId,
      productId,
      quantity: 1,
      fulfillmentStatus: "received",
      promisedDeliveryAt: demoCalendarDate(6, 14, 18, 0),
    });

    await getDb().insert(orderFulfillmentExceptions).values({
      id: `exc_${orderId}`,
      orderId,
      type: "production_delay",
      status: "open",
      note: "Print delay",
      isDemo: true,
    });

    const snapshot = await loadProductionQueue(ctx, "all", event.id);
    const unitRows = await getDb()
      .select()
      .from(productionWork)
      .where(eq(productionWork.orderId, orderId));
    expect(unitRows.some((u) => u.status !== "complete")).toBe(true);

    const groups = snapshot.variantGroups.filter((g) => g.orderIds.includes(orderId));
    expect(groups.some((g) => g.priorityReason === "production_exception")).toBe(true);
  });

  it("reflects production pressure on command center show cards", async () => {
    const ctx = await opsContext();
    const fan = await createUser();
    const artist = await createArtist("Pressure Artist");
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id, {
      startsAt: demoCalendarDate(6, 12, 20, 0),
      endsAt: demoCalendarDate(6, 12, 22, 30),
    });

    const orderId = `ord_press_${randomUUID()}`;
    await seedMinimalProductionOrder({
      eventId: event.id,
      artistId: artist.id,
      orderId,
      itemId: `oit_press_${randomUUID()}`,
      productId: `prd_press_${randomUUID()}`,
      quantity: 3,
      fulfillmentStatus: "production",
      promisedDeliveryAt: demoCalendarDate(6, 13, 18, 0),
    });

    const snapshot = await loadOpsCommandCenter(ctx);
    const show = snapshot.shows.find((s) => s.eventId === event.id);
    expect(show?.productionUnitsWaiting).toBeGreaterThan(0);
  });
});
