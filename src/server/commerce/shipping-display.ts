import type { ResolvedShippingChoice } from "@/lib/shipping";
import type { ShippingChoiceView } from "@/lib/shipping-view";

/** Serializes server-resolved shipping choices for client components. */
export function serializeShippingChoices(choices: ResolvedShippingChoice[]): ShippingChoiceView[] {
  return choices.map((choice) => ({
    id: choice.id,
    name: choice.name,
    speed: choice.speed,
    speedLabel: choice.speedLabel,
    customerChargeCents: choice.customerChargeCents,
    artistSubsidyCents: choice.artistSubsidyCents,
    deliveryMinDays: choice.deliveryMinDays,
    deliveryMaxDays: choice.deliveryMaxDays,
    estimatedDeliveryFrom: choice.estimatedDeliveryFrom.toISOString(),
    estimatedDeliveryTo: choice.estimatedDeliveryTo.toISOString(),
    freeThresholdCents: choice.freeThresholdCents,
    strategy: choice.strategy,
    thresholdMet: choice.thresholdMet,
  }));
}
