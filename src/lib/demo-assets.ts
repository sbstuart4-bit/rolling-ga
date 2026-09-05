/**
 * Static demo photography under `public/demo/`.
 *
 * Product ids match seeded catalog records in `src/db/seed/definitions.ts`.
 * Generated SVG placeholders remain the fallback when no png is listed here.
 */

/** Every seeded demo product with a matching png in `/demo/`. */
export const DEMO_PRODUCT_IMAGES = {
  /* The Degens */
  prd_av_tour_tee: "/demo/product-prd-av-tour-tee.png",
  prd_av_hoodie: "/demo/product-prd-av-hoodie.png",
  prd_av_vinyl: "/demo/product-prd-av-vinyl.png",
  prd_av_cap: "/demo/product-prd-av-cap.png",
  prd_av_pin: "/demo/product-prd-av-pin.png",
  prd_av_detroit_tee: "/demo/product-prd-av-detroit-tee.png",
  prd_av_detroit_poster: "/demo/product-prd-av-detroit-poster.png",
  prd_av_detroit_pin: "/demo/product-prd-av-detroit-pin.png",
  prd_av_detroit_anniversary_hoodie: "/demo/product-prd-av-detroit-anniversary-hoodie.png",
  prd_av_toronto_tee: "/demo/product-prd-av-toronto-tee.png",
  prd_av_returning_print: "/demo/product-prd-av-returning-print.png",
  /* Nova Kestrel */
  prd_nk_tee: "/demo/product-prd-nk-tee.png",
  prd_nk_book: "/demo/product-prd-nk-book.png",
  prd_nk_nashville_tee: "/demo/product-prd-nk-nashville-tee.png",
  prd_nk_scarf: "/demo/product-prd-nk-scarf.jpg.png",
  prd_nk_single: "/demo/product-prd-nk-single.png",
  /* The Low Country */
  prd_lc_tee: "/demo/product-prd-lc-tee.png",
  prd_lc_austin_print: "/demo/product-prd-lc-austin-print.png",
  prd_lc_vinyl: "/demo/product-prd-lc-vinyl.png",
  prd_lc_tote: "/demo/product-prd-lc-tote.png",
  /* Marisol Reyes */
  prd_mr_tee: "/demo/product-prd-mr-tee.png",
  prd_mr_print: "/demo/product-prd-mr-print.png",
} as const;

export type DemoProductId = keyof typeof DEMO_PRODUCT_IMAGES;

const DEGENS_PRODUCT_IDS = [
  "prd_av_tour_tee",
  "prd_av_hoodie",
  "prd_av_vinyl",
  "prd_av_cap",
  "prd_av_pin",
  "prd_av_detroit_tee",
  "prd_av_detroit_poster",
  "prd_av_detroit_pin",
  "prd_av_detroit_anniversary_hoodie",
  "prd_av_toronto_tee",
  "prd_av_returning_print",
] as const satisfies readonly DemoProductId[];

/** @deprecated Prefer `demoProductImage()` — kept for marketing fixture call sites. */
export const THE_DEGENS_PRODUCT_IMAGES = Object.fromEntries(
  DEGENS_PRODUCT_IDS.map((id) => [id, DEMO_PRODUCT_IMAGES[id]]),
) as {
  [K in (typeof DEGENS_PRODUCT_IDS)[number]]: (typeof DEMO_PRODUCT_IMAGES)[K];
};

/** The Degens — tour, city, drop poster art, and product photography. */
export const THE_DEGENS_DEMO_ASSETS = {
  logo: "/demo/logo-the-degens.png",
  cityDetroit: "/demo/city-atlas-detroit.png",
  tourHero: "/demo/poster-atlas-void-signal-decay.png",
  dropPosters: {
    "signal-decay-preview": "/demo/poster-signal-decay-preview.png",
    "detroit-tonight": "/demo/poster-detroit-tonight.png",
    "detroit-encore": "/demo/poster-detroit-encore.png",
    "detroit-anniversary": "/demo/poster-detroit-anniversary.png",
    "toronto-preview": "/demo/poster-toronto-preview.png",
    "chicago-scheduled": "/demo/poster-chicago-scheduled.png",
  },
  products: THE_DEGENS_PRODUCT_IMAGES,
} as const;

export type TheDegensDropArtworkKey = keyof typeof THE_DEGENS_DEMO_ASSETS.dropPosters;

/** Artist brand imagery (logo + hero) where static png art exists. */
export const DEMO_ARTIST_BRAND_IMAGES: Partial<
  Record<string, { logoUrl?: string; heroImageUrl?: string }>
> = {
  art_the_degens: {
    logoUrl: THE_DEGENS_DEMO_ASSETS.logo,
    heroImageUrl: THE_DEGENS_DEMO_ASSETS.tourHero,
  },
};

/** City hero art for seeded event themes. */
export const DEMO_EVENT_CITY_IMAGES: Partial<Record<string, string>> = {
  evt_atlas_detroit: THE_DEGENS_DEMO_ASSETS.cityDetroit,
};

export function demoProductImage(productId: string): string | undefined {
  return DEMO_PRODUCT_IMAGES[productId as DemoProductId];
}

export function theDegensProductImage(productId: string): string | undefined {
  return demoProductImage(productId);
}

export function theDegensDropPoster(artworkKey: string): string | undefined {
  return THE_DEGENS_DEMO_ASSETS.dropPosters[artworkKey as TheDegensDropArtworkKey];
}

export function demoArtistBrandImages(
  artistId: string,
): { logoUrl?: string; heroImageUrl?: string } | undefined {
  return DEMO_ARTIST_BRAND_IMAGES[artistId];
}

export function demoEventCityImage(eventId: string): string | undefined {
  return DEMO_EVENT_CITY_IMAGES[eventId];
}
