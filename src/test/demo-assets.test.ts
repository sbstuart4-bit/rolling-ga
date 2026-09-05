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
import { enrichResolvedTheme } from "@/lib/demo-theme-assets";
import type { ResolvedTheme } from "@/lib/theme";
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
    expect(Object.keys(THE_DEGENS_DEMO_ASSETS.products)).toHaveLength(12);
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

  it("reports no unmapped product pngs for seeded catalog", () => {
    const audit = buildDemoAssetAudit();
    const unmapped = unmappedProductAssets(audit);
    expect(unmapped).toHaveLength(0);
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

  it("uses Low Country product photo for river-sessions drop", () => {
    const artwork = resolveDropArtwork({
      dropSlug: "river-sessions",
      storedArtworkUrl: "/demo/poster-river-sessions-drop.svg",
      fallbackProductId: "prd_lc_tee",
      fallbackProductImages: ["/demo/product-prd-lc-tee.svg"],
    });
    expect(artwork).toBe("/demo/product-prd-lc-tee.png");
  });
});

describe("all four demo artists — product photography", () => {
  const byArtist = [
    { label: "The Degens", products: THE_DEGENS_PRODUCTS },
    { label: "Nova Kestrel", products: NOVA_KESTREL_PRODUCTS },
    { label: "The Low Country", products: LOW_COUNTRY_PRODUCTS },
    { label: "Marisol Reyes", products: MARISOL_PRODUCTS },
  ] as const;

  for (const { label, products } of byArtist) {
    it(`${label}: every seeded product resolves to PNG, never stale SVG`, () => {
      for (const product of products) {
        const svg = `/demo/product-${product.id.replace(/_/g, "-")}.svg`;
        const resolved = resolveProductImage(product.id, [svg]);
        expect(resolved, product.id).toMatch(/^\/demo\/product-.+\.png$/);
        expect(resolved, product.id).not.toMatch(/\.svg$/);
      }
    });
  }

  it("does not cross-resolve product assets between artists", () => {
    expect(resolveProductImage("prd_nk_tee", null)).not.toBe(
      resolveProductImage("prd_lc_tee", null),
    );
    expect(resolveProductImage("prd_mr_print", null)).not.toBe(
      resolveProductImage("prd_av_tour_tee", null),
    );
  });
});

describe("enrichResolvedTheme", () => {
  const emptyProvenance = {
    background: null,
    surface: null,
    foreground: null,
    mutedForeground: null,
    accent: null,
    accentForeground: null,
    accentSecondary: null,
    border: null,
    fontId: null,
  } satisfies ResolvedTheme["provenance"];

  it("prefers Degens PNG brand and city art over stale SVG", () => {
    const base: ResolvedTheme = {
      background: null,
      surface: null,
      foreground: null,
      mutedForeground: null,
      accent: null,
      accentForeground: null,
      accentSecondary: null,
      border: null,
      fontId: null,
      logoUrl: "/demo/logo-the-degens.svg",
      heroImageUrl: "/demo/poster-atlas-void-brand.svg",
      cityArtworkUrl: "/demo/city-atlas-detroit.svg",
      tourArtworkUrl: null,
      merchPhotographyNote: null,
      showMessaging: null,
      localMessage: null,
      provenance: emptyProvenance,
    };

    const enriched = enrichResolvedTheme(base, {
      artistId: "art_the_degens",
      eventId: "evt_atlas_detroit",
      tourId: "tor_signal_decay",
    });

    expect(enriched.logoUrl).toBe(THE_DEGENS_DEMO_ASSETS.logo);
    expect(enriched.heroImageUrl).toBe(THE_DEGENS_DEMO_ASSETS.tourHero);
    expect(enriched.cityArtworkUrl).toBe(THE_DEGENS_DEMO_ASSETS.cityDetroit);
  });

  it("leaves Nova SVG in place when no canonical PNG exists", () => {
    const base: ResolvedTheme = {
      background: null,
      surface: null,
      foreground: null,
      mutedForeground: null,
      accent: null,
      accentForeground: null,
      accentSecondary: null,
      border: null,
      fontId: null,
      logoUrl: "/demo/logo-nova-kestrel.svg",
      heroImageUrl: "/demo/poster-nova-kestrel-brand.svg",
      cityArtworkUrl: "/demo/city-nova-nashville.svg",
      tourArtworkUrl: null,
      merchPhotographyNote: null,
      showMessaging: null,
      localMessage: null,
      provenance: emptyProvenance,
    };

    const enriched = enrichResolvedTheme(base, {
      artistId: "art_nova_kestrel",
      eventId: "evt_nova_nashville",
      tourId: "tor_gold_hour",
    });

    expect(enriched.logoUrl).toBe("/demo/logo-nova-kestrel.svg");
    expect(enriched.cityArtworkUrl).toBe("/demo/city-nova-nashville.svg");
  });
});
