import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  drops,
  events,
  orderFulfillmentExceptions,
  orderItems,
  orders,
  shipments,
  tours,
  users,
  venues,
} from "@/db/schema";
import {
  aggregateDeliveryPerformance,
  buildFulfillmentTimeline,
  classifyDeliveryPromiseState,
  countFulfillmentPipeline,
  computePromisedDeliveryAt,
  resolveFulfillmentStatus,
} from "@/lib/fulfillment";
import type { DeliveryPromiseState, FulfillmentStatus } from "@/lib/types";
import { assertArtistAccess } from "@/server/auth/guards";
import type { AuthContext } from "@/server/auth/session";
import { demoNow } from "@/server/demo/clock";
import { getEventById } from "@/server/events/queries";

export interface FulfillmentOrderRow {
  orderId: string;
  orderNumber: string;
  fanName: string;
  fanEmail: string;
  placedAt: Date | null;
  commerceStatus: string;
  fulfillmentStatus: FulfillmentStatus | null;
  promisedDeliveryAt: Date | null;
  actualDeliveredAt: Date | null;
  promiseState: DeliveryPromiseState;
  totalCents: number;
  originLabel: string;
  commerceMoment: "show_night" | "post_show" | "other";
  hasOpenException: boolean;
  activationDropTitle: string | null;
}

export interface ShowFulfillmentSnapshot {
  eventId: string;
  eventLabel: string;
  artistName: string;
  venueCity: string;
  isDemoData: boolean;
  pipeline: ReturnType<typeof countFulfillmentPipeline>;
  performance: ReturnType<typeof aggregateDeliveryPerformance>;
  orders: FulfillmentOrderRow[];
  openExceptions: {
    id: string;
    orderId: string;
    orderNumber: string;
    type: string;
    note: string | null;
    createdAt: Date;
  }[];
}

function classifyOrderCommerceMoment(
  placedAt: Date | null,
  eventStartsAt: Date | null,
  eventEndsAt: Date | null,
): "show_night" | "post_show" | "other" {
  if (!placedAt || !eventStartsAt || !eventEndsAt) return "other";
  const t = placedAt.getTime();
  if (t >= eventStartsAt.getTime() && t <= eventEndsAt.getTime()) return "show_night";
  if (t > eventEndsAt.getTime()) return "post_show";
  return "other";
}

async function loadFulfillmentOrdersForEvent(artistId: string, eventId: string) {
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      fulfillmentStatus: orders.fulfillmentStatus,
      promisedDeliveryAt: orders.promisedDeliveryAt,
      actualDeliveredAt: orders.actualDeliveredAt,
      placedAt: orders.placedAt,
      totalCents: orders.totalCents,
      shippingName: orders.shippingName,
      estimatedDeliveryTo: orders.estimatedDeliveryTo,
      estimatedDeliveryFrom: orders.estimatedDeliveryFrom,
      isDemo: orders.isDemo,
      userDisplayName: users.displayName,
      userEmail: users.email,
      eventStartsAt: events.startsAt,
      eventEndsAt: events.endsAt,
      timezone: events.timezone,
      venueCity: venues.city,
      tourName: tours.name,
    })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .leftJoin(events, eq(events.id, orders.eventId))
    .leftJoin(venues, eq(venues.id, events.venueId))
    .leftJoin(tours, eq(tours.id, events.tourId))
    .where(
      and(
        eq(orders.artistId, artistId),
        eq(orders.eventId, eventId),
        sql`${orders.status} NOT IN ('pending', 'cancelled')`,
      ),
    )
    .orderBy(desc(orders.placedAt));

  const orderIds = rows.map((r) => r.id);
  if (orderIds.length === 0) {
    return { rows: [], exceptions: [], dropTitles: new Map<string, string>() };
  }

  const [exceptions, itemDrops] = await Promise.all([
    db
      .select()
      .from(orderFulfillmentExceptions)
      .where(
        and(
          inArray(orderFulfillmentExceptions.orderId, orderIds),
          inArray(orderFulfillmentExceptions.status, ["open", "in_progress"]),
        ),
      ),
    db
      .select({
        orderId: orderItems.orderId,
        dropTitle: drops.title,
        audienceSegmentId: drops.audienceSegmentId,
      })
      .from(orderItems)
      .leftJoin(drops, eq(drops.id, orderItems.dropId))
      .where(inArray(orderItems.orderId, orderIds)),
  ]);

  const dropTitles = new Map<string, string>();
  for (const line of itemDrops) {
    if (line.dropTitle && line.audienceSegmentId) {
      dropTitles.set(line.orderId, line.dropTitle);
    }
  }

  return { rows, exceptions, dropTitles };
}

export async function loadShowFulfillmentSnapshot(
  ctx: AuthContext,
  artistId: string,
  eventId: string,
): Promise<ShowFulfillmentSnapshot | null> {
  assertArtistAccess(ctx, artistId);

  const event = await getEventById(eventId);
  if (!event || event.artistId !== artistId) return null;

  const { rows, exceptions, dropTitles } = await loadFulfillmentOrdersForEvent(
    artistId,
    eventId,
  );
  const now = demoNow();

  const fulfillmentStatuses: FulfillmentStatus[] = [];
  const performanceInputs: Parameters<typeof aggregateDeliveryPerformance>[0] = [];
  const orderRows: FulfillmentOrderRow[] = [];

  for (const row of rows) {
    const fulfillmentStatus = resolveFulfillmentStatus(row.fulfillmentStatus, row.status);
    if (!fulfillmentStatus) continue;

    const promisedDeliveryAt =
      row.promisedDeliveryAt ??
      (row.placedAt
        ? computePromisedDeliveryAt({
            placedAt: row.placedAt,
            eventStartsAt: row.eventStartsAt,
            eventEndsAt: row.eventEndsAt,
            timezone: row.timezone ?? event.timezone,
            estimatedDeliveryTo: row.estimatedDeliveryTo,
            estimatedDeliveryFrom: row.estimatedDeliveryFrom,
          })
        : null);

    const hasOpenException = exceptions.some((e) => e.orderId === row.id);

    fulfillmentStatuses.push(fulfillmentStatus);
    performanceInputs.push({
      promisedDeliveryAt,
      actualDeliveredAt: row.actualDeliveredAt,
      placedAt: row.placedAt,
      fulfillmentStatus,
      hasOpenException,
    });

    orderRows.push({
      orderId: row.id,
      orderNumber: row.orderNumber,
      fanName: row.shippingName ?? row.userDisplayName,
      fanEmail: row.userEmail,
      placedAt: row.placedAt,
      commerceStatus: row.status,
      fulfillmentStatus,
      promisedDeliveryAt,
      actualDeliveredAt: row.actualDeliveredAt,
      promiseState: classifyDeliveryPromiseState({
        promisedDeliveryAt,
        actualDeliveredAt: row.actualDeliveredAt,
        placedAt: row.placedAt,
        fulfillmentStatus,
        now,
      }),
      totalCents: row.totalCents,
      originLabel: `${row.tourName ?? event.tourName ?? "Show"} · ${row.venueCity ?? event.venueCity}`,
      commerceMoment: classifyOrderCommerceMoment(
        row.placedAt,
        row.eventStartsAt,
        row.eventEndsAt,
      ),
      hasOpenException,
      activationDropTitle: dropTitles.get(row.id) ?? null,
    });
  }

  const exceptionByOrder = new Map(exceptions.map((e) => [e.orderId, e]));
  const openExceptions = orderRows
    .filter((o) => o.hasOpenException)
    .map((o) => {
      const ex = exceptionByOrder.get(o.orderId)!;
      return {
        id: ex.id,
        orderId: o.orderId,
        orderNumber: o.orderNumber,
        type: ex.type,
        note: ex.note,
        createdAt: ex.createdAt,
      };
    });

  return {
    eventId,
    eventLabel: `${event.venueCity} · ${event.tourName ?? "Show"}`,
    artistName: event.artistName,
    venueCity: event.venueCity,
    isDemoData: rows.some((r) => r.isDemo),
    pipeline: countFulfillmentPipeline(fulfillmentStatuses),
    performance: aggregateDeliveryPerformance(performanceInputs, now),
    orders: orderRows,
    openExceptions,
  };
}

export interface FulfillmentOrderDetail {
  orderId: string;
  orderNumber: string;
  fanName: string;
  fanEmail: string;
  placedAt: Date | null;
  commerceStatus: string;
  fulfillmentStatus: FulfillmentStatus | null;
  promisedDeliveryAt: Date | null;
  actualDeliveredAt: Date | null;
  promiseState: DeliveryPromiseState;
  totalCents: number;
  originLabel: string;
  commerceMoment: "show_night" | "post_show" | "other";
  activationDropTitle: string | null;
  items: { name: string; size: string | null; quantity: number; totalCents: number }[];
  timeline: ReturnType<typeof buildFulfillmentTimeline>;
  shipment: {
    carrier: string | null;
    service: string | null;
    trackingNumber: string | null;
    status: string;
    shippedAt: Date | null;
    deliveredAt: Date | null;
  } | null;
  exceptions: {
    id: string;
    type: string;
    status: string;
    note: string | null;
    createdAt: Date;
    resolvedAt: Date | null;
  }[];
  isDemoData: boolean;
}

export async function loadFulfillmentOrderDetail(
  ctx: AuthContext,
  artistId: string,
  orderId: string,
): Promise<FulfillmentOrderDetail | null> {
  assertArtistAccess(ctx, artistId);

  const [row] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      fulfillmentStatus: orders.fulfillmentStatus,
      promisedDeliveryAt: orders.promisedDeliveryAt,
      actualDeliveredAt: orders.actualDeliveredAt,
      fulfillmentReceivedAt: orders.fulfillmentReceivedAt,
      productionStartedAt: orders.productionStartedAt,
      fulfillmentPackedAt: orders.fulfillmentPackedAt,
      fulfillmentShippedAt: orders.fulfillmentShippedAt,
      placedAt: orders.placedAt,
      totalCents: orders.totalCents,
      shippingName: orders.shippingName,
      estimatedDeliveryTo: orders.estimatedDeliveryTo,
      estimatedDeliveryFrom: orders.estimatedDeliveryFrom,
      isDemo: orders.isDemo,
      userDisplayName: users.displayName,
      userEmail: users.email,
      eventStartsAt: events.startsAt,
      eventEndsAt: events.endsAt,
      timezone: events.timezone,
      venueCity: venues.city,
      tourName: tours.name,
    })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .leftJoin(events, eq(events.id, orders.eventId))
    .leftJoin(venues, eq(venues.id, events.venueId))
    .leftJoin(tours, eq(tours.id, events.tourId))
    .where(and(eq(orders.id, orderId), eq(orders.artistId, artistId)))
    .limit(1);

  if (!row) return null;

  const fulfillmentStatus = resolveFulfillmentStatus(row.fulfillmentStatus, row.status);
  const now = demoNow();

  const promisedDeliveryAt =
    row.promisedDeliveryAt ??
    (row.placedAt
      ? computePromisedDeliveryAt({
          placedAt: row.placedAt,
          eventStartsAt: row.eventStartsAt,
          eventEndsAt: row.eventEndsAt,
          timezone: row.timezone ?? "America/New_York",
          estimatedDeliveryTo: row.estimatedDeliveryTo,
          estimatedDeliveryFrom: row.estimatedDeliveryFrom,
        })
      : null);

  const [items, shipmentRows, exceptions, activationLine] = await Promise.all([
    db
      .select({
        name: orderItems.nameSnapshot,
        size: orderItems.sizeSnapshot,
        quantity: orderItems.quantity,
        totalCents: orderItems.totalCents,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId)),
    db.select().from(shipments).where(eq(shipments.orderId, orderId)).limit(1),
    db
      .select()
      .from(orderFulfillmentExceptions)
      .where(eq(orderFulfillmentExceptions.orderId, orderId)),
    db
      .select({ dropTitle: drops.title, audienceSegmentId: drops.audienceSegmentId })
      .from(orderItems)
      .innerJoin(drops, eq(drops.id, orderItems.dropId))
      .where(and(eq(orderItems.orderId, orderId), sql`${drops.audienceSegmentId} IS NOT NULL`))
      .limit(1),
  ]);

  const shipment = shipmentRows[0];

  return {
    orderId: row.id,
    orderNumber: row.orderNumber,
    fanName: row.shippingName ?? row.userDisplayName,
    fanEmail: row.userEmail,
    placedAt: row.placedAt,
    commerceStatus: row.status,
    fulfillmentStatus,
    promisedDeliveryAt,
    actualDeliveredAt: row.actualDeliveredAt,
    promiseState: classifyDeliveryPromiseState({
      promisedDeliveryAt,
      actualDeliveredAt: row.actualDeliveredAt,
      placedAt: row.placedAt,
      fulfillmentStatus,
      now,
    }),
    totalCents: row.totalCents,
    originLabel: `${row.tourName ?? "Show"} · ${row.venueCity ?? "—"}`,
    commerceMoment: classifyOrderCommerceMoment(
      row.placedAt,
      row.eventStartsAt,
      row.eventEndsAt,
    ),
    activationDropTitle:
      activationLine[0]?.audienceSegmentId ? activationLine[0].dropTitle : null,
    items: items.map((i) => ({
      name: i.name,
      size: i.size,
      quantity: i.quantity,
      totalCents: i.totalCents,
    })),
    timeline: buildFulfillmentTimeline({
      fulfillmentReceivedAt: row.fulfillmentReceivedAt,
      productionStartedAt: row.productionStartedAt,
      fulfillmentPackedAt: row.fulfillmentPackedAt,
      fulfillmentShippedAt: row.fulfillmentShippedAt,
      actualDeliveredAt: row.actualDeliveredAt,
      placedAt: row.placedAt,
    }),
    shipment: shipment
      ? {
          carrier: shipment.carrier,
          service: shipment.service,
          trackingNumber: shipment.trackingNumber,
          status: shipment.status,
          shippedAt: shipment.shippedAt,
          deliveredAt: shipment.deliveredAt,
        }
      : null,
    exceptions: exceptions.map((e) => ({
      id: e.id,
      type: e.type,
      status: e.status,
      note: e.note,
      createdAt: e.createdAt,
      resolvedAt: e.resolvedAt,
    })),
    isDemoData: row.isDemo ?? false,
  };
}

export async function loadArtistFulfillmentEvents(ctx: AuthContext, artistId: string) {
  assertArtistAccess(ctx, artistId);

  const rows = await db
    .selectDistinct({
      id: events.id,
      venueCity: venues.city,
      startsAt: events.startsAt,
      timezone: events.timezone,
      tourName: tours.name,
    })
    .from(orders)
    .innerJoin(events, eq(events.id, orders.eventId))
    .innerJoin(venues, eq(venues.id, events.venueId))
    .leftJoin(tours, eq(tours.id, events.tourId))
    .where(
      and(
        eq(orders.artistId, artistId),
        sql`${orders.status} NOT IN ('pending', 'cancelled')`,
      ),
    )
    .orderBy(desc(events.startsAt));

  return rows.map((row) => ({
    id: row.id,
    venueCity: row.venueCity,
    startsAt: row.startsAt,
    timezone: row.timezone,
    tourName: row.tourName,
  }));
}
