import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { events, tours } from "@/db/schema";
import { resolveEventState, type EventStateResult } from "@/lib/event-state";
import {
  canPurchaseInEventAttendeeStore,
  type EventCommerceOverride,
} from "@/lib/post-show-commerce";

export async function getEventTimingForCommerce(
  eventId: string,
  now: Date,
): Promise<EventStateResult | null> {
  const [row] = await db
    .select({
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      doorsAt: events.doorsAt,
      postShowWindowMinutes: events.postShowWindowMinutes,
      cancelled: events.cancelled,
      tourWindowMinutes: tours.postShowWindowMinutes,
    })
    .from(events)
    .innerJoin(tours, eq(tours.id, events.tourId))
    .where(eq(events.id, eventId))
    .limit(1);

  if (!row) return null;

  return resolveEventState(
    {
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      doorsAt: row.doorsAt,
      postShowWindowMinutes: row.postShowWindowMinutes,
      cancelled: row.cancelled,
    },
    row.tourWindowMinutes,
    now,
  );
}

export async function assertEventAttendeeStoreOpen(
  eventId: string,
  overrides: EventCommerceOverride,
  now: Date,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const timing = await getEventTimingForCommerce(eventId, now);
  if (!timing) return { ok: false, message: "That show could not be found." };

  if (canPurchaseInEventAttendeeStore(timing, overrides, now)) {
    return { ok: true };
  }

  return { ok: false, message: "The attendee store for this show has closed." };
}
