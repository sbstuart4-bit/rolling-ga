import { MARISOL_BROOKLYN_EVENT_ID } from "@/lib/demo-user-ids";
import type { PhysicalBaselineInput, ShowEconomicsConfig } from "./types";

/**
 * Canonical pilot baseline inputs for Marisol Reyes · A Tender Night · Brooklyn.
 * Rolling GA metrics are always derived from seeded orders — never from this fixture.
 */
export const MARISOL_BROOKLYN_ECONOMICS_EVENT_ID = MARISOL_BROOKLYN_EVENT_ID;

/** Default platform fee for demo pilots — 5% of Rolling GA GMV. */
export const DEFAULT_ROLLING_GA_PLATFORM_FEE_BPS = 500;

export const MARISOL_BROOKLYN_ECONOMICS_CONFIG: ShowEconomicsConfig = {
  platformFeeBasisPoints: DEFAULT_ROLLING_GA_PLATFORM_FEE_BPS,
  digitalVenueCommissionTreatment: "UNKNOWN",
  digitalVenueCommissionPercent: null,
};

/** Representative physical booth baseline for Warehouse Nine pilot storytelling. */
export const MARISOL_BROOKLYN_PHYSICAL_BASELINE: PhysicalBaselineInput = {
  physicalMerchGmvCents: 18_420_00,
  unitsBrought: 420,
  unitsSold: 318,
  stockoutCount: 34,
  venueCommissionTreatment: "UNKNOWN",
  venueCommissionPercent: null,
  laborCostCents: 2_800_00,
  otherPhysicalCostCents: 950_00,
  physicalProductCostCents: 6_120_00,
};
