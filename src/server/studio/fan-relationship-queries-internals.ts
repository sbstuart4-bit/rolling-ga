import "server-only";

import { and, desc, eq, inArray, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { drops, events, orderItems, orders, tours, venues, verifiedAttendance } from "@/db/schema";
import type { EventWindow, OrderAttributionInput } from "@/lib/fan-attribution";
import { resolveEventState } from "@/lib/event-state";

export const PAID = notInArray(orders.status, ["cancelled", "pending"]);

export async function loadOrderLinesForArtist(artistId: string, userIds?: string[]) {
  const conditions = [eq(orders.artistId, artistId), PAID];
  if (userIds && userIds.length > 0) {
    conditions.push(inArray(orders.userId, userIds));
  }

  return db
    .select({
      orderId: orders.id,
      userId: orders.userId,
      orderEventId: orders.eventId,
      placedAt: orders.placedAt,
      commerceSource: orders.commerceSource,
      isDemo: orders.isDemo,
      dropId: orderItems.dropId,
      dropEventId: drops.eventId,
      lineTotalCents: orderItems.totalCents,
      nameSnapshot: orderItems.nameSnapshot,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .leftJoin(drops, eq(drops.id, orderItems.dropId))
    .where(and(...conditions))
    .orderBy(desc(orders.placedAt));
}

export function groupOrdersByUser(
  lines: Awaited<ReturnType<typeof loadOrderLinesForArtist>>,
): Map<string, OrderAttributionInput[]> {
  const map = new Map<string, Map<string, OrderAttributionInput>>();

  for (const line of lines) {
    const userOrders = map.get(line.userId) ?? new Map<string, OrderAttributionInput>();
    const existing = userOrders.get(line.orderId) ?? {
      orderId: line.orderId,
      orderEventId: line.orderEventId,
      placedAt: line.placedAt,
      commerceSource: line.commerceSource,
      lines: [],
    };
    existing.lines.push({
      dropId: line.dropId,
      dropEventId: line.dropEventId,
      lineTotalCents: line.lineTotalCents,
    });
    userOrders.set(line.orderId, existing);
    map.set(line.userId, userOrders);
  }

  const result = new Map<string, OrderAttributionInput[]>();
  for (const [userId, orderMap] of map) {
    result.set(userId, [...orderMap.values()]);
  }
  return result;
}

export async function loadVerifiedEventsByUser(artistId: string, userIds?: string[]) {
  const conditions = [eq(events.artistId, artistId)];
  if (userIds && userIds.length > 0) {
    conditions.push(inArray(verifiedAttendance.userId, userIds));
  }

  const rows = await db
    .select({
      userId: verifiedAttendance.userId,
      eventId: verifiedAttendance.eventId,
      verifiedAt: verifiedAttendance.verifiedAt,
      venueCity: venues.city,
      startsAt: events.startsAt,
      timezone: events.timezone,
      endsAt: events.endsAt,
      postShowWindowMinutes: events.postShowWindowMinutes,
      cancelled: events.cancelled,
      tourWindowMinutes: tours.postShowWindowMinutes,
      isDemo: verifiedAttendance.isDemo,
    })
    .from(verifiedAttendance)
    .innerJoin(events, eq(events.id, verifiedAttendance.eventId))
    .innerJoin(venues, eq(venues.id, events.venueId))
    .innerJoin(tours, eq(tours.id, events.tourId))
    .where(and(...conditions))
    .orderBy(verifiedAttendance.verifiedAt);

  const byUser = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byUser.get(row.userId) ?? [];
    list.push(row);
    byUser.set(row.userId, list);
  }
  return byUser;
}

export function buildEventWindow(event: {
  eventId?: string;
  id?: string;
  startsAt: Date;
  endsAt: Date;
  postShowWindowMinutes: number | null;
  cancelled: boolean;
  tourWindowMinutes: number | null;
}): EventWindow {
  const timing = resolveEventState(
    {
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      postShowWindowMinutes: event.postShowWindowMinutes,
      cancelled: event.cancelled,
    },
    event.tourWindowMinutes,
  );
  return {
    eventId: event.eventId ?? event.id!,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    postShowClosesAt: timing.postShowClosesAt,
  };
}
