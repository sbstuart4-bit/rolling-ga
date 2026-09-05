"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { bundleItems, bundles, inventory, products, productVariants } from "@/db/schema";
import {
  PRODUCT_ACCESS_TYPES,
  PRODUCT_CATEGORIES,
} from "@/lib/types";
import { assertArtistAccess } from "@/server/auth/guards";
import { getAuthContext } from "@/server/auth/session";
import { requireProductForArtist } from "@/server/studio/merch-queries";

export interface MerchActionState {
  ok?: boolean;
  error?: string;
}

const optionalText = z.string().trim().optional();

const productSchema = z.object({
  artistId: z.string().min(1),
  name: z.string().min(1).max(120),
  tagline: optionalText,
  story: optionalText,
  category: z.enum(PRODUCT_CATEGORIES),
  accessType: z.enum(PRODUCT_ACCESS_TYPES),
  basePriceCents: z.coerce.number().int().min(0),
  unitCostCents: z.coerce.number().int().min(0).optional(),
  sku: z.string().min(1).max(64),
  images: optionalText,
  tourId: optionalText,
  eventId: optionalText,
  isDigital: z.coerce.boolean().optional(),
  producedQuantity: z.coerce.number().int().min(0).optional(),
  availableFrom: optionalText,
  availableUntil: optionalText,
  sizes: optionalText,
  initialStock: z.coerce.number().int().min(0).optional(),
});

const updateProductSchema = productSchema.extend({
  productId: z.string().min(1),
});

const cityExclusiveSchema = z.object({
  artistId: z.string().min(1),
  eventId: z.string().min(1),
  name: z.string().min(1).max(120),
  tagline: optionalText,
  story: optionalText,
  category: z.enum(PRODUCT_CATEGORIES),
  basePriceCents: z.coerce.number().int().min(0),
  unitCostCents: z.coerce.number().int().min(0).optional(),
  sku: z.string().min(1).max(64),
  images: optionalText,
  producedQuantity: z.coerce.number().int().min(0).optional(),
  availableFrom: optionalText,
  availableUntil: optionalText,
  sizes: optionalText,
  initialStock: z.coerce.number().int().min(0).optional(),
});

const bundleSchema = z.object({
  artistId: z.string().min(1),
  name: z.string().min(1).max(120),
  description: optionalText,
  bundlePriceCents: z.coerce.number().int().min(0),
  accessType: z.enum(PRODUCT_ACCESS_TYPES),
  tourId: optionalText,
  eventId: optionalText,
  productIds: z.array(z.string().min(1)).min(2),
});

const inventorySchema = z.object({
  artistId: z.string().min(1),
  productId: z.string().min(1),
  variantId: z.string().min(1),
  onHand: z.coerce.number().int().min(0),
  reorderPoint: z.coerce.number().int().min(0).optional(),
});

function revalidateMerch(productId?: string) {
  revalidatePath("/studio/merch");
  if (productId) revalidatePath(`/studio/merch/${productId}`);
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 48);
}

function parseImages(raw: string | undefined): string[] | null {
  if (!raw?.trim()) return null;
  const urls = raw.split("\n").map((line) => line.trim()).filter(Boolean);
  return urls.length > 0 ? urls : null;
}

function parseSizes(raw: string | undefined): string[] {
  if (!raw?.trim()) return ["One Size"];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseOptionalDate(raw: string | undefined): Date | null {
  if (!raw?.trim()) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function insertVariants(
  productId: string,
  skuBase: string,
  sizes: string[],
  initialStock: number,
  isDigital: boolean,
) {
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i]!;
    const variantSku = sizes.length === 1 && size === "One Size" ? skuBase : `${skuBase}-${size.toLowerCase()}`;
    const [variant] = await db
      .insert(productVariants)
      .values({
        productId,
        sku: variantSku,
        size: size === "One Size" ? null : size,
        displayOrder: i,
      })
      .returning({ id: productVariants.id });

    if (!isDigital) {
      await db.insert(inventory).values({
        variantId: variant.id,
        onHand: initialStock,
        reserved: 0,
        reorderPoint: Math.max(5, Math.floor(initialStock * 0.1)),
      });
    }
  }
}

export async function createProductAction(
  _prev: MerchActionState,
  formData: FormData,
): Promise<MerchActionState> {
  const ctx = await getAuthContext();
  const parsed = productSchema.safeParse({
    artistId: formData.get("artistId"),
    name: formData.get("name"),
    tagline: formData.get("tagline") ?? undefined,
    story: formData.get("story") ?? undefined,
    category: formData.get("category"),
    accessType: formData.get("accessType"),
    basePriceCents: formData.get("basePriceCents"),
    unitCostCents: formData.get("unitCostCents") || undefined,
    sku: formData.get("sku"),
    images: formData.get("images") ?? undefined,
    tourId: formData.get("tourId") ?? undefined,
    eventId: formData.get("eventId") ?? undefined,
    isDigital: formData.get("isDigital") === "on" || formData.get("isDigital") === "true",
    producedQuantity: formData.get("producedQuantity") || undefined,
    availableFrom: formData.get("availableFrom") ?? undefined,
    availableUntil: formData.get("availableUntil") ?? undefined,
    sizes: formData.get("sizes") ?? undefined,
    initialStock: formData.get("initialStock") || undefined,
  });

  if (!parsed.success) return { error: "Check product fields and try again." };

  assertArtistAccess(ctx, parsed.data.artistId);

  const isDigital =
    parsed.data.isDigital === true || parsed.data.category === "digital";
  const slug = `${slugify(parsed.data.name)}-${Date.now()}`;
  const sizes = parseSizes(parsed.data.sizes);

  const [product] = await db
    .insert(products)
    .values({
      artistId: parsed.data.artistId,
      slug,
      name: parsed.data.name,
      tagline: parsed.data.tagline || null,
      story: parsed.data.story || null,
      category: parsed.data.category,
      accessType: parsed.data.accessType,
      basePriceCents: parsed.data.basePriceCents,
      unitCostCents: parsed.data.unitCostCents ?? null,
      sku: parsed.data.sku,
      images: parseImages(parsed.data.images),
      tourId: parsed.data.tourId || null,
      eventId: parsed.data.eventId || null,
      isDigital,
      producedQuantity: parsed.data.producedQuantity ?? null,
      availableFrom: parseOptionalDate(parsed.data.availableFrom),
      availableUntil: parseOptionalDate(parsed.data.availableUntil),
      active: true,
    })
    .returning({ id: products.id });

  await insertVariants(
    product.id,
    parsed.data.sku,
    sizes,
    parsed.data.initialStock ?? 50,
    isDigital,
  );

  revalidateMerch(product.id);
  redirect(`/studio/merch/${product.id}`);
}

export async function createCityExclusiveAction(
  _prev: MerchActionState,
  formData: FormData,
): Promise<MerchActionState> {
  const ctx = await getAuthContext();
  const parsed = cityExclusiveSchema.safeParse({
    artistId: formData.get("artistId"),
    eventId: formData.get("eventId"),
    name: formData.get("name"),
    tagline: formData.get("tagline") ?? undefined,
    story: formData.get("story") ?? undefined,
    category: formData.get("category"),
    basePriceCents: formData.get("basePriceCents"),
    unitCostCents: formData.get("unitCostCents") || undefined,
    sku: formData.get("sku"),
    images: formData.get("images") ?? undefined,
    producedQuantity: formData.get("producedQuantity") || undefined,
    availableFrom: formData.get("availableFrom") ?? undefined,
    availableUntil: formData.get("availableUntil") ?? undefined,
    sizes: formData.get("sizes") ?? undefined,
    initialStock: formData.get("initialStock") || undefined,
  });

  if (!parsed.success) return { error: "Complete the city exclusive fields." };

  assertArtistAccess(ctx, parsed.data.artistId);

  const { events } = await import("@/db/schema");
  const [event] = await db
    .select({ id: events.id, tourId: events.tourId, artistId: events.artistId })
    .from(events)
    .where(eq(events.id, parsed.data.eventId))
    .limit(1);

  if (!event || event.artistId !== parsed.data.artistId) {
    return { error: "That show is not on your account." };
  }

  const slug = `${slugify(parsed.data.name)}-${Date.now()}`;
  const sizes = parseSizes(parsed.data.sizes);

  const [product] = await db
    .insert(products)
    .values({
      artistId: parsed.data.artistId,
      slug,
      name: parsed.data.name,
      tagline: parsed.data.tagline || null,
      story: parsed.data.story || null,
      category: parsed.data.category,
      accessType: "event_specific",
      basePriceCents: parsed.data.basePriceCents,
      unitCostCents: parsed.data.unitCostCents ?? null,
      sku: parsed.data.sku,
      images: parseImages(parsed.data.images),
      tourId: event.tourId,
      eventId: parsed.data.eventId,
      isDigital: parsed.data.category === "digital",
      producedQuantity: parsed.data.producedQuantity ?? null,
      availableFrom: parseOptionalDate(parsed.data.availableFrom),
      availableUntil: parseOptionalDate(parsed.data.availableUntil),
      active: true,
    })
    .returning({ id: products.id });

  await insertVariants(
    product.id,
    parsed.data.sku,
    sizes,
    parsed.data.initialStock ?? 100,
    parsed.data.category === "digital",
  );

  revalidateMerch(product.id);
  revalidatePath(`/studio/merch/assortment/${parsed.data.eventId}`);
  redirect(`/studio/merch/${product.id}`);
}

export async function updateProductAction(
  _prev: MerchActionState,
  formData: FormData,
): Promise<MerchActionState> {
  const ctx = await getAuthContext();
  const parsed = updateProductSchema.safeParse({
    productId: formData.get("productId"),
    artistId: formData.get("artistId"),
    name: formData.get("name"),
    tagline: formData.get("tagline") ?? undefined,
    story: formData.get("story") ?? undefined,
    category: formData.get("category"),
    accessType: formData.get("accessType"),
    basePriceCents: formData.get("basePriceCents"),
    unitCostCents: formData.get("unitCostCents") || undefined,
    sku: formData.get("sku"),
    images: formData.get("images") ?? undefined,
    tourId: formData.get("tourId") ?? undefined,
    eventId: formData.get("eventId") ?? undefined,
    isDigital: formData.get("isDigital") === "on" || formData.get("isDigital") === "true",
    producedQuantity: formData.get("producedQuantity") || undefined,
    availableFrom: formData.get("availableFrom") ?? undefined,
    availableUntil: formData.get("availableUntil") ?? undefined,
  });

  if (!parsed.success) return { error: "Check product fields and try again." };

  assertArtistAccess(ctx, parsed.data.artistId);
  const owned = await requireProductForArtist(parsed.data.productId, parsed.data.artistId);
  if (!owned) return { error: "Product not found." };

  const isDigital =
    parsed.data.isDigital === true || parsed.data.category === "digital";

  await db
    .update(products)
    .set({
      name: parsed.data.name,
      tagline: parsed.data.tagline || null,
      story: parsed.data.story || null,
      category: parsed.data.category,
      accessType: parsed.data.accessType,
      basePriceCents: parsed.data.basePriceCents,
      unitCostCents: parsed.data.unitCostCents ?? null,
      sku: parsed.data.sku,
      images: parseImages(parsed.data.images),
      tourId: parsed.data.tourId || null,
      eventId: parsed.data.eventId || null,
      isDigital,
      producedQuantity: parsed.data.producedQuantity ?? null,
      availableFrom: parseOptionalDate(parsed.data.availableFrom),
      availableUntil: parseOptionalDate(parsed.data.availableUntil),
      updatedAt: new Date(),
    })
    .where(eq(products.id, parsed.data.productId));

  revalidateMerch(parsed.data.productId);
  return { ok: true };
}

export async function archiveProductAction(formData: FormData): Promise<void> {
  const ctx = await getAuthContext();
  const productId = String(formData.get("productId") ?? "");
  const artistId = String(formData.get("artistId") ?? "");

  assertArtistAccess(ctx, artistId);
  const owned = await requireProductForArtist(productId, artistId);
  if (!owned) return;

  await db
    .update(products)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(products.id, productId));

  revalidateMerch();
}

export async function updateInventoryAction(
  _prev: MerchActionState,
  formData: FormData,
): Promise<MerchActionState> {
  const ctx = await getAuthContext();
  const parsed = inventorySchema.safeParse({
    artistId: formData.get("artistId"),
    productId: formData.get("productId"),
    variantId: formData.get("variantId"),
    onHand: formData.get("onHand"),
    reorderPoint: formData.get("reorderPoint") || undefined,
  });

  if (!parsed.success) return { error: "Invalid inventory update." };

  assertArtistAccess(ctx, parsed.data.artistId);
  const owned = await requireProductForArtist(parsed.data.productId, parsed.data.artistId);
  if (!owned) return { error: "Product not found." };

  const [variant] = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(
      and(
        eq(productVariants.id, parsed.data.variantId),
        eq(productVariants.productId, parsed.data.productId),
      ),
    )
    .limit(1);

  if (!variant) return { error: "Variant not found." };

  await db
    .insert(inventory)
    .values({
      variantId: parsed.data.variantId,
      onHand: parsed.data.onHand,
      reserved: 0,
      reorderPoint: parsed.data.reorderPoint ?? 5,
    })
    .onConflictDoUpdate({
      target: inventory.variantId,
      set: {
        onHand: parsed.data.onHand,
        reorderPoint: parsed.data.reorderPoint ?? 5,
        updatedAt: new Date(),
      },
    });

  revalidateMerch(parsed.data.productId);
  return { ok: true };
}

export async function createBundleAction(
  _prev: MerchActionState,
  formData: FormData,
): Promise<MerchActionState> {
  const ctx = await getAuthContext();
  const productIds = formData.getAll("productIds").map(String);

  const parsed = bundleSchema.safeParse({
    artistId: formData.get("artistId"),
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    bundlePriceCents: formData.get("bundlePriceCents"),
    accessType: formData.get("accessType"),
    tourId: formData.get("tourId") ?? undefined,
    eventId: formData.get("eventId") ?? undefined,
    productIds,
  });

  if (!parsed.success) return { error: "Bundles need a name, price, and at least two products." };

  assertArtistAccess(ctx, parsed.data.artistId);

  for (const productId of parsed.data.productIds) {
    const owned = await requireProductForArtist(productId, parsed.data.artistId);
    if (!owned) return { error: "All bundle products must belong to your artist." };
  }

  const slug = `${slugify(parsed.data.name)}-${Date.now()}`;

  const [bundle] = await db
    .insert(bundles)
    .values({
      artistId: parsed.data.artistId,
      slug,
      name: parsed.data.name,
      description: parsed.data.description || null,
      bundlePriceCents: parsed.data.bundlePriceCents,
      accessType: parsed.data.accessType,
      tourId: parsed.data.tourId || null,
      eventId: parsed.data.eventId || null,
      active: true,
    })
    .returning({ id: bundles.id });

  await Promise.all(
    parsed.data.productIds.map((productId, index) =>
      db.insert(bundleItems).values({
        bundleId: bundle.id,
        productId,
        quantity: 1,
        displayOrder: index,
      }),
    ),
  );

  revalidatePath("/studio/merch");
  revalidatePath(`/studio/merch/bundles/${bundle.id}`);
  redirect(`/studio/merch/bundles/${bundle.id}`);
}
