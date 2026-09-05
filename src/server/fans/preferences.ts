import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { fanPreferences } from "@/db/schema";
import type { ApparelSize } from "@/lib/types";
import { normalizeApparelSize } from "@/lib/apparel-size";
import type { SavedShippingAddress, ShippingAddressFields } from "@/lib/shipping-address";
import { hasSavedShippingAddress } from "@/lib/shipping-address";

const shippingSelection = {
  shippingName: fanPreferences.shippingName,
  shippingLine1: fanPreferences.shippingLine1,
  shippingLine2: fanPreferences.shippingLine2,
  shippingCity: fanPreferences.shippingCity,
  shippingRegion: fanPreferences.shippingRegion,
  shippingPostalCode: fanPreferences.shippingPostalCode,
  shippingCountry: fanPreferences.shippingCountry,
} as const;

/**
 * Loads saved shipping fields for checkout pre-fill.
 * Only ever queried with the authenticated fan's own user id.
 */
export async function getSavedShippingAddress(userId: string): Promise<SavedShippingAddress | null> {
  const [row] = await db
    .select(shippingSelection)
    .from(fanPreferences)
    .where(eq(fanPreferences.userId, userId))
    .limit(1);

  if (!row) return null;

  const saved: SavedShippingAddress = {
    shippingName: row.shippingName ?? undefined,
    shippingLine1: row.shippingLine1 ?? undefined,
    shippingLine2: row.shippingLine2 ?? undefined,
    shippingCity: row.shippingCity ?? undefined,
    shippingRegion: row.shippingRegion ?? undefined,
    shippingPostalCode: row.shippingPostalCode ?? undefined,
    shippingCountry: row.shippingCountry ?? undefined,
  };

  return hasSavedShippingAddress(saved) ? saved : null;
}

export async function getSavedApparelSize(userId: string): Promise<ApparelSize | null> {
  const [row] = await db
    .select({ apparelSize: fanPreferences.apparelSize })
    .from(fanPreferences)
    .where(eq(fanPreferences.userId, userId))
    .limit(1);

  return normalizeApparelSize(row?.apparelSize ?? "");
}

export async function saveApparelSizeForUser(userId: string, size: ApparelSize): Promise<void> {
  const now = new Date();
  await db
    .insert(fanPreferences)
    .values({ userId, apparelSize: size, updatedAt: now })
    .onConflictDoUpdate({
      target: fanPreferences.userId,
      set: { apparelSize: size, updatedAt: now },
    });
}

export async function getFanPreferenceSummary(userId: string) {
  const [row] = await db
    .select({
      apparelSize: fanPreferences.apparelSize,
      shippingName: fanPreferences.shippingName,
      shippingLine1: fanPreferences.shippingLine1,
      shippingLine2: fanPreferences.shippingLine2,
      shippingCity: fanPreferences.shippingCity,
      shippingRegion: fanPreferences.shippingRegion,
      shippingPostalCode: fanPreferences.shippingPostalCode,
      shippingCountry: fanPreferences.shippingCountry,
    })
    .from(fanPreferences)
    .where(eq(fanPreferences.userId, userId))
    .limit(1);

  if (!row) {
    return { apparelSize: null as ApparelSize | null, shippingAddress: null as SavedShippingAddress | null };
  }

  const shippingAddress: SavedShippingAddress = {
    shippingName: row.shippingName ?? undefined,
    shippingLine1: row.shippingLine1 ?? undefined,
    shippingLine2: row.shippingLine2 ?? undefined,
    shippingCity: row.shippingCity ?? undefined,
    shippingRegion: row.shippingRegion ?? undefined,
    shippingPostalCode: row.shippingPostalCode ?? undefined,
    shippingCountry: row.shippingCountry ?? undefined,
  };

  return {
    apparelSize: normalizeApparelSize(row.apparelSize ?? ""),
    shippingAddress: hasSavedShippingAddress(shippingAddress) ? shippingAddress : null,
  };
}

/** Persists shipping address to fan_preferences after a successful checkout. */
export async function saveShippingAddressForUser(
  userId: string,
  address: ShippingAddressFields,
): Promise<void> {
  const now = new Date();
  const values = {
    shippingName: address.shippingName.trim(),
    shippingLine1: address.shippingLine1.trim(),
    shippingLine2: address.shippingLine2.trim() || null,
    shippingCity: address.shippingCity.trim(),
    shippingRegion: address.shippingRegion.trim(),
    shippingPostalCode: address.shippingPostalCode.trim(),
    shippingCountry: address.shippingCountry.trim(),
    updatedAt: now,
  };

  await db
    .insert(fanPreferences)
    .values({ userId, ...values })
    .onConflictDoUpdate({
      target: fanPreferences.userId,
      set: values,
    });
}
