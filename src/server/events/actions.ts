"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { eventVerificationTokens } from "@/db/schema";
import { generateEventToken } from "@/lib/token";
import { assertArtistAccess } from "@/server/auth/guards";
import { getAuthContext } from "@/server/auth/session";
import { getEventById } from "./queries";

/**
 * Issues a fresh QR token for a show and retires the previous one.
 *
 * This is the answer to a leaked photo of the venue screen: the old token stops
 * verifying immediately, anyone scanning it is told the code was replaced, and the URL
 * printed on the display never changes.
 */
export async function rotateEventTokenAction(formData: FormData): Promise<void> {
  const ctx = await getAuthContext();
  const eventId = String(formData.get("eventId") ?? "");

  const event = await getEventById(eventId);
  if (!event) throw new Error("Event not found");

  assertArtistAccess(ctx, event.artistId);

  const previous = await db
    .select({ id: eventVerificationTokens.id })
    .from(eventVerificationTokens)
    .where(
      and(
        eq(eventVerificationTokens.eventId, eventId),
        eq(eventVerificationTokens.active, true),
      ),
    );

  await db
    .update(eventVerificationTokens)
    .set({ active: false })
    .where(
      and(
        eq(eventVerificationTokens.eventId, eventId),
        eq(eventVerificationTokens.active, true),
      ),
    );

  await db.insert(eventVerificationTokens).values({
    eventId,
    token: generateEventToken(),
    active: true,
    expiresAt: event.endsAt,
    rotatedFromId: previous[0]?.id ?? null,
  });

  revalidatePath(`/studio/qr/${eventId}`);
}
