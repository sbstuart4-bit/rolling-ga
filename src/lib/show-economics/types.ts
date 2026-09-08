/** Venue commission treatment for a merch channel — never assume exemption by default. */
export type VenueCommissionTreatment = "INCLUDED" | "EXCLUDED" | "UNKNOWN";

export const VENUE_COMMISSION_TREATMENTS = [
  "INCLUDED",
  "EXCLUDED",
  "UNKNOWN",
] as const satisfies readonly VenueCommissionTreatment[];

export interface PhysicalBaselineInput {
  physicalMerchGmvCents: number | null;
  unitsBrought: number | null;
  unitsSold: number | null;
  stockoutCount: number | null;
  venueCommissionTreatment: VenueCommissionTreatment;
  venueCommissionPercent: number | null;
  laborCostCents: number | null;
  otherPhysicalCostCents: number | null;
  /** Optional COGS for physical booth merch when known. */
  physicalProductCostCents: number | null;
}

export interface RollingGaEconomicsInput {
  gmvCents: number;
  showNightGmvCents: number;
  postShowGmvCents: number;
  orderCount: number;
  unitCount: number;
  aovCents: number;
  purchasingFans: number;
  repeatPurchasers: number;
  fulfillmentCostCents: number;
  shippingPaidByFanCents: number;
  shippingSubsidizedByArtistCents: number;
  productCostCents: number | null;
  productCostComplete: boolean;
}

export interface ShowEconomicsConfig {
  platformFeeBasisPoints: number;
  /** Digital / ship-to-home channel venue commission treatment for this show. */
  digitalVenueCommissionTreatment: VenueCommissionTreatment;
  digitalVenueCommissionPercent: number | null;
}

export interface EconomicBridgeLine {
  key: string;
  label: string;
  amountCents: number | null;
  subtract: boolean;
  note?: string;
}

export interface EstimatedProceedsResult {
  proceedsCents: number | null;
  complete: boolean;
  missing: string[];
  lines: EconomicBridgeLine[];
}

export interface PhysicalBaselineComputed {
  unsoldUnits: number | null;
  physicalAovCents: number | null;
  venueCommissionCents: number | null;
  venueCommissionLabel: string;
  estimatedProceedsCents: number | null;
  proceedsComplete: boolean;
  missingInputs: string[];
}

export interface CombinedShowEconomics {
  physicalProceedsCents: number | null;
  rollingGaProceedsCents: number | null;
  combinedProceedsCents: number | null;
  combinedComplete: boolean;
}

export interface ShowEconomicsComparisonRow {
  label: string;
  physical: string;
  rollingGa: string;
}

export interface ShowEconomicsSnapshot {
  eventId: string;
  eventLabel: string;
  isDemoData: boolean;
  config: ShowEconomicsConfig;
  physical: PhysicalBaselineInput;
  physicalComputed: PhysicalBaselineComputed;
  rollingGa: RollingGaEconomicsInput;
  rollingGaBridge: EstimatedProceedsResult;
  combined: CombinedShowEconomics;
  connectedFanRelationships: number;
  postShowPurchasers: number;
  repeatPurchasers: number;
  postShowRelationshipGmvCents: number;
  activatedPostShowGmvCents: number;
  organicPostShowGmvCents: number;
  comparisonRows: ShowEconomicsComparisonRow[];
}
