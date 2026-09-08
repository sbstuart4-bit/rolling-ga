/**
 * Ops Phase 4 — Exception resolution workbench.
 */
import { randomUUID } from "node:crypto";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import {
  events,
  fulfillmentExceptionActions,
  orderFulfillmentExceptions,
  orderItems,
  orders,
  productionWork,
  products,
  userRoles,
} from "@/db/schema";
import { seedProductionWorkForEvent } from "@/db/seed/production-work";
import {
  compareExceptionQueueItems,
  computeExceptionPriority,
  deriveReturnFulfillmentStatus,
  getAvailableExceptionActions,
  isActiveExceptionStatus,
} from "@/lib/exceptions";
import {
  db as getDb,
  createUser,
  createArtist,
  createVenue,
  createTour,
  createEvent,
  authContextFor,
} from "./helpers";
import {
  loadExceptionWorkbench,
  loadExceptionsQueue,
} from "@/server/ops/exception-queries";
import {
  performExceptionAction,
  resolveExceptionAction,
} from "@/server/ops/exception-actions";
import { loadOpsCommandCenter } from "@/server/ops/fulfillment-queries";
import { loadPackingQueue } from "@/server/ops/packing-queries";
import { loadProductionQueue } from "@/server/ops/production-queries";
import { setDemoClockToDate } from "@/server/demo/clock";
import { demoCalendarDate } from "@/lib/demo-calendar";

const getAuthContext = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getAuthContext }));

async function opsContext() {
  const opsUser = await createUser({ displayName: "Scott Ops" });
  await getDb().insert(userRoles).values({ userId: opsUser.id, role: "fulfillment_operator" });
  const ctx = authContextFor(opsUser, { roles: ["fulfillment_operator"] });
  getAuthContext.mockResolvedValue(ctx);
  return { ctx, opsUser };
}

async function fanContext() {
  const fan = await createUser();
  const ctx = authContextFor(fan, { roles: ["fan"] });
  getAuthContext.mockResolvedValue(ctx);
  return ctx;
}

async function seedExceptionOrder(input: {
  eventId: string;
  artistId: string;
  orderId: string;
  itemId: string;
  productId: string;
  exceptionId: string;
  exceptionType: "production_delay" | "address_issue" | "carrier_delay" | "delivery_failed";
  fulfillmentStatus?: "exception" | "production" | "packed";
  completeProduction?: boolean;
}) {
  const fan = await createUser();
  await getDb().insert(products).values({
    id: input.productId,
    artistId: input.artistId,
    slug: input.productId,
    name: "Exception Tee",
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
    fulfillmentStatus: input.fulfillmentStatus ?? "exception",
    placedAt: demoCalendarDate(6, 12, 21, 0),
    promisedDeliveryAt: demoCalendarDate(6, 13, 18, 0),
    fulfillmentReceivedAt: demoCalendarDate(6, 12, 22, 0),
    productionStartedAt: demoCalendarDate(6, 12, 23, 0),
    subtotalCents: 7000,
    totalCents: 7000,
    shippingName: "Test Fan",
    shippingMethodLabel: "Demo carrier",
    isDemo: true,
  });

    await getDb().insert(orderItems).values({
    id: input.itemId,
    orderId: input.orderId,
    productId: input.productId,
    nameSnapshot: "Exception Tee",
    sizeSnapshot: "M",
    quantity: 2,
    unitPriceCents: 3500,
    totalCents: 7000,
  });

  await seedProductionWorkForEvent(getDb(), input.eventId, input.artistId);

  if (input.completeProduction) {
    const work = await getDb()
      .select({ id: productionWork.id })
      .from(productionWork)
      .where(eq(productionWork.orderId, input.orderId));
    for (const row of work) {
      await getDb()
        .update(productionWork)
        .set({ status: "complete", completedAt: demoCalendarDate(6, 13, 2, 0) })
        .where(eq(productionWork.id, row.id));
    }
  }

  await getDb().insert(orderFulfillmentExceptions).values({
    id: input.exceptionId,
    orderId: input.orderId,
    type: input.exceptionType,
    status: "open",
    note: "Seeded exception",
    isDemo: true,
  });
}

describe("Ops exception resolution", () => {
  beforeEach(() => {
    setDemoClockToDate(demoCalendarDate(6, 13, 10, 0));
  });

  it("denies anonymous access", async () => {
    getAuthContext.mockResolvedValue(null);
    await expect(loadExceptionsQueue(null as never)).rejects.toThrow(/access denied/i);
  });

  it("denies fan access", async () => {
    await fanContext();
    await expect(loadExceptionsQueue((await fanContext()) as never)).rejects.toThrow(/access denied/i);
  });

  it("allows fulfillment operator access", async () => {
    const { ctx } = await opsContext();
    const queue = await loadExceptionsQueue(ctx, "open");
    expect(queue.summary.open).toBeGreaterThanOrEqual(0);
  });

  it("loads exception workbench with open status and actions", async () => {
    const { ctx } = await opsContext();
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const orderId = `ord_exc_${randomUUID().slice(0, 8)}`;
    const exceptionId = `ofx_exc_${randomUUID().slice(0, 8)}`;

    await seedExceptionOrder({
      eventId: event.id,
      artistId: artist.id,
      orderId,
      itemId: `oi_${orderId}`,
      productId: `prod_${orderId}`,
      exceptionId,
      exceptionType: "production_delay",
    });

    const workbench = await loadExceptionWorkbench(ctx, exceptionId);
    expect(workbench).not.toBeNull();
    expect(workbench!.exception.status).toBe("open");
    expect(workbench!.availableActions).toContain("retry_production");
    expect(workbench!.actions[0].actionType).toBe("opened");
  });

  it("records note with actor identity and timestamp", async () => {
    const { ctx, opsUser } = await opsContext();
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const orderId = `ord_note_${randomUUID().slice(0, 8)}`;
    const exceptionId = `ofx_note_${randomUUID().slice(0, 8)}`;

    await seedExceptionOrder({
      eventId: event.id,
      artistId: artist.id,
      orderId,
      itemId: `oi_${orderId}`,
      productId: `prod_${orderId}`,
      exceptionId,
      exceptionType: "address_issue",
      completeProduction: true,
    });

    const result = await performExceptionAction(exceptionId, "add_note", "Called fan to confirm address.");
    expect(result.ok).toBe(true);

    const actions = await getDb()
      .select()
      .from(fulfillmentExceptionActions)
      .where(eq(fulfillmentExceptionActions.exceptionId, exceptionId));

    expect(actions.some((a) => a.actionType === "add_note")).toBe(true);
    expect(actions.find((a) => a.actionType === "add_note")?.actorUserId).toBe(opsUser.id);

    const [exception] = await getDb()
      .select()
      .from(orderFulfillmentExceptions)
      .where(eq(orderFulfillmentExceptions.id, exceptionId));
    expect(exception.status).toBe("in_progress");
  });

  it("requires resolution note", async () => {
    const { ctx } = await opsContext();
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const orderId = `ord_res_${randomUUID().slice(0, 8)}`;
    const exceptionId = `ofx_res_${randomUUID().slice(0, 8)}`;

    await seedExceptionOrder({
      eventId: event.id,
      artistId: artist.id,
      orderId,
      itemId: `oi_${orderId}`,
      productId: `prod_${orderId}`,
      exceptionId,
      exceptionType: "production_delay",
    });

    const denied = await resolveExceptionAction(exceptionId, "   ");
    expect(denied.ok).toBe(false);
  });

  it("resolves exception with resolvedAt and preserves history", async () => {
    const { ctx, opsUser } = await opsContext();
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const orderId = `ord_done_${randomUUID().slice(0, 8)}`;
    const exceptionId = `ofx_done_${randomUUID().slice(0, 8)}`;

    await seedExceptionOrder({
      eventId: event.id,
      artistId: artist.id,
      orderId,
      itemId: `oi_${orderId}`,
      productId: `prod_${orderId}`,
      exceptionId,
      exceptionType: "production_delay",
    });

    await performExceptionAction(exceptionId, "add_note", "Investigating print delay.");
    const resolved = await resolveExceptionAction(exceptionId, "Reprint started; production resumed.");
    expect(resolved.ok).toBe(true);

    const [exception] = await getDb()
      .select()
      .from(orderFulfillmentExceptions)
      .where(eq(orderFulfillmentExceptions.id, exceptionId));
    expect(exception.status).toBe("resolved");
    expect(exception.resolvedAt).not.toBeNull();

    const actions = await getDb()
      .select()
      .from(fulfillmentExceptionActions)
      .where(eq(fulfillmentExceptionActions.exceptionId, exceptionId));
    expect(actions.length).toBeGreaterThanOrEqual(2);
    expect(actions.some((a) => a.actionType === "resolve" && a.actorUserId === opsUser.id)).toBe(true);

    const duplicate = await resolveExceptionAction(exceptionId, "Again");
    expect(duplicate.ok).toBe(true);
  });

  it("does not auto-complete production on resolve", async () => {
    const { ctx } = await opsContext();
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const orderId = `ord_prod_${randomUUID().slice(0, 8)}`;
    const exceptionId = `ofx_prod_${randomUUID().slice(0, 8)}`;

    await seedExceptionOrder({
      eventId: event.id,
      artistId: artist.id,
      orderId,
      itemId: `oi_${orderId}`,
      productId: `prod_${orderId}`,
      exceptionId,
      exceptionType: "production_delay",
    });

    await resolveExceptionAction(exceptionId, "Delay cleared.");

    const work = await getDb()
      .select({ status: productionWork.status })
      .from(productionWork)
      .where(eq(productionWork.orderId, orderId));
    expect(work.some((w) => w.status !== "complete")).toBe(true);
  });

  it("restores fulfillment status from exception without marking delivered", async () => {
    const status = deriveReturnFulfillmentStatus({
      fulfillmentStatus: "exception",
      productionRows: [
        {
          orderItemId: "oi",
          productName: "Tee",
          size: "M",
          status: "queued",
          requirementMode: "on_demand",
        },
      ],
      fulfillmentPackedAt: null,
      fulfillmentShippedAt: null,
      actualDeliveredAt: null,
      handedToCarrierAt: null,
      productionStartedAt: new Date(),
    });
    expect(status).toBe("production");

    const delivered = deriveReturnFulfillmentStatus({
      fulfillmentStatus: "exception",
      productionRows: [],
      fulfillmentPackedAt: new Date(),
      fulfillmentShippedAt: new Date(),
      actualDeliveredAt: null,
      handedToCarrierAt: null,
      productionStartedAt: null,
    });
    expect(delivered).toBe("shipped");
  });

  it("unblocks packing queue after address issue resolution", async () => {
    const { ctx } = await opsContext();
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const orderId = `ord_pack_${randomUUID().slice(0, 8)}`;
    const exceptionId = `ofx_pack_${randomUUID().slice(0, 8)}`;

    await seedExceptionOrder({
      eventId: event.id,
      artistId: artist.id,
      orderId,
      itemId: `oi_${orderId}`,
      productId: `prod_${orderId}`,
      exceptionId,
      exceptionType: "address_issue",
      completeProduction: true,
    });

    const blockedBefore = await loadPackingQueue(ctx, "blocked");
    expect(blockedBefore.blocked.some((o) => o.orderId === orderId)).toBe(true);

    await resolveExceptionAction(exceptionId, "Address confirmed with fan.");

    const readyAfter = await loadPackingQueue(ctx, "ready_to_pack");
    expect(readyAfter.readyToPack.some((o) => o.orderId === orderId)).toBe(true);
  });

  it("recalculates command center open exception count", async () => {
    const { ctx } = await opsContext();
    const before = await loadOpsCommandCenter(ctx, "all");
    const openBefore = before.global.openExceptions;

    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const orderId = `ord_cc_${randomUUID().slice(0, 8)}`;
    const exceptionId = `ofx_cc_${randomUUID().slice(0, 8)}`;

    await seedExceptionOrder({
      eventId: event.id,
      artistId: artist.id,
      orderId,
      itemId: `oi_${orderId}`,
      productId: `prod_${orderId}`,
      exceptionId,
      exceptionType: "carrier_delay",
      fulfillmentStatus: "packed",
      completeProduction: true,
    });

    const mid = await loadOpsCommandCenter(ctx, "all");
    expect(mid.global.openExceptions).toBeGreaterThanOrEqual(openBefore + 1);

    await resolveExceptionAction(exceptionId, "Carrier picked up package.");

    const after = await loadOpsCommandCenter(ctx, "all");
    expect(after.global.openExceptions).toBeLessThan(mid.global.openExceptions);
  });

  it("orders exceptions by priority — past promise before normal", () => {
    const past = {
      priority: 0,
      promisedDeliveryAt: new Date("2026-06-13T18:00:00Z"),
      createdAt: new Date("2026-06-13T08:00:00Z"),
    };
    const normal = {
      priority: 6,
      promisedDeliveryAt: new Date("2026-06-14T18:00:00Z"),
      createdAt: new Date("2026-06-13T07:00:00Z"),
    };
    expect(
      compareExceptionQueueItems(
        { ...past, id: "a", orderId: "1", orderNumber: "1", artistName: "A", eventId: null, showLabel: "", type: "other", status: "open", note: null, resolvedAt: null, promiseState: "past_promise", operationalStage: "production", priorityReason: "past_promise", priorityLabel: "Past promise", ageMinutes: 10, productSummary: null },
        { ...normal, id: "b", orderId: "2", orderNumber: "2", artistName: "B", eventId: null, showLabel: "", type: "other", status: "open", note: null, resolvedAt: null, promiseState: "within_promise", operationalStage: "production", priorityReason: "normal", priorityLabel: "Normal", ageMinutes: 5, productSummary: null },
      ),
    ).toBeLessThan(0);
  });

  it("exposes deterministic actions per exception type", () => {
    expect(getAvailableExceptionActions({ type: "production_delay", status: "open" })).toContain(
      "retry_production",
    );
    expect(getAvailableExceptionActions({ type: "delivery_failed", status: "open" })).toContain(
      "record_delivery_retry",
    );
    expect(getAvailableExceptionActions({ type: "production_delay", status: "resolved" })).toEqual(
      [],
    );
  });

  it("includes blocked production orders in queue snapshot", async () => {
    const { ctx } = await opsContext();
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const orderId = `ord_blk_${randomUUID().slice(0, 8)}`;
    const exceptionId = `ofx_blk_${randomUUID().slice(0, 8)}`;

    await seedExceptionOrder({
      eventId: event.id,
      artistId: artist.id,
      orderId,
      itemId: `oi_${orderId}`,
      productId: `prod_${orderId}`,
      exceptionId,
      exceptionType: "production_delay",
    });

    const queue = await loadProductionQueue(ctx);
    expect(queue.blockedOrders.some((o) => o.orderId === orderId)).toBe(true);
  });

  it("treats in_progress as active for blocking", () => {
    expect(isActiveExceptionStatus("in_progress")).toBe(true);
    expect(isActiveExceptionStatus("resolved")).toBe(false);
  });

  it("prioritizes delivery failed above normal blocking", () => {
    const failed = computeExceptionPriority({
      promiseState: "within_promise",
      type: "delivery_failed",
      isBlocking: false,
    });
    const blocking = computeExceptionPriority({
      promiseState: "within_promise",
      type: "address_issue",
      isBlocking: true,
    });
    expect(failed.priority).toBeLessThan(blocking.priority);
  });
});
