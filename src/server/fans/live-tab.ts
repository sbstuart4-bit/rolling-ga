import "server-only";
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { events, verifiedAttendance } from "@/db/schema";
import { demoNow } from "@/server/demo/clock";

/** True when the fan holds a credential for a show that is currently live. */
export async function fanHasLiveVerifiedShow(userId: string, now = demoNow()): Promise<boolean> {
  const [row] = await db
    .select({ id: verifiedAttendance.id })
    .from(verifiedAttendance)
    .innerJoin(events, eq(events.id, verifiedAttendance.eventId))
    .where(
      and(
        eq(verifiedAttendance.userId, userId),
        eq(events.cancelled, false),
        lte(events.startsAt, now),
        gte(events.endsAt, now),
      ),
    )
    .limit(1);

  return Boolean(row);
}
