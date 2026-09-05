import type { ShippingSpeed, ShippingStrategy } from "@/lib/types";

/** Client-safe view model for shipping choices on cart and checkout. */
export interface ShippingChoiceView {
  id: string;
  name: string;
  speed: ShippingSpeed;
  speedLabel: string;
  customerChargeCents: number;
  artistSubsidyCents: number;
  deliveryMinDays: number;
  deliveryMaxDays: number;
  estimatedDeliveryFrom: string;
  estimatedDeliveryTo: string;
  freeThresholdCents: number | null;
  strategy: ShippingStrategy;
  thresholdMet: boolean;
}
