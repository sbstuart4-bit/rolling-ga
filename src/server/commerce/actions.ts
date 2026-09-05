"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { cartItems, carts } from "@/db/schema";
import { assertUser } from "@/server/auth/guards";
import { getAuthContext } from "@/server/auth/session";
import { getOrCreateCart } from "./cart";
import { resolveValidatedCommerceEvent, commerceSourceForEvent } from "./attribution";
import { loadAttendanceFacts, resolveLine, resolveCartForCheckout } from "./resolve";
import { listBundleItems } from "@/server/catalog/queries";
import type { CheckoutRequest } from "@/server/payments/provider";

export interface CartActionState {
  ok?: boolean;
  error?: string;
}

/**
 * Note the absence of a price field. The form still posts what the fan was shown, but
 * nothing reads it — the price written to the cart is always re-derived from the
 * product, its variant and any drop that applies.
 */
const addToCartSchema = z.object({
  productId: z.string().min(1),
  productSlug: z.string().min(1),
  artistId: z.string().min(1),
  variantId: z.string().min(1).optional(),
  eventId: z.string().optional(),
  eventSlug: z.string().optional(),
  dropId: z.string().optional(),
  quantity: z.coerce.number().int().min(1).max(10),
  saveApparelSize: z.boolean().optional(),
  preferredApparelSize: z.string().trim().optional(),
});

function optionalField(value: FormDataEntryValue | null): string | undefined {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : undefined;
}

export async function addToCartAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const ctx = await getAuthContext();
  assertUser(ctx);

  const parsed = addToCartSchema.safeParse({
    productId: formData.get("productId"),
    productSlug: formData.get("productSlug"),
    artistId: formData.get("artistId"),
    variantId: optionalField(formData.get("variantId")),
    eventId: optionalField(formData.get("eventId")),
    eventSlug: optionalField(formData.get("eventSlug")),
    dropId: optionalField(formData.get("dropId")),
    quantity: formData.get("quantity") ?? 1,
    saveApparelSize: formData.get("saveApparelSize") === "true",
    preferredApparelSize: optionalField(formData.get("preferredApparelSize")),
  });

  if (!parsed.success) return { error: "Invalid request." };

  const { productId, productSlug, artistId, variantId, dropId, quantity } = parsed.data;

  const eventResolution = await resolveValidatedCommerceEvent({
    eventId: parsed.data.eventId,
    eventSlug: parsed.data.eventSlug,
    artistId,
    productId,
    dropId,
  });
  if (eventResolution.error) return { error: eventResolution.error };

  const eventId = eventResolution.eventId;

  const attendance = await loadAttendanceFacts(ctx.userId);
  const resolved = await resolveLine({
    productId,
    variantId,
    dropId,
    eventId,
    quantity,
    expectedArtistId: artistId,
    expectedProductSlug: productSlug,
    attendance,
  });

  if (!resolved.ok) return { error: resolved.message };

  const line = resolved.line;
  const cart = await getOrCreateCart(ctx.userId, eventId ?? null);

  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.variantId, line.variantId)))
    .limit(1);

  if (existing[0]) {
    await db
      .update(cartItems)
      .set({
        quantity: sql`${cartItems.quantity} + ${quantity}`,
        unitPriceCents: line.unitPriceCents,
        sourceEventId: eventId ?? existing[0].sourceEventId,
      })
      .where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values({
      cartId: cart.id,
      productId: line.productId,
      variantId: line.variantId,
      dropId: line.dropId,
      sourceEventId: eventId,
      quantity,
      unitPriceCents: line.unitPriceCents,
    });
  }

  revalidatePath("/cart");
  if (parsed.data.saveApparelSize && parsed.data.preferredApparelSize) {
    const { saveApparelSizeForUser } = await import("@/server/fans/preferences");
    const { normalizeApparelSize } = await import("@/lib/apparel-size");
    const size = normalizeApparelSize(parsed.data.preferredApparelSize);
    if (size) await saveApparelSizeForUser(ctx.userId, size);
  }
  return { ok: true };
}

const addBundleSchema = z.object({
  bundleId: z.string().min(1),
  artistId: z.string().min(1),
  eventId: z.string().optional(),
  eventSlug: z.string().optional(),
});

/** Adds every product in a bundle as individual cart lines (bundle price is informational). */
export async function addBundleToCartAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const ctx = await getAuthContext();
  assertUser(ctx);

  const parsed = addBundleSchema.safeParse({
    bundleId: formData.get("bundleId"),
    artistId: formData.get("artistId"),
    eventId: optionalField(formData.get("eventId")),
    eventSlug: optionalField(formData.get("eventSlug")),
  });
  if (!parsed.success) return { error: "Invalid request." };

  const { bundleId, artistId } = parsed.data;
  const items = await listBundleItems(bundleId);
  if (items.length === 0) return { error: "This bundle is no longer available." };

  const eventResolution = await resolveValidatedCommerceEvent({
    eventId: parsed.data.eventId,
    eventSlug: parsed.data.eventSlug,
    artistId,
    productId: items[0]!.productId,
  });
  if (eventResolution.error) return { error: eventResolution.error };

  const eventId = eventResolution.eventId;
  const attendance = await loadAttendanceFacts(ctx.userId);
  const cart = await getOrCreateCart(ctx.userId, eventId ?? null);

  for (const item of items) {
    const resolved = await resolveLine({
      productId: item.productId,
      variantId: item.variantId ?? undefined,
      eventId,
      quantity: item.quantity,
      expectedArtistId: artistId,
      expectedProductSlug: item.productSlug,
      attendance,
    });
    if (!resolved.ok) return { error: resolved.message };

    const line = resolved.line;
    const existing = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.variantId, line.variantId)))
      .limit(1);

    if (existing[0]) {
      await db
        .update(cartItems)
        .set({
          quantity: sql`${cartItems.quantity} + ${item.quantity}`,
          unitPriceCents: line.unitPriceCents,
          sourceEventId: eventId ?? existing[0].sourceEventId,
        })
        .where(eq(cartItems.id, existing[0].id));
    } else {
      await db.insert(cartItems).values({
        cartId: cart.id,
        productId: line.productId,
        variantId: line.variantId,
        sourceEventId: eventId,
        quantity: item.quantity,
        unitPriceCents: line.unitPriceCents,
      });
    }
  }

  revalidatePath("/cart");
  return { ok: true };
}

export async function removeCartItemAction(formData: FormData): Promise<void> {
  const ctx = await getAuthContext();
  assertUser(ctx);

  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) return;

  // Verify ownership before deletion
  const [item] = await db
    .select({ cartId: cartItems.cartId })
    .from(cartItems)
    .where(eq(cartItems.id, itemId))
    .limit(1);

  if (!item) return;

  const [cart] = await db
    .select({ userId: carts.userId })
    .from(carts)
    .where(eq(carts.id, item.cartId))
    .limit(1);

  if (!cart || cart.userId !== ctx.userId) return;

  await db.delete(cartItems).where(eq(cartItems.id, itemId));
  revalidatePath("/cart");
}

/**
 * The artist and the show are deliberately absent: both are derived from the cart's own
 * contents. Only the delivery details and the chosen shipping option come from the form.
 */
const checkoutSchema = z.object({
  cartId: z.string().min(1),
  shippingOptionId: z.string().optional(),
  shippingName: z.string().min(1),
  shippingLine1: z.string().min(1),
  shippingLine2: z.string().optional(),
  shippingCity: z.string().min(1),
  shippingRegion: z.string().min(1),
  shippingPostalCode: z.string().min(3),
  shippingCountry: z.string().min(2),
  saveShippingForFuture: z.boolean().optional(),
});

export interface CheckoutState {
  error?: string;
}

export async function checkoutAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const ctx = await getAuthContext();
  assertUser(ctx);

  const parsed = checkoutSchema.safeParse({
    cartId: formData.get("cartId"),
    shippingOptionId: optionalField(formData.get("shippingOptionId")),
    shippingName: formData.get("shippingName"),
    shippingLine1: formData.get("shippingLine1"),
    shippingLine2: formData.get("shippingLine2") ?? undefined,
    shippingCity: formData.get("shippingCity"),
    shippingRegion: formData.get("shippingRegion"),
    shippingPostalCode: formData.get("shippingPostalCode"),
    shippingCountry: formData.get("shippingCountry"),
    saveShippingForFuture: formData.get("saveShippingForFuture") === "true",
  });

  if (!parsed.success) return { error: "Please complete all required fields." };

  const { DevCheckoutProvider } = await import("@/server/payments/provider");
  const { listShippingOptionsForCheckout, resolveShippingChoices } = await import("./queries");
  const { estimateDeliveryDates } = await import("@/lib/shipping");
  const { demoNow } = await import("@/server/demo/clock");

  // Every line is re-resolved here: product, variant, drop window, eligibility, stock and
  // price. Nothing from the cart row is taken at face value, because the cart may have
  // been written minutes or days ago.
  const resolution = await resolveCartForCheckout(ctx.userId);
  if (!resolution.ok) return { error: resolution.message };

  if (resolution.cartId !== parsed.data.cartId) {
    return { error: "Your cart could not be found. Please refresh and try again." };
  }

  const { artistId, eventId, tourId, lines, subtotalCents } = resolution;

  const shippingOptions = await listShippingOptionsForCheckout(artistId, { eventId, tourId });
  const shippingOptionRow =
    shippingOptions.find((o) => o.id === parsed.data.shippingOptionId) ?? shippingOptions[0];

  const shippingChoices = resolveShippingChoices(shippingOptions, subtotalCents, demoNow());
  const selectedChoice = shippingChoices.find((c) => c.id === shippingOptionRow?.id) ?? shippingChoices[0];

  const shippingCustomerCharge = selectedChoice?.customerChargeCents ?? 0;
  const shippingCarrierCost = selectedChoice?.carrierCostCents ?? 0;
  const shippingSubsidy = selectedChoice?.artistSubsidyCents ?? 0;

  const totalCents = subtotalCents + shippingCustomerCharge;

  const deliveryDates = shippingOptionRow
    ? estimateDeliveryDates(
        shippingOptionRow.deliveryMinDays ?? 3,
        shippingOptionRow.deliveryMaxDays ?? 7,
        demoNow(),
      )
    : null;

  const request: CheckoutRequest = {
    userId: ctx.userId,
    artistId,
    eventId,
    commerceSource: commerceSourceForEvent(eventId),
    cartId: resolution.cartId,
    lines: lines.map((line) => ({
      productId: line.productId,
      variantId: line.variantId,
      dropId: line.dropId ?? undefined,
      name: line.name,
      size: line.size ?? undefined,
      imageUrl: line.imageUrl ?? undefined,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      unitCostCents: line.unitCostCents ?? undefined,
    })),
    subtotalCents,
    shippingCustomerChargeCents: shippingCustomerCharge,
    shippingCarrierCostCents: shippingCarrierCost,
    shippingArtistSubsidyCents: shippingSubsidy,
    taxCents: 0,
    totalCents,
    shippingOptionId: shippingOptionRow?.id ?? null,
    shippingMethodLabel: shippingOptionRow?.name,
    estimatedDeliveryFrom: deliveryDates?.from ?? null,
    estimatedDeliveryTo: deliveryDates?.to ?? null,
    shippingName: parsed.data.shippingName,
    shippingLine1: parsed.data.shippingLine1,
    shippingLine2: parsed.data.shippingLine2,
    shippingCity: parsed.data.shippingCity,
    shippingRegion: parsed.data.shippingRegion,
    shippingPostalCode: parsed.data.shippingPostalCode,
    shippingCountry: parsed.data.shippingCountry,
  };

  const result = await DevCheckoutProvider.checkout(request);
  if (!result.ok) return { error: result.error ?? "Checkout failed. Please try again." };

  if (parsed.data.saveShippingForFuture) {
    const { saveShippingAddressForUser } = await import("@/server/fans/preferences");
    await saveShippingAddressForUser(ctx.userId, {
      shippingName: parsed.data.shippingName,
      shippingLine1: parsed.data.shippingLine1,
      shippingLine2: parsed.data.shippingLine2 ?? "",
      shippingCity: parsed.data.shippingCity,
      shippingRegion: parsed.data.shippingRegion,
      shippingPostalCode: parsed.data.shippingPostalCode,
      shippingCountry: parsed.data.shippingCountry,
    });
  }

  redirect(`/order/${result.orderId}`);
}
