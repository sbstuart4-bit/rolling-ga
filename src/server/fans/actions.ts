"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertUser } from "@/server/auth/guards";
import { getAuthContext } from "@/server/auth/session";
import {
  saveApparelSizeForUser,
  saveShippingAddressForUser,
} from "@/server/fans/preferences";
import { APPAREL_SIZES } from "@/lib/types";

export interface PreferenceActionState {
  ok?: boolean;
  error?: string;
}

const apparelSizeSchema = z.object({
  apparelSize: z.enum(APPAREL_SIZES),
});

const shippingSchema = z.object({
  shippingName: z.string().trim().min(1).max(120),
  shippingLine1: z.string().trim().min(1).max(160),
  shippingLine2: z.string().trim().max(160).optional(),
  shippingCity: z.string().trim().min(1).max(80),
  shippingRegion: z.string().trim().min(1).max(80),
  shippingPostalCode: z.string().trim().min(3).max(20),
  shippingCountry: z.string().trim().min(2).max(2),
});

export async function updateApparelSizeAction(
  _prev: PreferenceActionState,
  formData: FormData,
): Promise<PreferenceActionState> {
  const ctx = await getAuthContext();
  assertUser(ctx);

  const parsed = apparelSizeSchema.safeParse({ apparelSize: formData.get("apparelSize") });
  if (!parsed.success) return { error: "Choose a valid size." };

  await saveApparelSizeForUser(ctx.userId, parsed.data.apparelSize);
  revalidatePath("/profile/preferences");
  return { ok: true };
}

export async function updateShippingAddressAction(
  _prev: PreferenceActionState,
  formData: FormData,
): Promise<PreferenceActionState> {
  const ctx = await getAuthContext();
  assertUser(ctx);

  const parsed = shippingSchema.safeParse({
    shippingName: formData.get("shippingName"),
    shippingLine1: formData.get("shippingLine1"),
    shippingLine2: formData.get("shippingLine2") ?? undefined,
    shippingCity: formData.get("shippingCity"),
    shippingRegion: formData.get("shippingRegion"),
    shippingPostalCode: formData.get("shippingPostalCode"),
    shippingCountry: formData.get("shippingCountry"),
  });

  if (!parsed.success) return { error: "Complete every required shipping field." };

  await saveShippingAddressForUser(ctx.userId, {
    shippingName: parsed.data.shippingName,
    shippingLine1: parsed.data.shippingLine1,
    shippingLine2: parsed.data.shippingLine2 ?? "",
    shippingCity: parsed.data.shippingCity,
    shippingRegion: parsed.data.shippingRegion,
    shippingPostalCode: parsed.data.shippingPostalCode,
    shippingCountry: parsed.data.shippingCountry,
  });

  revalidatePath("/profile/shipping");
  revalidatePath("/checkout");
  return { ok: true };
}
