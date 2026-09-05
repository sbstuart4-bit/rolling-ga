import { describe, expect, it } from "vitest";
import {
  auditDemoAssetFile,
  buildDemoAssetAudit,
  buildArtistQaMatrix,
  classifyUnmappedAssets,
  computeAssetStatus,
  missingProductAssets,
  summarizeDemoAssetAudit,
} from "@/lib/demo-asset-audit";
import { resolveProductImage } from "@/lib/demo-product-images";

describe("Rolling GA Ops asset QA", () => {
  it("assigns mapped status to canonical Nova product PNG", () => {
    const entry = auditDemoAssetFile("product-prd-nk-tee.png");
    expect(entry.status).toBe("mapped");
    expect(entry.entityId).toBe("prd_nk_tee");
  });

  it("assigns mapped status to all P1.1 product PNGs", () => {
    const entry = auditDemoAssetFile("product-prd-nk-hat.png");
    expect(entry.status).toBe("mapped");
    expect(entry.entityId).toBe("prd_nk_hat");
  });

  it("summarizes audit totals for all four artists", () => {
    const audit = buildDemoAssetAudit();
    const summary = summarizeDemoAssetAudit(audit);
    expect(summary.total).toBeGreaterThan(90);
    expect(summary.theDegens).toBeGreaterThan(0);
    expect(summary.novaKestrel).toBeGreaterThan(0);
    expect(summary.lowCountry).toBeGreaterThan(0);
    expect(summary.marisolReyes).toBeGreaterThan(0);
    expect(summary.mapped).toBeGreaterThan(0);
  });

  it("reports no missing canonical seeded product files", () => {
    const audit = buildDemoAssetAudit();
    expect(missingProductAssets(audit)).toEqual([]);
  });

  it("Nova drops products resolve to PNG not stale SVG", () => {
    expect(resolveProductImage("prd_nk_tee", ["/demo/product-prd-nk-tee.svg"])).toBe(
      "/demo/product-prd-nk-tee.png",
    );
    expect(resolveProductImage("prd_nk_book", ["/demo/product-prd-nk-book.svg"])).toBe(
      "/demo/product-prd-nk-book.png",
    );
    expect(resolveProductImage("prd_nk_single", ["/demo/product-prd-nk-single.svg"])).toBe(
      "/demo/product-prd-nk-single.png",
    );
  });

  it("builds QA matrix for all four artists", () => {
    const audit = buildDemoAssetAudit();
    for (const artist of [
      "the_degens",
      "nova_kestrel",
      "the_low_country",
      "marisol_reyes",
    ] as const) {
      const matrix = buildArtistQaMatrix(artist, audit);
      expect(matrix.results.length).toBe(7);
      expect(matrix.results.some((r) => r.surface === "product_grid")).toBe(true);
    }
  });

  it("reports no unmapped product PNGs for full seeded catalog", () => {
    const audit = buildDemoAssetAudit();
    const classified = classifyUnmappedAssets(audit);
    expect(classified.noCatalogEntity.filter((e) => e.assetType === "product")).toHaveLength(0);
  });

  it("pairs PNG product files with their SVG placeholders", () => {
    const entry = auditDemoAssetFile("product-prd-nk-tee.png");
    expect(entry.duplicateOf).toBe("product-prd-nk-tee.svg");
  });

  it("marks referenced SVG placeholders as placeholder_active", () => {
    const status = computeAssetStatus({
      filename: "product-prd-nk-tee.svg",
      path: "/demo/product-prd-nk-tee.svg",
      extension: "svg",
      artist: "nova_kestrel",
      assetType: "placeholder_svg",
      entityId: "prd_nk_tee",
      referenced: false,
      referenceLocations: [],
      fileExists: true,
      broken: false,
    });
    expect(status).toBe("placeholder_active");
  });
});
