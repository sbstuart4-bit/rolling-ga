import type { EventHubModuleData } from "@/components/fan/event-hub-modules";
import type { LockedPreviewProduct } from "@/components/fan/event-locked-merch-preview";
import type { loadEventShopCatalog } from "@/server/events/shop";

type ShopCatalog = Awaited<ReturnType<typeof loadEventShopCatalog>>;

function isAttendeeExclusive(accessType?: string | null): boolean {
  return accessType === "verified_attendee" || accessType === "event_specific";
}

/** Derives hub tile counts from the event shop catalog. */
export function buildEventHubModuleData(
  catalog: ShopCatalog,
  contentCount: number,
): EventHubModuleData {
  const { dropSections, standaloneProducts } = catalog;

  const activeDropSections = dropSections.filter((section) => !section.expired && !section.notStarted);
  const tonightItemCount = activeDropSections.reduce(
    (total, section) => total + section.products.length,
    0,
  );

  const exclusiveCount = [
    ...dropSections.flatMap((section) => section.products),
    ...standaloneProducts.map(({ product }) => product),
  ].filter((product) => isAttendeeExclusive(product.accessType)).length;

  const activeFlash = dropSections.find(
    (section) => section.isFlash && !section.expired && !section.notStarted && section.drop.endsAt,
  );

  return {
    tonightItemCount,
    exclusiveCount,
    merchCount: standaloneProducts.length,
    contentCount,
    flashDrop: activeFlash?.drop.endsAt
      ? {
          slug: activeFlash.drop.slug,
          title: activeFlash.drop.title,
          endsAt: activeFlash.drop.endsAt.toISOString(),
          artistId: activeFlash.drop.artistId,
          productLabel: activeFlash.products[0]?.name,
        }
      : null,
  };
}

/** First N catalog products for the pre-show locked preview strip. */
export function buildLockedPreviewProducts(
  catalog: ShopCatalog,
  artistId: string,
  limit = 4,
): LockedPreviewProduct[] {
  const seen = new Set<string>();
  const products: LockedPreviewProduct[] = [];

  for (const section of catalog.dropSections) {
    for (const item of section.products) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      products.push({
        id: item.id,
        slug: item.slug,
        name: item.name,
        tagline: item.tagline,
        images: item.images,
        priceCents: item.priceCents,
        accessType: item.accessType,
        category: item.category,
        artistId,
        dropExclusivity: section.drop.exclusivityType,
      });
      if (products.length >= limit) return products;
    }
  }

  for (const { product } of catalog.standaloneProducts) {
    if (seen.has(product.id)) continue;
    seen.add(product.id);
    products.push({
      id: product.id,
      slug: product.slug,
      name: product.name,
      tagline: product.tagline,
      images: product.images,
      priceCents: product.basePriceCents,
      accessType: product.accessType,
      category: product.category,
      artistId: product.artistId,
    });
    if (products.length >= limit) return products;
  }

  return products;
}
