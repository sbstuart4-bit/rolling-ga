import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  LOW_COUNTRY_PRODUCTS,
  MARISOL_PRODUCTS,
  NOVA_KESTREL_PRODUCTS,
  THE_DEGENS_PRODUCTS,
  type ProductDefinition,
} from "@/db/seed/definitions";
import { buildDemoAssetAudit, unmappedProductAssets } from "@/lib/demo-asset-audit";
import { DEMO_PRODUCT_IMAGES, demoProductImage } from "@/lib/demo-assets";
import { resolveProductImage } from "@/lib/demo-product-images";
import { isEligibleForProduct } from "@/server/catalog/queries";
import {
  createArtist,
  createEvent,
  createProduct,
  createTour,
  createVenue,
} from "./helpers";

const PUBLIC_DEMO = resolve(process.cwd(), "public", "demo");

/** The 18 products added in P1.1 — ids align with /public/demo filenames. */
export const P1_1_NEW_PRODUCTS = [
  { id: "prd_av_skateboard", artistId: "art_the_degens", accessType: "public" as const },
  { id: "prd_nk_hat", artistId: "art_nova_kestrel", accessType: "public" as const },
  { id: "prd_nk_tote", artistId: "art_nova_kestrel", accessType: "public" as const },
  { id: "prd_nk_poster", artistId: "art_nova_kestrel", accessType: "public" as const },
  { id: "prd_nk_nashville_poster", artistId: "art_nova_kestrel", accessType: "event_specific" as const },
  { id: "prd_nk_necklace", artistId: "art_nova_kestrel", accessType: "public" as const },
  { id: "prd_lc_bandana", artistId: "art_low_country", accessType: "public" as const },
  { id: "prd_lc_cap", artistId: "art_low_country", accessType: "public" as const },
  { id: "prd_lc_notebook", artistId: "art_low_country", accessType: "public" as const },
  { id: "prd_lc_austin_tee", artistId: "art_low_country", accessType: "event_specific" as const },
  { id: "prd_mr_vinyl", artistId: "art_marisol_reyes", accessType: "public" as const },
  { id: "prd_mr_scarf", artistId: "art_marisol_reyes", accessType: "public" as const },
  { id: "prd_mr_tote", artistId: "art_marisol_reyes", accessType: "public" as const },
  { id: "prd_mr_longsleeve", artistId: "art_marisol_reyes", accessType: "public" as const },
  { id: "prd_mr_fan", artistId: "art_marisol_reyes", accessType: "public" as const },
  { id: "prd_mr_7inch", artistId: "art_marisol_reyes", accessType: "public" as const },
  { id: "prd_mr_city_tee", artistId: "art_marisol_reyes", accessType: "event_specific" as const },
  { id: "prd_mr_necklace", artistId: "art_marisol_reyes", accessType: "public" as const },
] as const;

const ALL_PRODUCTS: ProductDefinition[] = [
  ...THE_DEGENS_PRODUCTS,
  ...NOVA_KESTREL_PRODUCTS,
  ...LOW_COUNTRY_PRODUCTS,
  ...MARISOL_PRODUCTS,
];

const PRODUCTS_BY_ARTIST: Record<string, ProductDefinition[]> = {
  art_the_degens: THE_DEGENS_PRODUCTS,
  art_nova_kestrel: NOVA_KESTREL_PRODUCTS,
  art_low_country: LOW_COUNTRY_PRODUCTS,
  art_marisol_reyes: MARISOL_PRODUCTS,
};

describe("P1.1 demo catalog completion", () => {
  it("defines all 18 new products in seed definitions", () => {
    for (const expected of P1_1_NEW_PRODUCTS) {
      const found = ALL_PRODUCTS.find((p) => p.id === expected.id);
      expect(found, expected.id).toBeDefined();
    }
    expect(ALL_PRODUCTS).toHaveLength(40);
  });

  it("maps all 18 new products to canonical PNG paths", () => {
    for (const { id } of P1_1_NEW_PRODUCTS) {
      const path = demoProductImage(id);
      expect(path, id).toBeDefined();
      expect(path).toMatch(/^\/demo\/product-.+\.png$/);
      expect(existsSync(resolve(PUBLIC_DEMO, path!.replace(/^\/demo\//, "")))).toBe(true);
    }
    expect(Object.keys(DEMO_PRODUCT_IMAGES)).toHaveLength(ALL_PRODUCTS.length);
  });

  it("uses unique slugs across the full demo catalog", () => {
    const slugs = ALL_PRODUCTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("assigns each new product to the correct artist catalog", () => {
    for (const { id, artistId } of P1_1_NEW_PRODUCTS) {
      expect(PRODUCTS_BY_ARTIST[artistId]?.some((p) => p.id === id)).toBe(true);
    }
  });

  it("resolves PNG not SVG for every new product", () => {
    for (const { id } of P1_1_NEW_PRODUCTS) {
      const svg = `/demo/product-${id.replace(/_/g, "-")}.svg`;
      expect(resolveProductImage(id, [svg])).toBe(demoProductImage(id));
    }
  });

  it("does not cross-resolve images between artists", () => {
    expect(resolveProductImage("prd_nk_hat", null)).not.toBe(resolveProductImage("prd_lc_cap", null));
    expect(resolveProductImage("prd_mr_vinyl", null)).not.toBe(resolveProductImage("prd_av_skateboard", null));
  });

  it("seeds apparel sizes on new apparel products", () => {
    const apparel = ALL_PRODUCTS.filter((p) =>
      ["prd_lc_austin_tee", "prd_mr_city_tee", "prd_mr_longsleeve"].includes(p.id),
    );
    for (const product of apparel) {
      expect(product.sizes?.length).toBeGreaterThan(0);
    }
  });

  it("applies event_specific eligibility to show-exclusive new products", async () => {
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);

    const locked = await createProduct(artist.id, {
      accessType: "event_specific",
      eventId: event.id,
    });

    const result = await isEligibleForProduct(locked, {
      attendedEventIds: [],
      attendedTourIds: [],
      attendedArtistIds: [],
    });

    expect(result.eligible).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it("reports zero unmapped product PNGs from the P1.1 list", () => {
    const audit = buildDemoAssetAudit();
    const unmapped = unmappedProductAssets(audit);
    const p1Filenames = P1_1_NEW_PRODUCTS.map(
      (p) => `product-${p.id.replace(/_/g, "-")}.png`,
    );
    for (const filename of p1Filenames) {
      expect(unmapped.map((e) => e.filename)).not.toContain(filename);
    }
  });
});
