import type {
  CombinedShowEconomics,
  EconomicBridgeLine,
  EstimatedProceedsResult,
  PhysicalBaselineComputed,
  PhysicalBaselineInput,
  RollingGaEconomicsInput,
  ShowEconomicsConfig,
  VenueCommissionTreatment,
} from "./types";

export function venueCommissionLabel(treatment: VenueCommissionTreatment): string {
  switch (treatment) {
    case "INCLUDED":
      return "Included in venue commission";
    case "EXCLUDED":
      return "Excluded from venue commission";
    case "UNKNOWN":
      return "Contract treatment not confirmed";
  }
}

export function computeVenueCommissionCents(
  gmvCents: number,
  treatment: VenueCommissionTreatment,
  percent: number | null,
): { cents: number | null; label: string } {
  if (treatment === "UNKNOWN") {
    return { cents: null, label: "Contract treatment not confirmed" };
  }
  if (treatment === "EXCLUDED") {
    return { cents: 0, label: "Excluded from venue commission" };
  }
  if (percent == null || !Number.isFinite(percent) || percent < 0 || percent > 100) {
    return { cents: null, label: "Commission % required when included" };
  }
  return {
    cents: Math.round((gmvCents * percent) / 100),
    label: `${percent}% venue commission`,
  };
}

export function computePlatformFeeCents(gmvCents: number, basisPoints: number): number {
  if (basisPoints <= 0) return 0;
  return Math.round((gmvCents * basisPoints) / 10_000);
}

export function computePhysicalBaseline(
  input: PhysicalBaselineInput,
): PhysicalBaselineComputed {
  const missing: string[] = [];

  if (input.physicalMerchGmvCents == null) missing.push("physical merch GMV");
  if (input.unitsBrought == null) missing.push("units brought");
  if (input.unitsSold == null) missing.push("units sold");

  const unsoldUnits =
    input.unitsBrought != null && input.unitsSold != null && input.stockoutCount != null
      ? Math.max(0, input.unitsBrought - input.unitsSold - input.stockoutCount)
      : input.unitsBrought != null && input.unitsSold != null
        ? Math.max(0, input.unitsBrought - input.unitsSold)
        : null;

  const physicalAovCents =
    input.physicalMerchGmvCents != null &&
    input.unitsSold != null &&
    input.unitsSold > 0
      ? Math.round(input.physicalMerchGmvCents / input.unitsSold)
      : null;

  const venue = computeVenueCommissionCents(
    input.physicalMerchGmvCents ?? 0,
    input.venueCommissionTreatment,
    input.venueCommissionPercent,
  );

  if (input.venueCommissionTreatment === "INCLUDED" && venue.cents == null) {
    missing.push("venue commission %");
  }

  let proceeds: number | null = null;
  if (input.physicalMerchGmvCents != null && venue.cents != null) {
    proceeds = input.physicalMerchGmvCents - venue.cents;
    if (input.laborCostCents != null) proceeds -= input.laborCostCents;
    if (input.otherPhysicalCostCents != null) proceeds -= input.otherPhysicalCostCents;
    if (input.physicalProductCostCents != null) proceeds -= input.physicalProductCostCents;
  } else if (input.physicalMerchGmvCents != null && input.venueCommissionTreatment === "UNKNOWN") {
    missing.push("venue commission treatment");
  }

  const proceedsComplete =
    missing.length === 0 &&
    input.physicalMerchGmvCents != null &&
    (input.venueCommissionTreatment !== "INCLUDED" || venue.cents != null);

  return {
    unsoldUnits,
    physicalAovCents,
    venueCommissionCents: venue.cents,
    venueCommissionLabel: venue.label,
    estimatedProceedsCents: proceedsComplete ? proceeds : null,
    proceedsComplete,
    missingInputs: missing,
  };
}

export function computeRollingGaBridge(
  rollingGa: RollingGaEconomicsInput,
  config: ShowEconomicsConfig,
): EstimatedProceedsResult {
  const missing: string[] = [];
  const lines: EconomicBridgeLine[] = [];

  lines.push({
    key: "gmv",
    label: "Rolling GA GMV",
    amountCents: rollingGa.gmvCents,
    subtract: false,
  });

  const platformFee = computePlatformFeeCents(rollingGa.gmvCents, config.platformFeeBasisPoints);
  lines.push({
    key: "platform_fee",
    label: "Rolling GA platform fee",
    amountCents: platformFee,
    subtract: true,
    note:
      config.platformFeeBasisPoints > 0
        ? `${(config.platformFeeBasisPoints / 100).toFixed(2)}% of GMV`
        : undefined,
  });

  lines.push({
    key: "fulfillment",
    label: "Fulfillment (carrier cost)",
    amountCents: rollingGa.fulfillmentCostCents,
    subtract: true,
  });

  lines.push({
    key: "shipping_subsidy",
    label: "Artist shipping subsidy",
    amountCents: rollingGa.shippingSubsidizedByArtistCents,
    subtract: true,
  });

  const venue = computeVenueCommissionCents(
    rollingGa.gmvCents,
    config.digitalVenueCommissionTreatment,
    config.digitalVenueCommissionPercent,
  );

  lines.push({
    key: "venue_commission",
    label: "Applicable venue commission",
    amountCents: venue.cents,
    subtract: true,
    note: venue.label,
  });

  if (config.digitalVenueCommissionTreatment === "UNKNOWN") {
    missing.push("digital channel venue commission treatment");
  } else if (config.digitalVenueCommissionTreatment === "INCLUDED" && venue.cents == null) {
    missing.push("digital channel venue commission %");
  }

  if (rollingGa.productCostComplete && rollingGa.productCostCents != null) {
    lines.push({
      key: "product_cost",
      label: "Product cost (COGS)",
      amountCents: rollingGa.productCostCents,
      subtract: true,
    });
  } else if (rollingGa.gmvCents > 0) {
    missing.push("product cost (partial line items missing unit cost)");
  }

  let proceeds = rollingGa.gmvCents - platformFee - rollingGa.fulfillmentCostCents;
  proceeds -= rollingGa.shippingSubsidizedByArtistCents;

  if (venue.cents != null) {
    proceeds -= venue.cents;
  }

  if (rollingGa.productCostComplete && rollingGa.productCostCents != null) {
    proceeds -= rollingGa.productCostCents;
  }

  const complete =
    missing.length === 0 &&
    rollingGa.productCostComplete &&
    rollingGa.productCostCents != null &&
    (config.digitalVenueCommissionTreatment !== "INCLUDED" || venue.cents != null);

  return {
    proceedsCents: complete ? proceeds : null,
    complete,
    missing,
    lines,
  };
}

export function computeCombinedEconomics(
  physical: PhysicalBaselineComputed,
  rollingGaBridge: EstimatedProceedsResult,
): CombinedShowEconomics {
  const physicalProceeds = physical.proceedsComplete ? physical.estimatedProceedsCents : null;
  const rollingProceeds = rollingGaBridge.complete ? rollingGaBridge.proceedsCents : null;

  const combinedComplete = physicalProceeds != null && rollingProceeds != null;
  const combinedProceeds =
    combinedComplete && physicalProceeds != null && rollingProceeds != null
      ? physicalProceeds + rollingProceeds
      : null;

  return {
    physicalProceedsCents: physicalProceeds,
    rollingGaProceedsCents: rollingProceeds,
    combinedProceedsCents: combinedProceeds,
    combinedComplete,
  };
}

export function buildComparisonRows(): import("./types").ShowEconomicsComparisonRow[] {
  return [
    {
      label: "Catalog",
      physical: "Limited inventory at venue",
      rollingGa: "Expanded digital catalog",
    },
    {
      label: "Checkout",
      physical: "Physical queue at merch table",
      rollingGa: "No physical checkout line",
    },
    {
      label: "Inventory risk",
      physical: "Stockout risk on popular sizes",
      rollingGa: "Less physical inventory dependency",
    },
    {
      label: "Fan experience",
      physical: "Fan carries merch through the show",
      rollingGa: "Ship-to-home delivery",
    },
    {
      label: "Venue economics",
      physical: "Traditional venue commission treatment",
      rollingGa: "Explicit digital-channel commission treatment",
    },
    {
      label: "Fan identity",
      physical: "Transaction may remain anonymous",
      rollingGa: "Known purchasing fan in Rolling GA",
    },
    {
      label: "After the show",
      physical: "No measured post-show commerce",
      rollingGa: "Measurable post-show commerce",
    },
  ];
}

export interface BaselineValidationResult {
  ok: boolean;
  errors: Record<string, string>;
}

export function validatePhysicalBaselineInput(input: PhysicalBaselineInput): BaselineValidationResult {
  const errors: Record<string, string> = {};

  if (input.physicalMerchGmvCents != null && input.physicalMerchGmvCents < 0) {
    errors.physicalMerchGmvCents = "GMV cannot be negative";
  }
  if (input.unitsBrought != null && input.unitsBrought < 0) {
    errors.unitsBrought = "Units brought cannot be negative";
  }
  if (input.unitsSold != null && input.unitsSold < 0) {
    errors.unitsSold = "Units sold cannot be negative";
  }
  if (input.stockoutCount != null && input.stockoutCount < 0) {
    errors.stockoutCount = "Stockout count cannot be negative";
  }
  if (
    input.unitsBrought != null &&
    input.unitsSold != null &&
    input.unitsSold > input.unitsBrought
  ) {
    errors.unitsSold = "Units sold cannot exceed units brought";
  }
  if (
    input.unitsBrought != null &&
    input.unitsSold != null &&
    input.stockoutCount != null &&
    input.unitsSold + input.stockoutCount > input.unitsBrought
  ) {
    errors.stockoutCount = "Sold plus stockouts cannot exceed units brought";
  }
  if (input.venueCommissionTreatment === "INCLUDED") {
    if (input.venueCommissionPercent == null) {
      errors.venueCommissionPercent = "Commission % is required when treatment is Included";
    } else if (input.venueCommissionPercent < 0 || input.venueCommissionPercent > 100) {
      errors.venueCommissionPercent = "Commission % must be between 0 and 100";
    }
  }
  if (input.laborCostCents != null && input.laborCostCents < 0) {
    errors.laborCostCents = "Labor cost cannot be negative";
  }
  if (input.otherPhysicalCostCents != null && input.otherPhysicalCostCents < 0) {
    errors.otherPhysicalCostCents = "Other costs cannot be negative";
  }

  return { ok: Object.keys(errors).length === 0, errors };
}
