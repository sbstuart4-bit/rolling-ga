import "server-only";
import { and, asc, desc, eq, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  artists,
  bundles,
  bundleItems,
  drops,
  dropProducts,
  events,
  inventory,
  products,
  productVariants,
} from "@/db/schema";
import type { ProductAccessType } from "@/lib/types";
import { enrichProductRow, enrichProductRows, resolveProductImages } from "@/lib/demo-product-images";
import { demoNow } from "@/server/demo/clock";

const productCore = {
  id: products.id,
  slug: products.slug,
  name: products.name,
  tagline: products.tagline,
  story: products.story,
  category: products.category,
  accessType: products.accessType,
  availableFrom: products.availableFrom,
  availableUntil: products.availableUntil,
  basePriceCents: products.basePriceCents,
  images: products.images,
  producedQuantity: products.producedQuantity,
  isDigital: products.isDigital,
  sku: products.sku,
  artistId: products.artistId,
  tourId: products.tourId,
  eventId: products.eventId,
} as const;

export type ProductRow = Awaited<ReturnType<typeof listProductsForArtist>>[number];

export async function listProductsForArtist(artistId: string) {
  const rows = await db
    .select(productCore)
    .from(products)
    .where(and(eq(products.artistId, artistId), eq(products.active, true)))
    .orderBy(asc(products.name));
  return enrichProductRows(rows);
}

/** Products eligible for a live drop to verified attendees at a specific show. */
export async function listEligibleProductsForEventDrop(artistId: string, eventId: string) {
  const [eventRow] = await db
    .select({ tourId: events.tourId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  const tourId = eventRow?.tourId;

  const rows = await db
    .select(productCore)
    .from(products)
    .where(
      and(
        eq(products.artistId, artistId),
        eq(products.active, true),
        or(
          eq(products.eventId, eventId),
          eq(products.accessType, "verified_attendee"),
          tourId ? and(eq(products.accessType, "tour_specific"), eq(products.tourId, tourId)) : sql`false`,
        ),
      ),
    )
    .orderBy(asc(products.name));
  return enrichProductRows(rows);
}

export async function getProductBySlug(artistId: string, slug: string) {
  const [row] = await db
    .select(productCore)
    .from(products)
    .where(and(eq(products.artistId, artistId), eq(products.slug, slug), eq(products.active, true)))
    .limit(1);
  return row ? enrichProductRow(row) : null;
}

export async function listVariantsWithInventory(productId: string) {
  return db
    .select({
      id: productVariants.id,
      sku: productVariants.sku,
      size: productVariants.size,
      color: productVariants.color,
      priceDeltaCents: productVariants.priceDeltaCents,
      displayOrder: productVariants.displayOrder,
      onHand: inventory.onHand,
      reserved: inventory.reserved,
    })
    .from(productVariants)
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(and(eq(productVariants.productId, productId), eq(productVariants.active, true)))
    .orderBy(asc(productVariants.displayOrder));
}

export type VariantWithInventory = Awaited<ReturnType<typeof listVariantsWithInventory>>[number];

export function availableUnits(v: VariantWithInventory): number {
  return Math.max(0, (v.onHand ?? 0) - (v.reserved ?? 0));
}

/**
 * Which access types a user is eligible for based on their attendance record.
 *
 * This runs server-side on every add-to-cart and on the product page so locked items
 * display the correct state without any client trust.
 */
export function eligibleAccessTypes({
  attendedEventIds,
  attendedTourIds,
  attendedArtistIds,
}: {
  attendedEventIds: string[];
  attendedTourIds: string[];
  attendedArtistIds: string[];
}): Set<ProductAccessType> {
  const types = new Set<ProductAccessType>(["public"]);
  if (attendedEventIds.length > 0 || attendedTourIds.length > 0) {
    types.add("verified_attendee");
  }
  if (attendedEventIds.length > 0) types.add("event_specific");
  if (attendedTourIds.length > 0) types.add("tour_specific");
  if (attendedArtistIds.length > 0) types.add("previous_attendee");
  // `invite_vip` and `scheduled` are evaluated by dedicated checks
  return types;
}

export async function isEligibleForProduct(
  product: Pick<ProductRow, "accessType" | "eventId" | "tourId" | "availableFrom" | "availableUntil">,
  {
    attendedEventIds,
    attendedTourIds,
    attendedArtistIds,
  }: {
    attendedEventIds: string[];
    attendedTourIds: string[];
    attendedArtistIds: string[];
  },
  now = demoNow(),
): Promise<{ eligible: boolean; reason?: string }> {
  const { accessType, eventId, tourId, availableFrom, availableUntil } = product;

  if (accessType === "scheduled") {
    if (availableFrom && now < availableFrom) {
      return { eligible: false, reason: `Available from ${availableFrom.toLocaleDateString()}` };
    }
    if (availableUntil && now > availableUntil) {
      return { eligible: false, reason: "This product is no longer available" };
    }
    return { eligible: true };
  }

  if (accessType === "public") return { eligible: true };

  if (accessType === "event_specific") {
    if (!eventId || !attendedEventIds.includes(eventId)) {
      return { eligible: false, reason: "Unlock at the show" };
    }
    return { eligible: true };
  }

  if (accessType === "tour_specific") {
    if (!tourId || !attendedTourIds.includes(tourId)) {
      return { eligible: false, reason: "For this tour's verified attendees" };
    }
    return { eligible: true };
  }

  if (accessType === "verified_attendee") {
    if (attendedEventIds.length === 0 && attendedTourIds.length === 0) {
      return { eligible: false, reason: "Verified attendees only" };
    }
    return { eligible: true };
  }

  if (accessType === "previous_attendee") {
    if (attendedArtistIds.length === 0) {
      return { eligible: false, reason: "For fans who've been to a show" };
    }
    return { eligible: true };
  }

  // invite_vip: no automated gate yet
  return { eligible: true };
}

/* ------------------------------------------------------------------ *
 * Drops
 * ------------------------------------------------------------------ */

const dropCore = {
  id: drops.id,
  slug: drops.slug,
  title: drops.title,
  description: drops.description,
  artworkUrl: drops.artworkUrl,
  quantityLimit: drops.quantityLimit,
  quantitySold: drops.quantitySold,
  startsAt: drops.startsAt,
  endsAt: drops.endsAt,
  status: drops.status,
  exclusivityType: drops.exclusivityType,
  artistId: drops.artistId,
  tourId: drops.tourId,
  eventId: drops.eventId,
  anniversaryOfEventId: drops.anniversaryOfEventId,
  artistName: artists.name,
} as const;

export type DropRow = Awaited<ReturnType<typeof listActiveDropsForEvent>>[number];

export async function listActiveDropsForEvent(eventId: string, now = demoNow()) {
  return db
    .select(dropCore)
    .from(drops)
    .innerJoin(artists, eq(artists.id, drops.artistId))
    .where(
      and(
        eq(drops.eventId, eventId),
        eq(drops.status, "live"),
        lte(drops.startsAt, now),
      ),
    )
    .orderBy(desc(drops.displayPriority), desc(drops.startsAt));
}

/**
 * Drops and tour collections surfaced on an event's shop.
 *
 * Event-specific drops always appear; tour-wide drops (no eventId) appear when the fan
 * is browsing from a show on that tour. Scheduled drops are included so pre-show
 * preview can show what's coming.
 */
export async function listDropsForEventShop(
  {
    eventId,
    tourId,
    artistId,
  }: {
    eventId: string;
    tourId: string;
    artistId: string;
  },
  _now = demoNow(),
) {
  return db
    .select(dropCore)
    .from(drops)
    .innerJoin(artists, eq(artists.id, drops.artistId))
    .where(
      and(
        eq(drops.artistId, artistId),
        or(
          eq(drops.eventId, eventId),
          and(isNull(drops.eventId), eq(drops.tourId, tourId)),
        ),
        or(eq(drops.status, "live"), eq(drops.status, "scheduled")),
      ),
    )
    .orderBy(desc(drops.displayPriority), desc(drops.startsAt));
}

/** Standalone event pieces not bundled into a drop. */
export async function listStandaloneProductsForEvent(eventId: string, artistId: string) {
  const rows = await db
    .select(productCore)
    .from(products)
    .where(
      and(eq(products.artistId, artistId), eq(products.eventId, eventId), eq(products.active, true)),
    )
    .orderBy(asc(products.name));
  return enrichProductRows(rows);
}

export async function listPublishedDropsForArtist(artistId: string, now = demoNow()) {
  return db
    .select(dropCore)
    .from(drops)
    .innerJoin(artists, eq(artists.id, drops.artistId))
    .where(
      and(
        eq(drops.artistId, artistId),
        or(eq(drops.status, "live"), eq(drops.status, "scheduled")),
        lte(drops.startsAt, now),
      ),
    )
    .orderBy(desc(drops.displayPriority), desc(drops.startsAt));
}

export async function getDropBySlug(artistId: string, slug: string) {
  const [row] = await db
    .select(dropCore)
    .from(drops)
    .innerJoin(artists, eq(artists.id, drops.artistId))
    .where(and(eq(drops.artistId, artistId), eq(drops.slug, slug)))
    .limit(1);
  return row ?? null;
}

export async function listDropProducts(dropId: string) {
  const rows = await db
    .select({
      dropProductId: dropProducts.id,
      dropPriceCents: dropProducts.dropPriceCents,
      displayOrder: dropProducts.displayOrder,
      id: products.id,
      slug: products.slug,
      name: products.name,
      tagline: products.tagline,
      images: products.images,
      basePriceCents: products.basePriceCents,
      accessType: products.accessType,
      eventId: products.eventId,
      tourId: products.tourId,
      availableFrom: products.availableFrom,
      availableUntil: products.availableUntil,
      category: products.category,
    })
    .from(dropProducts)
    .innerJoin(products, eq(products.id, dropProducts.productId))
    .where(eq(dropProducts.dropId, dropId))
    .orderBy(asc(dropProducts.displayOrder));
  return enrichProductRows(rows);
}

/* ------------------------------------------------------------------ *
 * Bundles
 * ------------------------------------------------------------------ */

export async function getBundleBySlug(artistId: string, slug: string) {
  const [row] = await db
    .select()
    .from(bundles)
    .where(and(eq(bundles.artistId, artistId), eq(bundles.slug, slug), eq(bundles.active, true)))
    .limit(1);
  return row ?? null;
}

export async function listBundleItems(bundleId: string) {
  const rows = await db
    .select({
      id: bundleItems.id,
      quantity: bundleItems.quantity,
      displayOrder: bundleItems.displayOrder,
      variantId: bundleItems.variantId,
      productId: products.id,
      productSlug: products.slug,
      productName: products.name,
      productImages: products.images,
      basePriceCents: products.basePriceCents,
    })
    .from(bundleItems)
    .innerJoin(products, eq(products.id, bundleItems.productId))
    .where(eq(bundleItems.bundleId, bundleId))
    .orderBy(asc(bundleItems.displayOrder));

  return rows.map((row) => ({
    ...row,
    productImages: resolveProductImages(row.productId, row.productImages),
  }));
}

export async function listActiveBundlesForEvent(eventId: string, artistId: string) {
  const rows = await db
    .select()
    .from(bundles)
    .where(
      and(
        eq(bundles.artistId, artistId),
        eq(bundles.eventId, eventId),
        eq(bundles.active, true),
      ),
    )
    .orderBy(asc(bundles.name));

  return Promise.all(
    rows.map(async (bundle) => {
      const items = await listBundleItems(bundle.id);
      const retailSum = items.reduce(
        (sum, item) => sum + item.basePriceCents * item.quantity,
        0,
      );
      return {
        bundle,
        items,
        savingsCents: Math.max(0, retailSum - bundle.bundlePriceCents),
      };
    }),
  );
}
