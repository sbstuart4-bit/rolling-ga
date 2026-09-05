import "server-only";
import { and, asc, count, desc, eq, inArray, isNull, or, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import {
  bundleItems,
  bundles,
  dropProducts,
  drops,
  events,
  inventory,
  orderItems,
  orders,
  products,
  productVariants,
  shippingOptions,
  tours,
  venues,
} from "@/db/schema";
import {
  availableUnits,
  classifyMerchSections,
  computeProductEconomics,
  inventoryStatus,
  resolveAvailabilityChannel,
  type AvailabilityChannel,
  type MerchSection,
  type ProductEconomics,
  type ShowAssortmentCounts,
} from "@/lib/merch-catalog";
import type { ShippingStrategy } from "@/lib/types";
import { assertArtistAccess } from "@/server/auth/guards";
import type { AuthContext } from "@/server/auth/session";
import { getEventById, type EventRow } from "@/server/events/queries";

export interface StudioProductRow {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  story: string | null;
  category: typeof products.$inferSelect.category;
  accessType: typeof products.$inferSelect.accessType;
  availableFrom: Date | null;
  availableUntil: Date | null;
  basePriceCents: number;
  unitCostCents: number | null;
  sku: string;
  images: string[] | null;
  producedQuantity: number | null;
  isDigital: boolean;
  active: boolean;
  artistId: string;
  tourId: string | null;
  eventId: string | null;
  tourName: string | null;
  eventCity: string | null;
}

export interface StudioProductSummary extends StudioProductRow {
  sections: MerchSection[];
  availabilityChannel: AvailabilityChannel;
  inventoryStatus: ReturnType<typeof inventoryStatus>;
  totalAvailable: number;
  totalOnHand: number;
  totalReserved: number;
  totalSold: number;
}

export interface StudioMerchDashboard {
  sections: Record<MerchSection, StudioProductSummary[]>;
  bundles: Awaited<ReturnType<typeof listBundlesForArtist>>;
  primaryEvent: EventRow | null;
  assortmentPreview: ShowAssortmentCounts | null;
}

const productSelect = {
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
  unitCostCents: products.unitCostCents,
  sku: products.sku,
  images: products.images,
  producedQuantity: products.producedQuantity,
  isDigital: products.isDigital,
  active: products.active,
  artistId: products.artistId,
  tourId: products.tourId,
  eventId: products.eventId,
  tourName: tours.name,
  eventCity: venues.city,
} as const;

async function loadVariantAggregates(productIds: string[]) {
  if (productIds.length === 0) return new Map<string, { onHand: number; reserved: number; reorderPoint: number; variants: { onHand: number | null; reserved: number | null; reorderPoint: number | null }[] }>();

  const rows = await db
    .select({
      productId: productVariants.productId,
      onHand: inventory.onHand,
      reserved: inventory.reserved,
      reorderPoint: inventory.reorderPoint,
    })
    .from(productVariants)
    .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
    .where(and(inArray(productVariants.productId, productIds), eq(productVariants.active, true)));

  const map = new Map<string, { onHand: number; reserved: number; reorderPoint: number; variants: { onHand: number | null; reserved: number | null; reorderPoint: number | null }[] }>();

  for (const row of rows) {
    const existing = map.get(row.productId) ?? { onHand: 0, reserved: 0, reorderPoint: 0, variants: [] };
    existing.onHand += row.onHand ?? 0;
    existing.reserved += row.reserved ?? 0;
    existing.reorderPoint = Math.max(existing.reorderPoint, row.reorderPoint ?? 0);
    existing.variants.push({
      onHand: row.onHand,
      reserved: row.reserved,
      reorderPoint: row.reorderPoint,
    });
    map.set(row.productId, existing);
  }

  return map;
}

async function loadSoldCounts(productIds: string[]) {
  if (productIds.length === 0) return new Map<string, number>();

  const rows = await db
    .select({
      productId: orderItems.productId,
      total: sum(orderItems.quantity),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(inArray(orderItems.productId, productIds))
    .groupBy(orderItems.productId);

  return new Map(rows.filter((r) => r.productId).map((r) => [r.productId!, Number(r.total ?? 0)]));
}

function summarizeProduct(
  row: StudioProductRow,
  variantAgg: { onHand: number; reserved: number; reorderPoint: number; variants: { onHand: number | null; reserved: number | null; reorderPoint: number | null }[] },
  sold: number,
): StudioProductSummary {
  const totalAvailable = row.isDigital
    ? Infinity
    : variantAgg.variants.reduce((sum, v) => sum + availableUnits(v.onHand, v.reserved), 0);

  const hasPhysicalInventory = !row.isDigital && variantAgg.onHand > 0;

  return {
    ...row,
    sections: classifyMerchSections(row),
    availabilityChannel: resolveAvailabilityChannel(row, hasPhysicalInventory),
    inventoryStatus: inventoryStatus(variantAgg.variants, row.isDigital),
    totalAvailable: totalAvailable === Infinity ? sold + 999 : totalAvailable,
    totalOnHand: variantAgg.onHand,
    totalReserved: variantAgg.reserved,
    totalSold: sold,
  };
}

export async function listAllProductsForStudio(artistId: string, includeArchived = true) {
  const rows = await db
    .select(productSelect)
    .from(products)
    .leftJoin(tours, eq(tours.id, products.tourId))
    .leftJoin(events, eq(events.id, products.eventId))
    .leftJoin(venues, eq(venues.id, events.venueId))
    .where(
      and(
        eq(products.artistId, artistId),
        includeArchived ? sql`true` : eq(products.active, true),
      ),
    )
    .orderBy(asc(products.name));

  const productIds = rows.map((r) => r.id);
  const [variantMap, soldMap] = await Promise.all([
    loadVariantAggregates(productIds),
    loadSoldCounts(productIds),
  ]);

  return rows.map((row) => {
    const agg = variantMap.get(row.id) ?? { onHand: 0, reserved: 0, reorderPoint: 0, variants: [] };
    return summarizeProduct(row, agg, soldMap.get(row.id) ?? 0);
  });
}

export async function loadMerchDashboard(
  ctx: AuthContext,
  artistId: string,
  primaryEventId?: string | null,
): Promise<StudioMerchDashboard> {
  assertArtistAccess(ctx, artistId);

  const [allProducts, bundleRows, primaryEvent] = await Promise.all([
    listAllProductsForStudio(artistId, true),
    listBundlesForArtist(artistId),
    primaryEventId ? getEventById(primaryEventId) : Promise.resolve(null),
  ]);

  const sections = {
    tour_core: [] as StudioProductSummary[],
    endless_aisle: [] as StudioProductSummary[],
    city_exclusives: [] as StudioProductSummary[],
    premium: [] as StudioProductSummary[],
    vinyl_collectibles: [] as StudioProductSummary[],
    archive: [] as StudioProductSummary[],
  };

  for (const product of allProducts) {
    for (const section of product.sections) {
      sections[section].push(product);
    }
  }

  const assortmentPreview =
    primaryEvent && primaryEvent.artistId === artistId
      ? computeShowAssortment(allProducts, primaryEvent)
      : null;

  return { sections, bundles: bundleRows, primaryEvent, assortmentPreview };
}

export async function getProductForStudio(
  ctx: AuthContext,
  artistId: string,
  productId: string,
) {
  assertArtistAccess(ctx, artistId);

  const [row] = await db
    .select(productSelect)
    .from(products)
    .leftJoin(tours, eq(tours.id, products.tourId))
    .leftJoin(events, eq(events.id, products.eventId))
    .leftJoin(venues, eq(venues.id, events.venueId))
    .where(and(eq(products.id, productId), eq(products.artistId, artistId)))
    .limit(1);

  if (!row) return null;

  const [variants, soldMap, dropLinks, variantMap] = await Promise.all([
    db
      .select({
        id: productVariants.id,
        sku: productVariants.sku,
        size: productVariants.size,
        color: productVariants.color,
        priceDeltaCents: productVariants.priceDeltaCents,
        displayOrder: productVariants.displayOrder,
        active: productVariants.active,
        onHand: inventory.onHand,
        reserved: inventory.reserved,
        reorderPoint: inventory.reorderPoint,
      })
      .from(productVariants)
      .leftJoin(inventory, eq(inventory.variantId, productVariants.id))
      .where(eq(productVariants.productId, productId))
      .orderBy(asc(productVariants.displayOrder)),
    loadSoldCounts([productId]),
    db
      .select({
        dropId: drops.id,
        dropTitle: drops.title,
        dropStatus: drops.status,
        dropPriceCents: dropProducts.dropPriceCents,
      })
      .from(dropProducts)
      .innerJoin(drops, eq(drops.id, dropProducts.dropId))
      .where(eq(dropProducts.productId, productId))
      .orderBy(desc(drops.startsAt)),
    loadVariantAggregates([productId]),
  ]);

  const agg = variantMap.get(productId) ?? { onHand: 0, reserved: 0, reorderPoint: 0, variants: [] };
  const summary = summarizeProduct(row, agg, soldMap.get(productId) ?? 0);
  const economics = await loadProductEconomics(artistId, row.tourId, row.basePriceCents, row.unitCostCents);

  let eventLabel: string | null = null;
  if (row.eventId) {
    const event = await getEventById(row.eventId);
    eventLabel = event ? `${event.venueCity} · ${event.venueName}` : null;
  }

  return {
    product: summary,
    variants,
    drops: dropLinks,
    economics,
    eventLabel,
  };
}

async function loadProductEconomics(
  artistId: string,
  tourId: string | null,
  basePriceCents: number,
  unitCostCents: number | null,
): Promise<ProductEconomics> {
  const [shippingRow, tourRow] = await Promise.all([
    db
      .select({
        carrierCostCents: shippingOptions.carrierCostCents,
        baseCustomerChargeCents: shippingOptions.baseCustomerChargeCents,
        subsidyCents: shippingOptions.subsidyCents,
        strategy: shippingOptions.strategy,
      })
      .from(shippingOptions)
      .where(
        and(
          eq(shippingOptions.artistId, artistId),
          tourId ? or(eq(shippingOptions.tourId, tourId), isNull(shippingOptions.tourId)) : isNull(shippingOptions.tourId),
        ),
      )
      .orderBy(desc(shippingOptions.tourId))
      .limit(1),
    tourId
      ? db
          .select({ shippingStrategy: tours.shippingStrategy })
          .from(tours)
          .where(eq(tours.id, tourId))
          .limit(1)
      : Promise.resolve([]),
  ]);

  const shipping = shippingRow[0];
  const strategy = (tourRow[0]?.shippingStrategy ?? shipping?.strategy ?? null) as ShippingStrategy | null;

  return computeProductEconomics({
    basePriceCents,
    unitCostCents,
    carrierCostCents: shipping?.carrierCostCents ?? null,
    shippingStrategy: strategy,
    baseCustomerChargeCents: shipping?.baseCustomerChargeCents ?? null,
    subsidyCents: shipping?.subsidyCents ?? null,
  });
}

export function computeShowAssortment(
  products: StudioProductSummary[],
  event: Pick<EventRow, "id" | "tourId">,
): ShowAssortmentCounts {
  const physicalCoreIds = new Set<string>();
  const rollingGaIds = new Set<string>();
  const exclusiveIds = new Set<string>();
  const allIds = new Set<string>();

  for (const product of products) {
    if (!product.active) continue;

    const isExclusive = product.eventId === event.id;
    const isTourPhysical =
      !product.isDigital &&
      product.category !== "digital" &&
      (product.tourId === event.tourId || product.accessType === "tour_specific");
    const isEndless =
      product.isDigital ||
      product.category === "digital" ||
      (product.tourId === event.tourId && product.accessType === "public");

    if (isExclusive) {
      exclusiveIds.add(product.id);
      allIds.add(product.id);
    }
    if (isTourPhysical && !isExclusive) {
      physicalCoreIds.add(product.id);
      allIds.add(product.id);
    }
    if (isEndless && !isExclusive) {
      rollingGaIds.add(product.id);
      allIds.add(product.id);
    }
  }

  return {
    physicalCore: physicalCoreIds.size,
    rollingGaExtended: rollingGaIds.size,
    cityExclusives: exclusiveIds.size,
    totalAvailable: allIds.size,
  };
}

export async function loadShowAssortment(
  ctx: AuthContext,
  artistId: string,
  eventId: string,
) {
  assertArtistAccess(ctx, artistId);
  const event = await getEventById(eventId);
  if (!event || event.artistId !== artistId) return null;

  const allProducts = await listAllProductsForStudio(artistId, false);
  const counts = computeShowAssortment(allProducts, event);

  const physicalCore = allProducts.filter(
    (p) =>
      p.active &&
      !p.isDigital &&
      p.category !== "digital" &&
      p.eventId !== event.id &&
      (p.tourId === event.tourId || p.accessType === "tour_specific"),
  );

  const rollingGaExtended = allProducts.filter(
    (p) =>
      p.active &&
      p.eventId !== event.id &&
      (p.isDigital ||
        p.category === "digital" ||
        (p.tourId === event.tourId && p.accessType === "public")),
  );

  const cityExclusives = allProducts.filter((p) => p.active && p.eventId === event.id);

  return { event, counts, physicalCore, rollingGaExtended, cityExclusives };
}

export async function listBundlesForArtist(artistId: string) {
  const rows = await db
    .select({
      id: bundles.id,
      slug: bundles.slug,
      name: bundles.name,
      description: bundles.description,
      bundlePriceCents: bundles.bundlePriceCents,
      accessType: bundles.accessType,
      active: bundles.active,
      tourId: bundles.tourId,
      eventId: bundles.eventId,
      itemCount: count(bundleItems.id),
    })
    .from(bundles)
    .leftJoin(bundleItems, eq(bundleItems.bundleId, bundles.id))
    .where(and(eq(bundles.artistId, artistId), eq(bundles.active, true)))
    .groupBy(bundles.id)
    .orderBy(asc(bundles.name));

  return rows.map((row) => ({ ...row, itemCount: Number(row.itemCount) }));
}

export async function getBundleForStudio(ctx: AuthContext, artistId: string, bundleId: string) {
  assertArtistAccess(ctx, artistId);

  const [bundle] = await db
    .select()
    .from(bundles)
    .where(and(eq(bundles.id, bundleId), eq(bundles.artistId, artistId)))
    .limit(1);

  if (!bundle) return null;

  const items = await db
    .select({
      id: bundleItems.id,
      quantity: bundleItems.quantity,
      displayOrder: bundleItems.displayOrder,
      productId: products.id,
      productName: products.name,
      basePriceCents: products.basePriceCents,
      images: products.images,
    })
    .from(bundleItems)
    .innerJoin(products, eq(products.id, bundleItems.productId))
    .where(eq(bundleItems.bundleId, bundleId))
    .orderBy(asc(bundleItems.displayOrder));

  const retailSum = items.reduce((sum, item) => sum + item.basePriceCents * item.quantity, 0);
  const savingsCents = Math.max(0, retailSum - bundle.bundlePriceCents);

  return { bundle, items, retailSum, savingsCents };
}

export async function listEventsForMerchPicker(artistId: string) {
  const { listEventsForArtist } = await import("@/server/events/queries");
  return listEventsForArtist(artistId);
}

export async function listToursForMerchPicker(artistId: string) {
  return db
    .select({ id: tours.id, name: tours.name })
    .from(tours)
    .where(eq(tours.artistId, artistId))
    .orderBy(asc(tours.name));
}

export async function requireProductForArtist(productId: string, artistId: string) {
  const [row] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.artistId, artistId)))
    .limit(1);
  return row ?? null;
}
