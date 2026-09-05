/**
 * Canonical demo drop artwork resolution.
 *
 * Degens drops have real poster PNGs. Other artists only have generated SVG placeholders
 * at seed time — at runtime we prefer product photography instead of those fillers.
 */
import { THE_DEGENS_DEMO_ASSETS } from "@/lib/demo-assets";
import { resolveProductImage } from "@/lib/demo-product-images";

const GENERATED_POSTER_SVG_PATTERN = /^\/demo\/poster-.+\.svg$/i;

/** Seeded drop slugs with canonical poster pngs. */
export const DEMO_DROP_ARTWORK_BY_SLUG: Partial<Record<string, string>> = {
  "signal-decay-preview": THE_DEGENS_DEMO_ASSETS.dropPosters["signal-decay-preview"],
  "detroit-tonight": THE_DEGENS_DEMO_ASSETS.dropPosters["detroit-tonight"],
  "detroit-encore": THE_DEGENS_DEMO_ASSETS.dropPosters["detroit-encore"],
  "detroit-one-year": THE_DEGENS_DEMO_ASSETS.dropPosters["detroit-anniversary"],
  "toronto-preview": THE_DEGENS_DEMO_ASSETS.dropPosters["toronto-preview"],
  "chicago-scheduled": THE_DEGENS_DEMO_ASSETS.dropPosters["chicago-scheduled"],
};

export function isGeneratedDemoPosterSvg(url: string | null | undefined): boolean {
  return Boolean(url && GENERATED_POSTER_SVG_PATTERN.test(url));
}

export function resolveDropArtwork(input: {
  dropSlug: string;
  storedArtworkUrl?: string | null;
  fallbackProductId?: string;
  fallbackProductImages?: string[] | null;
}): string | null {
  const canonical = DEMO_DROP_ARTWORK_BY_SLUG[input.dropSlug];
  if (canonical) return canonical;

  if (input.fallbackProductId) {
    const productImage = resolveProductImage(
      input.fallbackProductId,
      input.fallbackProductImages,
    );
    if (productImage) return productImage;
  }

  if (input.storedArtworkUrl && !isGeneratedDemoPosterSvg(input.storedArtworkUrl)) {
    return input.storedArtworkUrl;
  }

  return null;
}

export function enrichDropArtwork<
  T extends { slug: string; artworkUrl: string | null },
>(
  drop: T,
  firstProduct?: { id: string; images: string[] | null },
): T {
  const artworkUrl = resolveDropArtwork({
    dropSlug: drop.slug,
    storedArtworkUrl: drop.artworkUrl,
    fallbackProductId: firstProduct?.id,
    fallbackProductImages: firstProduct?.images,
  });
  return { ...drop, artworkUrl };
}
