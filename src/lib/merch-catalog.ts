import type { ProductAccessType, ProductCategory, ShippingStrategy } from "@/lib/types";

/** Studio merchandising buckets — a product may appear in more than one. */
export type MerchSection =
  | "tour_core"
  | "endless_aisle"
  | "city_exclusives"
  | "premium"
  | "vinyl_collectibles"
  | "archive";

export const MERCH_SECTION_LABELS: Record<MerchSection, string> = {
  tour_core: "Tour core",
  endless_aisle: "Endless aisle",
  city_exclusives: "City exclusives",
  premium: "Premium",
  vinyl_collectibles: "Vinyl / collectibles",
  archive: "Archive",
};

export const MERCH_SECTION_DESCRIPTIONS: Record<MerchSection, string> = {
  tour_core: "Carried and sold throughout the tour",
  endless_aisle: "Digital — available without carrying at every venue",
  city_exclusives: "Show-specific merchandise",
  premium: "Higher-value pieces",
  vinyl_collectibles: "Music and collectible formats",
  archive: "Inactive products",
};

/** How a product reaches fans — venue booth vs Rolling GA vs both. */
export type AvailabilityChannel = "carried_at_venue" | "rolling_ga" | "both";

export const AVAILABILITY_CHANNEL_LABELS: Record<AvailabilityChannel, string> = {
  carried_at_venue: "Carried at venue",
  rolling_ga: "Rolling GA only",
  both: "Venue + Rolling GA",
};

export type InventoryStatus = "in_stock" | "low_stock" | "sold_out";

export interface ProductMerchShape {
  id: string;
  name: string;
  category: ProductCategory;
  accessType: ProductAccessType;
  basePriceCents: number;
  unitCostCents: number | null;
  isDigital: boolean;
  active: boolean;
  tourId: string | null;
  eventId: string | null;
  availableFrom: Date | null;
  availableUntil: Date | null;
}

export interface VariantInventoryShape {
  onHand: number | null;
  reserved: number | null;
  reorderPoint: number | null;
}

const PREMIUM_PRICE_CENTS = 7_500;

export function availableUnits(onHand: number | null, reserved: number | null): number {
  return Math.max(0, (onHand ?? 0) - (reserved ?? 0));
}

export function inventoryStatus(
  variants: VariantInventoryShape[],
  isDigital: boolean,
): InventoryStatus {
  if (isDigital) return "in_stock";
  const units = variants.map((v) => availableUnits(v.onHand, v.reserved));
  const total = units.reduce((sum, n) => sum + n, 0);
  if (total <= 0) return "sold_out";
  const reorder = Math.max(...variants.map((v) => v.reorderPoint ?? 0), 0);
  if (reorder > 0 && total <= reorder) return "low_stock";
  return "in_stock";
}

/** Classify a product into zero or more Studio sections. */
export function classifyMerchSections(product: ProductMerchShape): MerchSection[] {
  const sections: MerchSection[] = [];

  if (!product.active) {
    sections.push("archive");
    return sections;
  }

  const isCityExclusive =
    product.eventId != null || product.accessType === "event_specific";
  const isTourScoped =
    product.tourId != null ||
    product.accessType === "tour_specific" ||
    product.accessType === "verified_attendee";

  if (isCityExclusive) sections.push("city_exclusives");
  if (product.isDigital || product.category === "digital") {
    sections.push("endless_aisle");
  }
  if (isTourScoped && !isCityExclusive && !product.isDigital) {
    sections.push("tour_core");
  }
  if (
    !isCityExclusive &&
    !product.isDigital &&
    product.category !== "digital" &&
    (product.accessType === "public" || product.accessType === "scheduled")
  ) {
    sections.push("tour_core");
  }
  if (product.basePriceCents >= PREMIUM_PRICE_CENTS) sections.push("premium");
  if (product.category === "music" || product.category === "collectible") {
    sections.push("vinyl_collectibles");
  }

  return [...new Set(sections)];
}

/** Physical booth vs Rolling GA channel for a product. */
export function resolveAvailabilityChannel(
  product: Pick<ProductMerchShape, "isDigital" | "category">,
  hasPhysicalInventory: boolean,
): AvailabilityChannel {
  const digital = product.isDigital || product.category === "digital";
  if (digital) return "rolling_ga";
  if (hasPhysicalInventory) return "both";
  return "carried_at_venue";
}

export interface ProductEconomics {
  retailPriceCents: number;
  unitCostCents: number | null;
  estimatedFulfillmentCostCents: number | null;
  shippingStrategy: ShippingStrategy | null;
  estimatedArtistSubsidyCents: number | null;
  estimatedContributionCents: number | null;
}

/** Contribution math when cost data exists — never invent missing values. */
export function computeProductEconomics(input: {
  basePriceCents: number;
  unitCostCents: number | null;
  carrierCostCents: number | null;
  shippingStrategy: ShippingStrategy | null;
  baseCustomerChargeCents: number | null;
  subsidyCents: number | null;
}): ProductEconomics {
  const {
    basePriceCents,
    unitCostCents,
    carrierCostCents,
    shippingStrategy,
    baseCustomerChargeCents,
    subsidyCents,
  } = input;

  let estimatedArtistSubsidyCents: number | null = null;
  if (carrierCostCents != null && shippingStrategy != null) {
    if (shippingStrategy === "promotional_free") {
      estimatedArtistSubsidyCents = carrierCostCents;
    } else if (shippingStrategy === "artist_subsidized" && subsidyCents != null) {
      estimatedArtistSubsidyCents = Math.min(
        carrierCostCents,
        Math.max(0, (baseCustomerChargeCents ?? 0) - subsidyCents),
      );
    } else {
      estimatedArtistSubsidyCents = 0;
    }
  }

  let estimatedContributionCents: number | null = null;
  if (unitCostCents != null) {
    estimatedContributionCents =
      basePriceCents - unitCostCents - (estimatedArtistSubsidyCents ?? 0);
  }

  return {
    retailPriceCents: basePriceCents,
    unitCostCents,
    estimatedFulfillmentCostCents: carrierCostCents,
    shippingStrategy,
    estimatedArtistSubsidyCents,
    estimatedContributionCents,
  };
}

export interface ShowAssortmentCounts {
  physicalCore: number;
  rollingGaExtended: number;
  cityExclusives: number;
  totalAvailable: number;
}
