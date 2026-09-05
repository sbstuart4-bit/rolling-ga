import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  auditDemoAssetFile,
  buildDemoAssetAudit,
  missingProductAssets,
  unmappedProductAssets,
} from "@/lib/demo-asset-audit";
import {
  DEMO_PRODUCT_IMAGES,
  THE_DEGENS_DEMO_ASSETS,
  demoProductImage,
} from "@/lib/demo-assets";
import {
  enrichProductRow,
  isStaleDemoProductSvg,
  resolveProductImage,
  resolveProductImages,
} from "@/lib/demo-product-images";
import { isGeneratedDemoPosterSvg, resolveDropArtwork } from "@/lib/demo-drop-artwork";
import {
  LOW_COUNTRY_PRODUCTS,
  MARISOL_PRODUCTS,
  NOVA_KESTREL_PRODUCTS,
  THE_DEGENS_PRODUCTS,
} from "@/db/seed/definitions";

const PUBLIC_DEMO = resolve(process.cwd(), "public", "demo");

const ALL_SEEDED_PRODUCTS = [
  ...THE_DEGENS_PRODUCTS,
  ...NOVA_KESTREL_PRODUCTS,
  ...LOW_COUNTRY_PRODUCTS,
  ...MARISOL_PRODUCTS,
];

describe("DEMO_PRODUCT_IMAGES", () => {
  it("maps every seeded demo product to a png under /demo/", () => {
    expect(Object.keys(DEMO_PRODUCT_IMAGES)).toHaveLength(ALL_SEEDED_PRODUCTS.length);
    for (const product of ALL_SEEDED_PRODUCTS) {
      const url = demoProductImage(product.id);
      expect(url, product.id).toBeDefined();
      expect(url).toMatch(/^\/demo\/product-.+\.png$/);
    }
  });

  it("every canonical product png exists on disk", () => {
    for (const path of Object.values(DEMO_PRODUCT_IMAGES)) {
      const file = resolve(PUBLIC_DEMO, path.replace(/^\/demo\//, ""));
      expect(existsSync(file), path).toBe(true);
    }
  });
});

describe("resolveProductImages", () => {
  it("prefers canonical png over stale seeded svg", () => {
    const resolved = resolveProductImages("prd_nk_tee", ["/demo/product-prd-nk-tee.svg"]);
    expect(resolved[0]).toBe("/demo/product-prd-nk-tee.png");
  });

  it("returns canonical path for Nova Gold Hour products", () => {
    expect(resolveProductImage("prd_nk_tee", null)).toBe("/demo/product-prd-nk-tee.png");
    expect(resolveProductImage("prd_nk_book", null)).toBe("/demo/product-prd-nk-book.png");
    expect(resolveProductImage("prd_nk_single", null)).toBe("/demo/product-prd-nk-single.png");
  });

  it("enriches product rows in place", () => {
    const row = enrichProductRow({
      id: "prd_nk_book",
      images: ["/demo/product-prd-nk-book.svg"],
    });
    expect(row.images[0]).toBe("/demo/product-prd-nk-book.png");
  });

  it("detects stale demo svg placeholders", () => {
    expect(isStaleDemoProductSvg("/demo/product-prd-nk-tee.svg")).toBe(true);
    expect(isStaleDemoProductSvg("/demo/product-prd-nk-tee.png")).toBe(false);
  });
});

describe("THE_DEGENS_DEMO_ASSETS", () => {
  it("maps every Degens product id to a png under /demo/", () => {
    expect(Object.keys(THE_DEGENS_DEMO_ASSETS.products)).toHaveLength(11);
    for (const url of Object.values(THE_DEGENS_DEMO_ASSETS.products)) {
      expect(url).toMatch(/^\/demo\/product-prd-av-.+\.png$/);
    }
  });

  it("maps every Degens drop poster key", () => {
    expect(Object.keys(THE_DEGENS_DEMO_ASSETS.dropPosters)).toEqual([
      "signal-decay-preview",
      "detroit-tonight",
      "detroit-encore",
      "detroit-anniversary",
      "toronto-preview",
      "chicago-scheduled",
    ]);
  });

  it("Degens brand png files exist on disk", () => {
    for (const path of [
      THE_DEGENS_DEMO_ASSETS.logo,
      THE_DEGENS_DEMO_ASSETS.cityDetroit,
      THE_DEGENS_DEMO_ASSETS.tourHero,
    ]) {
      expect(existsSync(resolve(PUBLIC_DEMO, path.replace(/^\/demo\//, "")))).toBe(true);
    }
  });
});

describe("demo asset audit", () => {
  it("maps product filenames to entity ids", () => {
    const entry = auditDemoAssetFile("product-prd-nk-tee.png");
    expect(entry.entityId).toBe("prd_nk_tee");
    expect(entry.referenced).toBe(true);
    expect(entry.fileExists).toBe(true);
    expect(entry.broken).toBe(false);
  });

  it("flags unmapped product pngs", () => {
    const audit = buildDemoAssetAudit();
    const unmapped = unmappedProductAssets(audit);
    const filenames = unmapped.map((e) => e.filename);
    expect(filenames).toContain("product-prd-nk-hat.png");
    expect(filenames).toContain("product-prd-mr-vinyl.png");
    expect(filenames).not.toContain("product-prd-nk-tee.png");
  });

  it("reports no missing canonical product files", () => {
    const audit = buildDemoAssetAudit();
    expect(missingProductAssets(audit)).toEqual([]);
  });
});

describe("resolveDropArtwork", () => {
  it("flags generated poster svgs as filler", () => {
    expect(isGeneratedDemoPosterSvg("/demo/poster-gold-hour-drop.svg")).toBe(true);
    expect(isGeneratedDemoPosterSvg("/demo/poster-detroit-tonight.png")).toBe(false);
  });

  it("uses product photography instead of Nova filler posters", () => {
    const artwork = resolveDropArtwork({
      dropSlug: "gold-hour",
      storedArtworkUrl: "/demo/poster-gold-hour-drop.svg",
      fallbackProductId: "prd_nk_tee",
      fallbackProductImages: ["/demo/product-prd-nk-tee.svg"],
    });
    expect(artwork).toBe("/demo/product-prd-nk-tee.png");
  });

  it("prefers canonical Degens poster pngs over stale svg", () => {
    const artwork = resolveDropArtwork({
      dropSlug: "detroit-tonight",
      storedArtworkUrl: "/demo/poster-detroit-tonight.svg",
    });
    expect(artwork).toBe(THE_DEGENS_DEMO_ASSETS.dropPosters["detroit-tonight"]);
  });
});
