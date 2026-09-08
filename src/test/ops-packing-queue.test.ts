/**
 * Ops Phase 3 — Pack + carrier handoff.
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
  shipments,
  userRoles,
} from "@/db/schema";
import { seedProductionWorkForEvent } from "@/db/seed/production-work";
import {
  canMarkHandedToCarrier,
  canOrderEnterPacking,
  comparePackPriority,
  computePackPriority,
  derivePackOperationalState,
  isProductionReadyForPacking,
} from "@/lib/packing";
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
  loadPackingQueue,
  loadOrderPackingStatus,
} from "@/server/ops/packing-queries";
import {
  markHandedToCarrierAction,
  markPackedAction,
  startPackingAction,
} from "@/server/ops/packing-actions";
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

async function seedPackableOrder(input: {
  eventId: string;
  artistId: string;
  orderId: string;
  itemId: string;
  productId: string;
  quantity: number;
  completeProduction?: boolean;
}) {
  const fan = await createUser();
  await getDb().insert(products).values({
    id: input.productId,
    artistId: input.artistId,
    slug: input.productId,
    name: "Pack Tee",
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
    status: input.completeProduction ? "picking" : "paid",
    fulfillmentStatus: input.completeProduction ? "production" : "received",
    placedAt: demoCalendarDate(6, 12, 21, 0),
    promisedDeliveryAt: demoCalendarDate(6, 13, 18, 0),
    fulfillmentReceivedAt: demoCalendarDate(6, 12, 22, 0),
    productionStartedAt: demoCalendarDate(6, 12, 23, 0),
    subtotalCents: 3500 * input.quantity,
    totalCents: 3500 * input.quantity,
    shippingName: "Test Fan",
    shippingMethodLabel: "Demo carrier",
    isDemo: true,
  });

  await getDb().insert(orderItems).values({
    id: input.itemId,
    orderId: input.orderId,
    productId: input.productId,
    nameSnapshot: "Pack Tee",
    sizeSnapshot: "M",
    quantity: input.quantity,
    unitPriceCents: 3500,
    totalCents: 3500 * input.quantity,
  });

  await seedProductionWorkForEvent(getDb(), input.eventId, input.artistId);

  if (input.completeProduction) {
    await getDb()
      .update(productionWork)
      .set({ status: "complete", completedAt: demoCalendarDate(6, 13, 8, 0) })
      .where(eq(productionWork.orderId, input.orderId));
  }
}

describe("packing readiness", () => {
  it("blocks packing when production incomplete", () => {
    const result = canOrderEnterPacking({
      fulfillmentStatus: "production",
      commerceStatus: "picking",
      productionRows: [
        {
          orderItemId: "a",
          productName: "Tee",
          size: "M",
          status: "queued",
          requirementMode: "on_demand",
        },
      ],
      openExceptionTypes: [],
      packingStartedAt: null,
      fulfillmentPackedAt: null,
      readyForHandoffAt: null,
      handedToCarrierAt: null,
      fulfillmentShippedAt: null,
      actualDeliveredAt: null,
    });
    expect(result.allowed).toBe(false);
    expect(
      isProductionReadyForPacking([
        {
          orderItemId: "a",
          productName: "Tee",
          size: "M",
          status: "queued",
          requirementMode: "on_demand",
        },
      ]),
    ).toBe(false);
  });
});

describe("packing priority", () => {
  const placedAt = demoCalendarDate(6, 12, 21, 0);

  it("ranks past promise above at risk", () => {
    const past = computePackPriority({
      promiseState: "past_promise",
      hasBlockingException: false,
      promisedDeliveryAt: demoCalendarDate(6, 12, 18, 0),
      placedAt,
    });
    const atRisk = computePackPriority({
      promiseState: "at_risk",
      hasBlockingException: false,
      promisedDeliveryAt: demoCalendarDate(6, 13, 18, 0),
      placedAt,
    });
    expect(
      comparePackPriority(
        { priority: past.priority, promisedDeliveryAt: demoCalendarDate(6, 12, 18, 0), placedAt },
        { priority: atRisk.priority, promisedDeliveryAt: demoCalendarDate(6, 13, 18, 0), placedAt },
      ),
    ).toBeLessThan(0);
  });
});

describe("packing authorization + actions", () => {
  beforeEach(() => {
    getAuthContext.mockReset();
    setDemoClockToDate(demoCalendarDate(6, 13, 10, 0));
  });

  it("denies artist from packing queue", async () => {
    const member = await createUser();
    const artist = await createArtist("Blocked");
    const ctx = authContextFor(member, {
      roles: ["artist_member"],
      memberships: [membershipFor(artist)],
      activeArtistId: artist.id,
    });
    await expect(loadPackingQueue(ctx)).rejects.toThrow(/Packing access denied/);
  });

  it("denies fan from packing queue", async () => {
    const fan = await createUser();
    const ctx = authContextFor(fan, { roles: ["fan"] });
    await expect(loadPackingQueue(ctx)).rejects.toThrow(/Packing access denied/);
  });

  it("runs start pack → mark packed → handoff lifecycle", async () => {
    const ctx = await opsContext();
    const artist = await createArtist("Pack Artist");
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const orderId = `ord_pack_${randomUUID()}`;
    const itemId = `oit_pack_${randomUUID()}`;
    const productId = `prd_pack_${randomUUID()}`;

    await seedPackableOrder({
      eventId: event.id,
      artistId: artist.id,
      orderId,
      itemId,
      productId,
      quantity: 2,
      completeProduction: true,
    });

    const before = await loadOrderPackingStatus(ctx, orderId);
    expect(before?.operationalState).toBe("ready_to_pack");

    await startPackingAction(orderId);
    const packing = await loadOrderPackingStatus(ctx, orderId);
    expect(packing?.operationalState).toBe("packing");
    expect(packing?.packingStartedAt).not.toBeNull();

    await markPackedAction(orderId);
    const packed = await loadOrderPackingStatus(ctx, orderId);
    expect(packed?.operationalState).toBe("ready_for_handoff");
    expect(packed?.packedAt).not.toBeNull();
    expect(packed?.readyForHandoffAt).not.toBeNull();
    expect(packed?.shippedAt).toBeNull();

    const [orderRow] = await getDb().select().from(orders).where(eq(orders.id, orderId));
    expect(orderRow.fulfillmentStatus).toBe("packed");
    expect(orderRow.fulfillmentShippedAt).toBeNull();

    const [shipment] = await getDb().select().from(shipments).where(eq(shipments.orderId, orderId));
    expect(shipment.carrier).toBe("Demo carrier");
    expect(shipment.shippedAt).toBeNull();

    await markHandedToCarrierAction(orderId);
    const handed = await loadOrderPackingStatus(ctx, orderId);
    expect(handed?.operationalState).toBe("handed_to_carrier");
    expect(handed?.handedToCarrierAt).not.toBeNull();
    expect(handed?.shippedAt).toBeNull();

    const [afterOrder] = await getDb().select().from(orders).where(eq(orders.id, orderId));
    expect(afterOrder.fulfillmentShippedAt).toBeNull();
    expect(afterOrder.handedToCarrierAt).not.toBeNull();
  });

  it("blocks packing when production incomplete", async () => {
    const ctx = await opsContext();
    const artist = await createArtist("No Handoff");
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const orderId = `ord_nohand_${randomUUID()}`;

    await seedPackableOrder({
      eventId: event.id,
      artistId: artist.id,
      orderId,
      itemId: `oit_${orderId}`,
      productId: `prd_${orderId}`,
      quantity: 1,
      completeProduction: false,
    });

    await expect(startPackingAction(orderId)).rejects.toThrow(/Production incomplete/);
  });

  it("prevents invalid regression from queued to handed", async () => {
    const ctx = await opsContext();
    const artist = await createArtist("Regression");
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const orderId = `ord_reg_${randomUUID()}`;

    await seedPackableOrder({
      eventId: event.id,
      artistId: artist.id,
      orderId,
      itemId: `oit_reg_${orderId}`,
      productId: `prd_reg_${orderId}`,
      quantity: 1,
      completeProduction: true,
    });

    await expect(markHandedToCarrierAction(orderId)).rejects.toThrow(/not packed/i);
  });

  it("idempotently starts packing once", async () => {
    const ctx = await opsContext();
    const artist = await createArtist("Idempotent");
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const orderId = `ord_idem_${randomUUID()}`;

    await seedPackableOrder({
      eventId: event.id,
      artistId: artist.id,
      orderId,
      itemId: `oit_idem_${orderId}`,
      productId: `prd_idem_${orderId}`,
      quantity: 1,
      completeProduction: true,
    });

    const first = await startPackingAction(orderId);
    const second = await startPackingAction(orderId);
    expect(first.updated).toBe(true);
    expect(second.updated).toBe(false);
  });

  it("blocks packing with address exception", async () => {
    const ctx = await opsContext();
    const artist = await createArtist("Exception");
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const orderId = `ord_exc_${randomUUID()}`;

    await seedPackableOrder({
      eventId: event.id,
      artistId: artist.id,
      orderId,
      itemId: `oit_exc_${orderId}`,
      productId: `prd_exc_${orderId}`,
      quantity: 1,
      completeProduction: true,
    });

    await getDb().insert(orderFulfillmentExceptions).values({
      id: `ofx_${orderId}`,
      orderId,
      type: "address_issue",
      status: "open",
      isDemo: true,
    });

    const status = await loadOrderPackingStatus(ctx, orderId);
    expect(status?.operationalState).toBe("blocked");

    const handoff = canMarkHandedToCarrier({
      fulfillmentStatus: "production",
      commerceStatus: "picking",
      productionRows: [],
      openExceptionTypes: ["address_issue"],
      packingStartedAt: null,
      fulfillmentPackedAt: demoCalendarDate(6, 13, 8, 0),
      readyForHandoffAt: demoCalendarDate(6, 13, 8, 0),
      handedToCarrierAt: null,
      fulfillmentShippedAt: null,
      actualDeliveredAt: null,
    });
    expect(handoff.allowed).toBe(false);
  });

  it("reflects packing pressure on command center", async () => {
    const ctx = await opsContext();
    const artist = await createArtist("Pressure");
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id, {
      startsAt: demoCalendarDate(6, 12, 20, 0),
      endsAt: demoCalendarDate(6, 12, 22, 30),
    });
    const orderId = `ord_press_${randomUUID()}`;

    await seedPackableOrder({
      eventId: event.id,
      artistId: artist.id,
      orderId,
      itemId: `oit_press_${orderId}`,
      productId: `prd_press_${orderId}`,
      quantity: 1,
      completeProduction: true,
    });

    const snapshot = await loadOpsCommandCenter(ctx);
    const show = snapshot.shows.find((s) => s.eventId === event.id);
    expect(show?.packingReadyToPack).toBeGreaterThan(0);
  });

  it("distinguishes packed, handed, and shipped states", () => {
    const packedOnly = derivePackOperationalState({
      fulfillmentStatus: "packed",
      commerceStatus: "ready_to_ship",
      productionRows: [],
      openExceptionTypes: [],
      packingStartedAt: demoCalendarDate(6, 13, 8, 0),
      fulfillmentPackedAt: demoCalendarDate(6, 13, 9, 0),
      readyForHandoffAt: demoCalendarDate(6, 13, 9, 0),
      handedToCarrierAt: null,
      fulfillmentShippedAt: null,
      actualDeliveredAt: null,
    });
    expect(packedOnly.state).toBe("ready_for_handoff");

    const handed = derivePackOperationalState({
      fulfillmentStatus: "packed",
      commerceStatus: "ready_to_ship",
      productionRows: [],
      openExceptionTypes: [],
      packingStartedAt: demoCalendarDate(6, 13, 8, 0),
      fulfillmentPackedAt: demoCalendarDate(6, 13, 9, 0),
      readyForHandoffAt: demoCalendarDate(6, 13, 9, 0),
      handedToCarrierAt: demoCalendarDate(6, 13, 10, 0),
      fulfillmentShippedAt: null,
      actualDeliveredAt: null,
    });
    expect(handed.state).toBe("handed_to_carrier");

    const shipped = derivePackOperationalState({
      fulfillmentStatus: "shipped",
      commerceStatus: "shipped",
      productionRows: [],
      openExceptionTypes: [],
      packingStartedAt: demoCalendarDate(6, 13, 8, 0),
      fulfillmentPackedAt: demoCalendarDate(6, 13, 9, 0),
      readyForHandoffAt: demoCalendarDate(6, 13, 9, 0),
      handedToCarrierAt: demoCalendarDate(6, 13, 10, 0),
      fulfillmentShippedAt: demoCalendarDate(6, 13, 12, 0),
      actualDeliveredAt: null,
    });
    expect(shipped.state).toBe("shipped");
  });
});
