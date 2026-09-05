/**
 * The payment surface Rolling GA abstracts over.
 *
 * The `DevCheckoutProvider` is the only implementation: it records orders, reserves
 * inventory, and returns a success response, but it never touches card data or talks to
 * a payment processor. The interface exists so a real provider can be added (Stripe,
 * Square, etc.) without rewriting checkout logic.
 *
 * Apple Pay / Google Pay are modelled as `PaymentMethodKind` values so the order model
 * and ops console can display them, but no pass certificate or SDK is integrated.
 */

import type { CommerceSource } from "@/lib/types";

export interface PaymentIntent {
  /** Provider's reference for this payment; stored on the order for reconciliation. */
  reference: string;
  provider: string;
}

export interface CheckoutLineItem {
  productId?: string;
  variantId?: string;
  bundleId?: string;
  dropId?: string;
  name: string;
  size?: string;
  imageUrl?: string;
  quantity: number;
  unitPriceCents: number;
  unitCostCents?: number;
}

export interface CheckoutRequest {
  userId: string;
  artistId: string;
  eventId?: string | null;
  commerceSource: CommerceSource;
  cartId: string;
  lines: CheckoutLineItem[];
  subtotalCents: number;
  shippingCustomerChargeCents: number;
  shippingCarrierCostCents: number;
  shippingArtistSubsidyCents: number;
  taxCents: number;
  totalCents: number;
  shippingOptionId?: string | null;
  shippingMethodLabel?: string;
  estimatedDeliveryFrom?: Date | null;
  estimatedDeliveryTo?: Date | null;
  shippingName: string;
  shippingLine1: string;
  shippingLine2?: string;
  shippingCity: string;
  shippingRegion: string;
  shippingPostalCode: string;
  shippingCountry: string;
  /** Short human-readable description sent to the provider. */
  statementDescriptor?: string;
}

export interface CheckoutResult {
  ok: boolean;
  orderId?: string;
  orderNumber?: string;
  error?: string;
}

export interface PaymentProvider {
  readonly id: string;
  readonly label: string;
  checkout(request: CheckoutRequest): Promise<CheckoutResult>;
}

/**
 * Development provider.
 *
 * Creates a fully-formed order in the database so every downstream flow (My Shows,
 * order confirmation, fulfillment ops) can be tested without a payment processor. It is
 * imported only by the checkout action, which always fails in production.
 */
export const DevCheckoutProvider: PaymentProvider = {
  id: "dev",
  label: "Dev checkout (no payment taken)",

  async checkout(request: CheckoutRequest): Promise<CheckoutResult> {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, error: "Dev checkout is not available in production." };
    }

    const { createOrderFromCheckout } = await import("./dev-order");
    return createOrderFromCheckout(request);
  },
};
