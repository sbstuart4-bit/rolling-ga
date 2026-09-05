import "server-only";
import { and, count, eq, inArray, notInArray } from "drizzle-orm";
import { db } from "@/db";
import {
  artistConsents,
  drops,
  orders,
  verifiedAttendance,
} from "@/db/schema";
import type { PassportEntry } from "@/server/attendance/queries";
import { hasGrantedArtistConnection } from "@/server/consent/service";

const PAID = notInArray(orders.status, ["cancelled", "pending"]);

export interface ShowAccessSummary {
  purchaseCount: number;
  attendeeDropCount: number;
  hasAnniversaryAccess: boolean;
  isConnected: boolean;
  unlockCount: number;
}

export interface PassportEntryWithAccess extends PassportEntry {
  access: ShowAccessSummary;
}

export async function loadPassportWithAccess(userId: string): Promise<PassportEntryWithAccess[]> {
  const { listPassport } = await import("@/server/attendance/queries");
  const passport = await listPassport(userId);

  if (passport.length === 0) return [];

  const eventIds = passport.map((p) => p.eventId);
  const artistIds = [...new Set(passport.map((p) => p.artistId))];

  const [orderCounts, dropRows, anniversaryDropRows, connectionRows] = await Promise.all([
    db
      .select({
        eventId: orders.eventId,
        total: count(orders.id),
      })
      .from(orders)
      .where(and(eq(orders.userId, userId), inArray(orders.eventId, eventIds), PAID))
      .groupBy(orders.eventId),
    db
      .select({
        eventId: drops.eventId,
        id: drops.id,
        exclusivityType: drops.exclusivityType,
        anniversaryOfEventId: drops.anniversaryOfEventId,
      })
      .from(drops)
      .where(inArray(drops.eventId, eventIds)),
    db
      .select({
        anniversaryOfEventId: drops.anniversaryOfEventId,
        exclusivityType: drops.exclusivityType,
      })
      .from(drops)
      .where(inArray(drops.anniversaryOfEventId, eventIds)),
    db
      .select({
        artistId: artistConsents.artistId,
      })
      .from(artistConsents)
      .where(
        and(
          eq(artistConsents.userId, userId),
          inArray(artistConsents.artistId, artistIds),
          eq(artistConsents.consentType, "attendee_offers"),
          eq(artistConsents.status, "granted"),
        ),
      ),
  ]);

  const ordersByEvent = new Map(orderCounts.map((r) => [r.eventId, Number(r.total)]));
  const dropsByEvent = new Map<string, typeof dropRows>();
  for (const drop of dropRows) {
    if (!drop.eventId) continue;
    const list = dropsByEvent.get(drop.eventId) ?? [];
    list.push(drop);
    dropsByEvent.set(drop.eventId, list);
  }
  const anniversaryByEvent = new Map<string, boolean>();
  for (const drop of anniversaryDropRows) {
    if (drop.anniversaryOfEventId) {
      anniversaryByEvent.set(drop.anniversaryOfEventId, true);
    }
  }
  const connectedArtists = new Set(connectionRows.map((r) => r.artistId));

  return passport.map((entry) => {
    const purchaseCount = ordersByEvent.get(entry.eventId) ?? 0;
    const eventDrops = dropsByEvent.get(entry.eventId) ?? [];
    const attendeeDropCount = eventDrops.filter((d) => d.exclusivityType !== "anniversary").length;
    const hasAnniversaryAccess =
      anniversaryByEvent.get(entry.eventId) ??
      eventDrops.some(
        (d) => d.exclusivityType === "anniversary" && d.anniversaryOfEventId === entry.eventId,
      );
    const isConnected = connectedArtists.has(entry.artistId);

    let unlockCount = 0;
    if (purchaseCount > 0) unlockCount += 1;
    if (attendeeDropCount > 0) unlockCount += 1;
    if (hasAnniversaryAccess) unlockCount += 1;
    if (isConnected) unlockCount += 1;

    return {
      ...entry,
      access: {
        purchaseCount,
        attendeeDropCount,
        hasAnniversaryAccess,
        isConnected,
        unlockCount,
      },
    };
  });
}

export async function loadShowAccessHub(
  userId: string,
  eventId: string,
  artistId: string,
): Promise<ShowAccessSummary> {
  const [purchaseRow, dropRows, anniversaryRows, isConnected] = await Promise.all([
    db
      .select({ total: count(orders.id) })
      .from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.eventId, eventId), PAID)),
    db
      .select({
        exclusivityType: drops.exclusivityType,
        anniversaryOfEventId: drops.anniversaryOfEventId,
      })
      .from(drops)
      .where(eq(drops.eventId, eventId)),
    db
      .select({ id: drops.id })
      .from(drops)
      .where(eq(drops.anniversaryOfEventId, eventId)),
    hasGrantedArtistConnection(userId, artistId),
  ]);

  const purchaseCount = Number(purchaseRow[0]?.total ?? 0);
  const attendeeDropCount = dropRows.filter((d) => d.exclusivityType !== "anniversary").length;
  const hasAnniversaryAccess =
    anniversaryRows.length > 0 ||
    dropRows.some(
      (d) => d.exclusivityType === "anniversary" && d.anniversaryOfEventId === eventId,
    );

  let unlockCount = 0;
  if (purchaseCount > 0) unlockCount += 1;
  if (attendeeDropCount > 0) unlockCount += 1;
  if (hasAnniversaryAccess) unlockCount += 1;
  if (isConnected) unlockCount += 1;

  return {
    purchaseCount,
    attendeeDropCount,
    hasAnniversaryAccess,
    isConnected,
    unlockCount,
  };
}
