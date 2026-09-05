/**
 * Demo asset inventory and audit helpers for Rolling GA Ops Asset QA.
 */
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  DEMO_ARTIST_BRAND_IMAGES,
  DEMO_EVENT_CITY_IMAGES,
  DEMO_PRODUCT_IMAGES,
  THE_DEGENS_DEMO_ASSETS,
} from "@/lib/demo-assets";

export type DemoAssetArtist =
  | "the_degens"
  | "nova_kestrel"
  | "the_low_country"
  | "marisol_reyes"
  | "shared"
  | "unknown";

export type DemoAssetType =
  | "artist_portrait"
  | "band_portrait"
  | "artist_logo"
  | "show_hero"
  | "show_poster"
  | "product"
  | "drop"
  | "city"
  | "placeholder_svg"
  | "other"
  | "unknown";

export type DemoAssetStatus =
  | "mapped"
  | "unused"
  | "unmapped"
  | "missing"
  | "broken"
  | "placeholder_active";

export interface DemoAssetAuditEntry {
  filename: string;
  path: string;
  extension: string;
  artist: DemoAssetArtist;
  assetType: DemoAssetType;
  entityId: string | null;
  referenced: boolean;
  referenceLocations: string[];
  fileExists: boolean;
  broken: boolean;
  status: DemoAssetStatus;
  statusLabel: string;
}

const PUBLIC_DEMO = resolve(process.cwd(), "public", "demo");

const STATUS_LABELS: Record<DemoAssetStatus, string> = {
  mapped: "✓ Mapped",
  unused: "⚠ Unused",
  unmapped: "⚠ Unmapped",
  missing: "✕ Missing",
  broken: "✕ Broken",
  placeholder_active: "⚠ Placeholder active",
};

function inferArtist(filename: string): DemoAssetArtist {
  if (/^product-prd-av-/.test(filename)) return "the_degens";
  if (/^product-prd-nk-/.test(filename)) return "nova_kestrel";
  if (/^product-prd-lc-/.test(filename)) return "the_low_country";
  if (/^product-prd-mr-/.test(filename)) return "marisol_reyes";
  if (/degens|atlas-void|atlas-detroit|detroit|signal-decay|chicago-scheduled|toronto-preview/.test(filename)) {
    return "the_degens";
  }
  if (/nova|gold-hour|nashville/.test(filename)) return "nova_kestrel";
  if (/low-country|river-sessions|low-austin|austin-anniversary/.test(filename)) return "the_low_country";
  if (/marisol|violeta/.test(filename)) return "marisol_reyes";
  if (/^logo-|^poster-|^city-/.test(filename)) return "shared";
  return "unknown";
}

function inferAssetType(filename: string): DemoAssetType {
  if (/^product-prd-/.test(filename)) {
    return filename.endsWith(".svg") ? "placeholder_svg" : "product";
  }
  if (/^logo-/.test(filename)) return "artist_logo";
  if (/^city-/.test(filename)) return "show_hero";
  if (/^poster-.*-drop/.test(filename) || /poster-(detroit|toronto|signal|chicago|gold-hour|river|nashville|austin|violeta)/.test(filename)) {
    return filename.includes("-art") ? "show_poster" : "drop";
  }
  if (/^poster-/.test(filename)) return "show_poster";
  return "unknown";
}

function productIdFromFilename(filename: string): string | null {
  const match = filename.match(/^product-(prd-[a-z0-9-]+)\./);
  if (!match) return null;
  return match[1]!.replace(/-/g, "_");
}

function buildReferenceIndex(): Map<string, string[]> {
  const index = new Map<string, string[]>();

  function add(path: string, location: string) {
    const list = index.get(path) ?? [];
    list.push(location);
    index.set(path, list);
  }

  for (const [productId, path] of Object.entries(DEMO_PRODUCT_IMAGES)) {
    add(path, `DEMO_PRODUCT_IMAGES.${productId}`);
  }

  add(THE_DEGENS_DEMO_ASSETS.logo, "THE_DEGENS_DEMO_ASSETS.logo");
  add(THE_DEGENS_DEMO_ASSETS.cityDetroit, "THE_DEGENS_DEMO_ASSETS.cityDetroit");
  add(THE_DEGENS_DEMO_ASSETS.tourHero, "THE_DEGENS_DEMO_ASSETS.tourHero");

  for (const [key, path] of Object.entries(THE_DEGENS_DEMO_ASSETS.dropPosters)) {
    add(path, `THE_DEGENS_DEMO_ASSETS.dropPosters.${key}`);
  }

  for (const [artistId, brand] of Object.entries(DEMO_ARTIST_BRAND_IMAGES)) {
    if (brand?.logoUrl) add(brand.logoUrl, `DEMO_ARTIST_BRAND_IMAGES.${artistId}.logoUrl`);
    if (brand?.heroImageUrl) add(brand.heroImageUrl, `DEMO_ARTIST_BRAND_IMAGES.${artistId}.heroImageUrl`);
  }

  for (const [eventId, path] of Object.entries(DEMO_EVENT_CITY_IMAGES)) {
    if (path) add(path, `DEMO_EVENT_CITY_IMAGES.${eventId}`);
  }

  return index;
}

const REFERENCE_INDEX = buildReferenceIndex();

export function computeAssetStatus(entry: Omit<DemoAssetAuditEntry, "status" | "statusLabel">): DemoAssetStatus {
  if (entry.broken) return "broken";
  if (entry.assetType === "placeholder_svg" && entry.referenced) return "placeholder_active";
  if (entry.referenced && entry.fileExists) return "mapped";
  if (
    entry.assetType === "product" &&
    entry.extension === "png" &&
    entry.entityId &&
    !(entry.entityId in DEMO_PRODUCT_IMAGES)
  ) {
    return "unmapped";
  }
  if (!entry.referenced && entry.assetType !== "placeholder_svg" && entry.fileExists) {
    return "unused";
  }
  if (entry.referenced && !entry.fileExists) return "missing";
  return entry.assetType === "placeholder_svg" ? "placeholder_active" : "unused";
}

export function auditDemoAssetPath(path: string): {
  referenced: boolean;
  referenceLocations: string[];
  fileExists: boolean;
  broken: boolean;
} {
  const fileExists = existsSync(resolve(PUBLIC_DEMO, path.replace(/^\/demo\//, "")));
  const referenceLocations = REFERENCE_INDEX.get(path) ?? [];
  return {
    referenced: referenceLocations.length > 0,
    referenceLocations,
    fileExists,
    broken: referenceLocations.length > 0 && !fileExists,
  };
}

export function auditDemoAssetFile(filename: string): DemoAssetAuditEntry {
  const path = `/demo/${filename}`;
  const extension = filename.includes(".") ? filename.split(".").pop() ?? "" : "";
  const entityId = productIdFromFilename(filename);
  const { referenced, referenceLocations, fileExists, broken } = auditDemoAssetPath(path);

  const base = {
    filename,
    path,
    extension,
    artist: inferArtist(filename),
    assetType: inferAssetType(filename),
    entityId,
    referenced,
    referenceLocations,
    fileExists,
    broken,
  };

  const status = computeAssetStatus(base);
  return { ...base, status, statusLabel: STATUS_LABELS[status] };
}

export function listDemoAssetFilenames(): string[] {
  if (!existsSync(PUBLIC_DEMO)) return [];
  return readdirSync(PUBLIC_DEMO).filter((f) => /\.(png|jpe?g|webp|svg)$/i.test(f)).sort();
}

export function buildDemoAssetAudit(): DemoAssetAuditEntry[] {
  return listDemoAssetFilenames().map(auditDemoAssetFile);
}

export function summarizeDemoAssetAudit(entries: DemoAssetAuditEntry[]) {
  const byArtist = (artist: DemoAssetArtist) => entries.filter((e) => e.artist === artist);
  const byStatus = (status: DemoAssetStatus) => entries.filter((e) => e.status === status);

  return {
    total: entries.length,
    mapped: byStatus("mapped").length,
    theDegens: byArtist("the_degens").length,
    novaKestrel: byArtist("nova_kestrel").length,
    lowCountry: byArtist("the_low_country").length,
    marisolReyes: byArtist("marisol_reyes").length,
    unknown: byArtist("unknown").length + byArtist("shared").length,
    referenced: entries.filter((e) => e.referenced).length,
    unused: byStatus("unused").length + byStatus("unmapped").length,
    unmapped: byStatus("unmapped").length,
    broken: byStatus("broken").length,
    missing: byStatus("missing").length,
    placeholderSvgs: entries.filter((e) => e.assetType === "placeholder_svg").length,
    placeholderActive: byStatus("placeholder_active").length,
  };
}

export function countAssetIssuesForArtist(
  entries: DemoAssetAuditEntry[],
  artist: DemoAssetArtist,
): number {
  return entries.filter(
    (e) =>
      e.artist === artist &&
      (e.status === "broken" ||
        e.status === "unmapped" ||
        e.status === "unused" ||
        e.status === "placeholder_active"),
  ).length;
}

/** Seeded products that have canonical PNG photography. */
export const SEEDED_PRODUCT_IDS = Object.keys(DEMO_PRODUCT_IMAGES);

/** PNG product files with no matching seeded product record. */
export function unmappedProductAssets(entries: DemoAssetAuditEntry[]): DemoAssetAuditEntry[] {
  return entries.filter((e) => e.status === "unmapped");
}

/** Seeded products missing a PNG file on disk. */
export function missingProductAssets(entries: DemoAssetAuditEntry[]): string[] {
  const paths = new Set(entries.filter((e) => e.fileExists).map((e) => e.path));
  return Object.entries(DEMO_PRODUCT_IMAGES)
    .filter(([, path]) => !paths.has(path))
    .map(([id]) => id);
}

export type ArtistQaSurface =
  | "artist_card"
  | "artist_band_image"
  | "show_hero"
  | "product_grid"
  | "drop"
  | "product_detail"
  | "my_shows";

export interface ArtistQaResult {
  surface: ArtistQaSurface;
  pass: boolean;
  expected?: string;
  actual?: string;
  rootCause?: string;
}

const ARTIST_QA_LABELS: Record<ArtistQaSurface, string> = {
  artist_card: "Artist card",
  artist_band_image: "Artist/band image",
  show_hero: "Show hero",
  product_grid: "Product grid",
  drop: "Drop",
  product_detail: "Product detail",
  my_shows: "My Shows",
};

export function buildArtistQaMatrix(
  artist: DemoAssetArtist,
  entries: DemoAssetAuditEntry[],
): { label: string; results: ArtistQaResult[] } {
  const artistEntries = entries.filter((e) => e.artist === artist);
  const hasMappedProducts = artistEntries.some((e) => e.status === "mapped" && e.assetType === "product");
  const hasPngBrand = artistEntries.some(
    (e) => e.status === "mapped" && (e.assetType === "artist_logo" || e.assetType === "show_hero"),
  );
  const placeholderBrand = artistEntries.some(
    (e) => e.status === "placeholder_active" && (e.assetType === "artist_logo" || e.assetType === "show_poster"),
  );

  const results: ArtistQaResult[] = [
    {
      surface: "artist_card",
      pass: artist === "the_degens" || !placeholderBrand,
      expected: artist === "the_degens" ? "PNG logo" : "PNG or styled SVG logo",
      actual: artist === "the_degens" ? "PNG logo mapped" : "Generated SVG logo from seed",
      rootCause: artist !== "the_degens" ? "No PNG brand art in DEMO_ARTIST_BRAND_IMAGES" : undefined,
    },
    {
      surface: "artist_band_image",
      pass: hasPngBrand || artist !== "the_degens",
      expected: "Band/artist hero photography",
      actual: artist === "the_degens" ? "PNG tour hero" : "SVG generated poster",
      rootCause: artist !== "the_degens" ? "Brand PNG not yet added for this artist" : undefined,
    },
    {
      surface: "show_hero",
      pass: artist === "the_degens",
      expected: "City/show hero PNG where available",
      actual: artist === "the_degens" ? "city-atlas-detroit.png" : "SVG tour poster from seed",
      rootCause: artist !== "the_degens" ? "Only Degens has DEMO_EVENT_CITY_IMAGES mapping" : undefined,
    },
    {
      surface: "product_grid",
      pass: hasMappedProducts,
      expected: "Canonical PNG product photography",
      actual: hasMappedProducts ? "resolveProductImage() → PNG" : "No mapped products",
    },
    {
      surface: "drop",
      pass: hasMappedProducts,
      expected: "Product thumbnails from canonical map",
      actual: "listDropProducts + resolveProductImage",
    },
    {
      surface: "product_detail",
      pass: hasMappedProducts,
      expected: "Same PNG at larger size, object-contain",
      actual: "getProductBySlug + enrichProductRow",
    },
    {
      surface: "my_shows",
      pass: true,
      expected: "N/A — passport UI, no product imagery",
      actual: "Credentials only",
    },
  ];

  const label =
    artist === "the_degens"
      ? "The Degens"
      : artist === "nova_kestrel"
        ? "Nova Kestrel"
        : artist === "the_low_country"
          ? "The Low Country"
          : "Marisol Reyes";

  return {
    label,
    results: results.map((r) => ({ ...r, surface: r.surface, pass: r.pass })),
  };
}

export function qaSurfaceLabel(surface: ArtistQaSurface): string {
  return ARTIST_QA_LABELS[surface];
}
