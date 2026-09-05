import type { ShippingSpeed, ShippingStrategy } from "@/lib/types";
import { SHIPPING_SPEED_LABELS } from "@/lib/types";

/** Inputs required to compute what the fan pays and what the artist absorbs. */
export interface ShippingOptionQuoteInput {
  strategy: ShippingStrategy;
  carrierCostCents: number;
  baseCustomerChargeCents: number;
  subsidyCents: number;
  freeThresholdCents: number | null;
}

export interface ShippingQuote {
  /** What the carrier charges the artist. */
  carrierCostCents: number;
  /** What the fan pays at checkout. */
  customerChargeCents: number;
  /** Amount the artist absorbs beyond what the fan pays. */
  artistSubsidyCents: number;
  /** Whether a free-shipping threshold was met for this subtotal. */
  thresholdMet: boolean;
}

/**
 * Applies the configured strategy to split carrier cost between fan and artist.
 * Single source of truth for checkout, cart preview, and order creation.
 */
export function resolveShippingQuote(
  option: ShippingOptionQuoteInput,
  subtotalCents: number,
): ShippingQuote {
  const carrierCostCents = option.carrierCostCents;

  switch (option.strategy) {
    case "promotional_free":
      return {
        carrierCostCents,
        customerChargeCents: 0,
        artistSubsidyCents: carrierCostCents,
        thresholdMet: true,
      };

    case "free_above_threshold": {
      const thresholdMet =
        option.freeThresholdCents != null && subtotalCents >= option.freeThresholdCents;
      if (thresholdMet) {
        return {
          carrierCostCents,
          customerChargeCents: 0,
          artistSubsidyCents: carrierCostCents,
          thresholdMet: true,
        };
      }
      return {
        carrierCostCents,
        customerChargeCents: option.baseCustomerChargeCents,
        artistSubsidyCents: 0,
        thresholdMet: false,
      };
    }

    case "artist_subsidized": {
      const customerChargeCents = Math.max(0, option.baseCustomerChargeCents - option.subsidyCents);
      return {
        carrierCostCents,
        customerChargeCents,
        artistSubsidyCents: option.baseCustomerChargeCents - customerChargeCents,
        thresholdMet: false,
      };
    }

    case "fan_pays_full":
    default:
      return {
        carrierCostCents,
        customerChargeCents: option.baseCustomerChargeCents,
        artistSubsidyCents: 0,
        thresholdMet: false,
      };
  }
}

export interface ShippingOptionScopeInput {
  eventId?: string | null;
  tourId?: string | null;
}

/** Whether a configured option applies to the current cart/checkout context. */
export function shippingOptionInScope(
  option: { eventId: string | null; tourId: string | null },
  scope: ShippingOptionScopeInput,
): boolean {
  if (option.eventId) {
    return scope.eventId != null && option.eventId === scope.eventId;
  }
  if (option.tourId) {
    return scope.tourId != null && option.tourId === scope.tourId;
  }
  return true;
}

export function estimateDeliveryDates(
  deliveryMinDays: number,
  deliveryMaxDays: number,
  now = new Date(),
): { from: Date; to: Date } {
  return {
    from: new Date(now.getTime() + deliveryMinDays * 86_400_000),
    to: new Date(now.getTime() + deliveryMaxDays * 86_400_000),
  };
}

export interface ResolvedShippingChoice extends ShippingQuote {
  id: string;
  name: string;
  speed: ShippingSpeed;
  speedLabel: string;
  deliveryMinDays: number;
  deliveryMaxDays: number;
  estimatedDeliveryFrom: Date;
  estimatedDeliveryTo: Date;
  freeThresholdCents: number | null;
  strategy: ShippingStrategy;
}

export function buildShippingChoice(
  option: ShippingOptionQuoteInput & {
    id: string;
    name: string;
    speed: ShippingSpeed;
    deliveryMinDays: number;
    deliveryMaxDays: number;
    freeThresholdCents: number | null;
    strategy: ShippingStrategy;
  },
  subtotalCents: number,
  now = new Date(),
): ResolvedShippingChoice {
  const quote = resolveShippingQuote(option, subtotalCents);
  const dates = estimateDeliveryDates(option.deliveryMinDays, option.deliveryMaxDays, now);

  return {
    id: option.id,
    name: option.name,
    speed: option.speed,
    speedLabel: SHIPPING_SPEED_LABELS[option.speed],
    deliveryMinDays: option.deliveryMinDays,
    deliveryMaxDays: option.deliveryMaxDays,
    estimatedDeliveryFrom: dates.from,
    estimatedDeliveryTo: dates.to,
    freeThresholdCents: option.freeThresholdCents,
    strategy: option.strategy,
    ...quote,
  };
}

/** Lowest fan-facing charge across a set of resolved choices. */
export function lowestCustomerShippingCharge(choices: Pick<ResolvedShippingChoice, "customerChargeCents">[]): number | null {
  if (choices.length === 0) return null;
  return Math.min(...choices.map((c) => c.customerChargeCents));
}

/** @deprecated Use resolveShippingQuote().customerChargeCents */
export function customerShippingCharge(
  option: ShippingOptionQuoteInput,
  subtotalCents: number,
): number {
  return resolveShippingQuote(option, subtotalCents).customerChargeCents;
}
