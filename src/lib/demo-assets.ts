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
  prd_av_skateboard: "/demo/product-prd-av-skateboard.png",
  /* Nova Kestrel */
  prd_nk_tee: "/demo/product-prd-nk-tee.png",
  prd_nk_book: "/demo/product-prd-nk-book.png",
  prd_nk_nashville_tee: "/demo/product-prd-nk-nashville-tee.png",
  prd_nk_scarf: "/demo/product-prd-nk-scarf.jpg.png",
  prd_nk_single: "/demo/product-prd-nk-single.png",
  prd_nk_hat: "/demo/product-prd-nk-hat.png",
  prd_nk_tote: "/demo/product-prd-nk-tote.png",
  prd_nk_poster: "/demo/product-prd-nk-poster.png",
  prd_nk_nashville_poster: "/demo/product-prd-nk-nashville-poster.png",
  prd_nk_necklace: "/demo/product-prd-nk-necklace.png",
  /* The Low Country */
  prd_lc_tee: "/demo/product-prd-lc-tee.png",
  prd_lc_austin_print: "/demo/product-prd-lc-austin-print.png",
  prd_lc_vinyl: "/demo/product-prd-lc-vinyl.png",
  prd_lc_tote: "/demo/product-prd-lc-tote.png",
  prd_lc_bandana: "/demo/product-prd-lc-bandana.png",
  prd_lc_cap: "/demo/product-prd-lc-cap.png",
  prd_lc_notebook: "/demo/product-prd-lc-notebook.png",
  prd_lc_austin_tee: "/demo/product-prd-lc-austin-tee.png",
  /* Marisol Reyes */
  prd_mr_tee: "/demo/product-prd-mr-tee.png",
  prd_mr_print: "/demo/product-prd-mr-print.png",
  prd_mr_vinyl: "/demo/product-prd-mr-vinyl.png",
  prd_mr_scarf: "/demo/product-prd-mr-scarf.png",
  prd_mr_tote: "/demo/product-prd-mr-tote.png",
  prd_mr_hoodie: "/demo/product-prd-mr-hoodie.png",
  prd_mr_hat: "/demo/product-prd-mr-hat.png",
  prd_mr_7inch: "/demo/product-prd-mr-7inch.png",
  prd_mr_city_tee: "/demo/product-prd-mr-city-tee.png",
  prd_mr_necklace: "/demo/product-prd-mr-necklace.png",
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
  "prd_av_skateboard",
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
  hero: "/demo/hero-the-degens.png",
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

/** Marisol Reyes — brand hero and Brooklyn show photography. */
export const MARISOL_REYES_DEMO_ASSETS = {
  hero: "/demo/hero-marisol-reyes.png",
} as const;

/** Nova Kestrel — brand hero and Nashville show photography. */
export const NOVA_KESTREL_DEMO_ASSETS = {
  hero: "/demo/hero-nova-kestrel.png",
} as const;

/** The Low Country — brand hero photography. */
export const THE_LOW_COUNTRY_DEMO_ASSETS = {
  hero: "/demo/hero-the-low-country.png",
} as const;

/** Pale Horses — brand hero photography. */
export const PALE_HORSES_DEMO_ASSETS = {
  hero: "/demo/hero-pale-horses.png",
} as const;

/** The Ossuary — brand hero photography. */
export const THE_OSSUARY_DEMO_ASSETS = {
  hero: "/demo/hero-the-ossuary.png",
} as const;

export type TheDegensDropArtworkKey = keyof typeof THE_DEGENS_DEMO_ASSETS.dropPosters;

/** DJ Vantablack — brand hero photography. */
export const DJ_VANTABLACK_DEMO_ASSETS = {
  hero: "/demo/hero-dj-vantablack.png",
} as const;

/** Kite & Anchor — real band photography for passport / My Shows thumbnails. */
export const KITE_AND_ANCHOR_DEMO_ASSETS = {
  hero: "/demo/hero-kite-and-anchor.png",
} as const;

/** Artist brand imagery (logo + hero) where static png art exists. */
export const DEMO_ARTIST_BRAND_IMAGES: Partial<
  Record<string, { logoUrl?: string; heroImageUrl?: string }>
> = {
  art_the_degens: {
    logoUrl: THE_DEGENS_DEMO_ASSETS.logo,
    heroImageUrl: THE_DEGENS_DEMO_ASSETS.hero,
  },
  art_nova_kestrel: {
    heroImageUrl: NOVA_KESTREL_DEMO_ASSETS.hero,
  },
  art_low_country: {
    heroImageUrl: THE_LOW_COUNTRY_DEMO_ASSETS.hero,
  },
  art_marisol_reyes: {
    heroImageUrl: MARISOL_REYES_DEMO_ASSETS.hero,
  },
  art_pale_horses: {
    heroImageUrl: PALE_HORSES_DEMO_ASSETS.hero,
  },
  art_kite_anchor: {
    heroImageUrl: KITE_AND_ANCHOR_DEMO_ASSETS.hero,
  },
  art_vantablack: {
    heroImageUrl: DJ_VANTABLACK_DEMO_ASSETS.hero,
  },
  art_ossuary: {
    heroImageUrl: THE_OSSUARY_DEMO_ASSETS.hero,
  },
};

/** City hero art for seeded event themes. */
export const DEMO_EVENT_CITY_IMAGES: Partial<Record<string, string>> = {
  evt_atlas_detroit: THE_DEGENS_DEMO_ASSETS.cityDetroit,
  evt_nova_nashville: NOVA_KESTREL_DEMO_ASSETS.hero,
  evt_marisol_brooklyn: MARISOL_REYES_DEMO_ASSETS.hero,
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
