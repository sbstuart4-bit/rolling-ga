/**
 * Demo asset inventory and audit helpers for /demo/assets.
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
  | "product"
  | "logo"
  | "poster"
  | "event_hero"
  | "city"
  | "placeholder_svg"
  | "unknown";

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
}

const PUBLIC_DEMO = resolve(process.cwd(), "public", "demo");

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
  if (/^product-prd-/.test(filename)) return filename.endsWith(".svg") ? "placeholder_svg" : "product";
  if (/^logo-/.test(filename)) return "logo";
  if (/^poster-/.test(filename)) return "poster";
  if (/^city-/.test(filename)) return "city";
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

  return {
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
  return {
    total: entries.length,
    theDegens: byArtist("the_degens").length,
    novaKestrel: byArtist("nova_kestrel").length,
    lowCountry: byArtist("the_low_country").length,
    marisolReyes: byArtist("marisol_reyes").length,
    unknown: byArtist("unknown").length + byArtist("shared").length,
    referenced: entries.filter((e) => e.referenced).length,
    unused: entries.filter((e) => !e.referenced && e.assetType !== "placeholder_svg").length,
    broken: entries.filter((e) => e.broken).length,
    placeholderSvgs: entries.filter((e) => e.assetType === "placeholder_svg").length,
  };
}

/** Seeded products that have canonical PNG photography. */
export const SEEDED_PRODUCT_IDS = Object.keys(DEMO_PRODUCT_IMAGES);

/** PNG product files with no matching seeded product record. */
export function unmappedProductAssets(entries: DemoAssetAuditEntry[]): DemoAssetAuditEntry[] {
  return entries.filter(
    (e) =>
      e.assetType === "product" &&
      e.extension === "png" &&
      e.entityId &&
      !(e.entityId in DEMO_PRODUCT_IMAGES),
  );
}

/** Seeded products missing a PNG file on disk. */
export function missingProductAssets(entries: DemoAssetAuditEntry[]): string[] {
  const paths = new Set(entries.filter((e) => e.fileExists).map((e) => e.path));
  return Object.entries(DEMO_PRODUCT_IMAGES)
    .filter(([, path]) => !paths.has(path))
    .map(([id]) => id);
}
