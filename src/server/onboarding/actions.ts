"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { fanPreferences, users } from "@/db/schema";
import { APPAREL_SIZES, PRODUCT_CATEGORIES } from "@/lib/types";
import { assertUser } from "@/server/auth/guards";
import { getAuthContext } from "@/server/auth/session";

export interface OnboardingState {
  error?: string;
}

const onboardingSchema = z.object({
  apparelSize: z.enum(APPAREL_SIZES).optional(),
  preferredCategories: z.array(z.enum(PRODUCT_CATEGORIES)),
  notifyDrops: z.boolean(),
  notifyAnniversary: z.boolean(),
  notifyShowNews: z.boolean(),
  shippingName: z.string().trim().max(120).optional(),
  shippingLine1: z.string().trim().max(160).optional(),
  shippingLine2: z.string().trim().max(160).optional(),
  shippingCity: z.string().trim().max(80).optional(),
  shippingRegion: z.string().trim().max(80).optional(),
  shippingPostalCode: z.string().trim().max(20).optional(),
  shippingCountry: z.string().trim().max(2).optional(),
  next: z.string().optional(),
});

function safeRedirectTarget(next: string | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

/**
 * Finishes the onboarding wizard: writes everything the fan chose to `fan_preferences`
 * in one shot, then stamps `users.onboarding_completed_at` so every fan-facing layout
 * stops redirecting them here.
 */
export async function completeOnboardingAction(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const ctx = await getAuthContext();
  assertUser(ctx);

  const raw = formData.get("payload");
  if (typeof raw !== "string") return { error: "Something went wrong. Try again." };

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return { error: "Something went wrong. Try again." };
  }

  const parsed = onboardingSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your answers and try again." };
  }

  const data = parsed.data;

  await db
    .update(fanPreferences)
    .set({
      apparelSize: data.apparelSize ?? null,
      preferredCategories: data.preferredCategories,
      notifyDrops: data.notifyDrops,
      notifyAnniversary: data.notifyAnniversary,
      notifyShowNews: data.notifyShowNews,
      shippingName: data.shippingName || null,
      shippingLine1: data.shippingLine1 || null,
      shippingLine2: data.shippingLine2 || null,
      shippingCity: data.shippingCity || null,
      shippingRegion: data.shippingRegion || null,
      shippingPostalCode: data.shippingPostalCode || null,
      shippingCountry: data.shippingCountry || null,
    })
    .where(eq(fanPreferences.userId, ctx.userId));

  await db
    .update(users)
    .set({ onboardingCompletedAt: new Date() })
    .where(eq(users.id, ctx.userId));

  redirect(safeRedirectTarget(data.next));
}

/** Lets a fan skip straight past onboarding without filling anything in. */
export async function skipOnboardingAction(formData: FormData): Promise<void> {
  const ctx = await getAuthContext();
  assertUser(ctx);

  await db.update(users).set({ onboardingCompletedAt: new Date() }).where(eq(users.id, ctx.userId));

  const next = formData.get("next");
  redirect(safeRedirectTarget(typeof next === "string" ? next : undefined));
}
