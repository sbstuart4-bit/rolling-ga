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

export type UnmappedReason = "no_catalog_entity" | "duplicate_png" | "unknown";

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
  unmappedReason?: UnmappedReason;
  duplicateOf?: string;
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
