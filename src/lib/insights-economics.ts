/**
 * Pure economics formulas for Artist Studio Insights.
 * Every metric either computes from supplied numbers or returns an explicit unavailable state.
 */

export type MetricAvailability =
  | { status: "available"; value: number }
  | { status: "unavailable"; reason: string }
  | { status: "incomplete"; value: number | null; missing: string[] };

export interface LineEconomicsInput {
  quantity: number;
  unitPriceCents: number;
  unitCostCents: number | null;
}

export interface OrderEconomicsInput {
  subtotalCents: number;
  shippingCarrierCostCents: number;
  shippingCustomerChargeCents: number;
  shippingArtistSubsidyCents: number;
  lines: LineEconomicsInput[];
}

export interface ContributionResult {
  merchRevenueCents: number;
  productCostCents: number | null;
  fulfillmentCostCents: number;
  artistShippingSubsidyCents: number;
  contributionCents: number | null;
  missingInputs: string[];
  complete: boolean;
}

export type CommerceMoment = "pre_show" | "live" | "encore_flash" | "post_show" | "other";

export const COMMERCE_MOMENT_LABELS: Record<CommerceMoment, string> = {
  pre_show: "Pre-show",
  live: "Live",
  encore_flash: "Encore / flash drop",
  post_show: "Post-show",
  other: "Other",
};

/** Pilot success criteria — configurable thresholds, not hard-coded performance claims. */
export interface PilotSuccessCriteria {
  id: string;
  label: string;
  tier: "primary" | "secondary";
  /** Metric key resolved at display time */
  metricKey: string;
  direction: "higher" | "lower";
  threshold: number;
  unit: "cents" | "ratio" | "count" | "percent";
}

export const DEFAULT_PILOT_CRITERIA: PilotSuccessCriteria[] = [
  { id: "gmv_per_attendee", label: "GMV / attendee", tier: "primary", metricKey: "gmvPerAttendee", direction: "higher", threshold: 1500, unit: "cents" },
  { id: "contribution_per_attendee", label: "Contribution / attendee", tier: "primary", metricKey: "contributionPerAttendee", direction: "higher", threshold: 800, unit: "cents" },
  { id: "aov", label: "AOV", tier: "secondary", metricKey: "aovCents", direction: "higher", threshold: 4500, unit: "cents" },
  { id: "conversion", label: "Verified conversion", tier: "secondary", metricKey: "conversionRate", direction: "higher", threshold: 0.08, unit: "ratio" },
  { id: "endless_aisle", label: "Endless Aisle sales", tier: "secondary", metricKey: "endlessAisleCents", direction: "higher", threshold: 500000, unit: "cents" },
  { id: "shipping_subsidy", label: "Shipping subsidy / order", tier: "secondary", metricKey: "shippingSubsidyPerOrder", direction: "lower", threshold: 500, unit: "cents" },
  { id: "consent_rate", label: "Permissioned fan rate", tier: "secondary", metricKey: "consentRate", direction: "higher", threshold: 0.25, unit: "ratio" },
];

export function perAttendeeMetric(
  numeratorCents: number,
  attendance: number,
): MetricAvailability {
  if (attendance <= 0) {
    return { status: "unavailable", reason: "No attendance denominator" };
  }
  return { status: "available", value: Math.round(numeratorCents / attendance) };
}

export function computeContribution(input: OrderEconomicsInput): ContributionResult {
  const missingInputs: string[] = [];

  let productCostCents = 0;
  let linesWithCost = 0;
  for (const line of input.lines) {
    if (line.unitCostCents == null) continue;
    productCostCents += line.unitCostCents * line.quantity;
    linesWithCost++;
  }

  if (linesWithCost === 0 && input.lines.length > 0) {
    missingInputs.push("product cost");
  } else if (linesWithCost < input.lines.length) {
    missingInputs.push("product cost (partial — some line items missing unit cost)");
  }

  const merchRevenueCents = input.subtotalCents;
  const fulfillmentCostCents = input.shippingCarrierCostCents;
  const artistShippingSubsidyCents = input.shippingArtistSubsidyCents;

  const complete = missingInputs.length === 0 && input.lines.length > 0;

  const contributionCents = complete
    ? merchRevenueCents -
      productCostCents -
      fulfillmentCostCents -
      artistShippingSubsidyCents
    : null;

  return {
    merchRevenueCents,
    productCostCents: linesWithCost > 0 ? productCostCents : null,
    fulfillmentCostCents,
    artistShippingSubsidyCents,
    contributionCents,
    missingInputs,
    complete,
  };
}

export function aggregateContributions(orders: OrderEconomicsInput[]): ContributionResult {
  const combined: OrderEconomicsInput = {
    subtotalCents: 0,
    shippingCarrierCostCents: 0,
    shippingCustomerChargeCents: 0,
    shippingArtistSubsidyCents: 0,
    lines: [],
  };

  for (const order of orders) {
    combined.subtotalCents += order.subtotalCents;
    combined.shippingCarrierCostCents += order.shippingCarrierCostCents;
    combined.shippingCustomerChargeCents += order.shippingCustomerChargeCents;
    combined.shippingArtistSubsidyCents += order.shippingArtistSubsidyCents;
    combined.lines.push(...order.lines);
  }

  return computeContribution(combined);
}

export function classifyCommerceMoment(input: {
  placedAt: Date;
  startsAt: Date;
  endsAt: Date;
  postShowClosesAt: Date | null;
  hasFlashDrop: boolean;
}): CommerceMoment {
  const t = input.placedAt.getTime();
  if (input.hasFlashDrop) return "encore_flash";
  if (t < input.startsAt.getTime()) return "pre_show";
  if (t <= input.endsAt.getTime()) return "live";
  if (input.postShowClosesAt && t <= input.postShowClosesAt.getTime()) return "post_show";
  return "other";
}

export function conversionRate(orders: number, verifiedAttendees: number): MetricAvailability {
  if (verifiedAttendees <= 0) {
    return { status: "unavailable", reason: "No verified attendees" };
  }
  return { status: "available", value: orders / verifiedAttendees };
}

export function consentRate(connectedFans: number, verifiedAttendees: number): MetricAvailability {
  if (verifiedAttendees <= 0) {
    return { status: "unavailable", reason: "No verified attendees" };
  }
  return { status: "available", value: connectedFans / verifiedAttendees };
}

export function evaluateCriterion(
  criterion: PilotSuccessCriteria,
  metrics: Record<string, number | null | undefined>,
): { met: boolean | null; actual: number | null } {
  const actual = metrics[criterion.metricKey] ?? null;
  if (actual == null) return { met: null, actual: null };
  const met =
    criterion.direction === "higher"
      ? actual >= criterion.threshold
      : actual <= criterion.threshold;
  return { met, actual };
}

export function isEndlessAisleProduct(product: {
  isDigital: boolean;
  category: string;
}): boolean {
  return product.isDigital || product.category === "digital";
}

export function isPhysicalCoreProduct(product: {
  isDigital: boolean;
  category: string;
}): boolean {
  return !product.isDigital && product.category !== "digital";
}
