"use client";

import { formatDeliveryWindow, formatMoney } from "@/lib/format";
import type { ShippingChoiceView } from "@/lib/shipping-view";
import { formatShippingAddressSummary, type ShippingAddressFields } from "@/lib/shipping-address";

function deliveryLabel(choice: ShippingChoiceView): string {
  const from = new Date(choice.estimatedDeliveryFrom);
  const to = new Date(choice.estimatedDeliveryTo);

  if (choice.speed === "next_day") return "Next day";
  if (choice.deliveryMinDays === choice.deliveryMaxDays) {
    return `${choice.deliveryMinDays} business day${choice.deliveryMinDays === 1 ? "" : "s"}`;
  }
  return formatDeliveryWindow(from, to);
}

export function CheckoutReviewSummary({
  sizes,
  address,
  selectedChoice,
  subtotalCents,
  totalCents,
  onEditShipping,
}: {
  sizes: string[];
  address: ShippingAddressFields;
  selectedChoice: ShippingChoiceView | undefined;
  subtotalCents: number;
  totalCents: number;
  onEditShipping: () => void;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold">Review your order</h2>
        <button
          type="button"
          onClick={onEditShipping}
          className="text-sm font-medium text-muted-foreground underline hover:text-foreground"
        >
          Edit shipping
        </button>
      </div>

      <dl className="space-y-3 text-sm">
        {sizes.length > 0 && (
          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 font-medium uppercase tracking-wide text-muted-foreground">Size</dt>
            <dd className="text-right font-medium">{sizes.join(", ")}</dd>
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <dt className="shrink-0 font-medium uppercase tracking-wide text-muted-foreground">Ship to</dt>
          <dd className="max-w-[16rem] text-right text-muted-foreground">
            {formatShippingAddressSummary(address)}
          </dd>
        </div>

        {selectedChoice && (
          <>
            <div className="flex items-start justify-between gap-4">
              <dt className="shrink-0 font-medium uppercase tracking-wide text-muted-foreground">Delivery</dt>
              <dd className="text-right">
                <span className="font-medium">{selectedChoice.name}</span>
                <span className="block text-muted-foreground">{deliveryLabel(selectedChoice)}</span>
              </dd>
            </div>

            <div className="flex items-start justify-between gap-4">
              <dt className="shrink-0 font-medium uppercase tracking-wide text-muted-foreground">Shipping</dt>
              <dd className="tabular font-medium">
                {selectedChoice.customerChargeCents === 0
                  ? "Free"
                  : formatMoney(selectedChoice.customerChargeCents)}
              </dd>
            </div>

            {selectedChoice.artistSubsidyCents > 0 && (
              <div className="flex items-start justify-between gap-4 text-emerald-700 dark:text-emerald-400">
                <dt className="shrink-0 font-medium uppercase tracking-wide">Artist subsidy</dt>
                <dd className="tabular font-medium">
                  {formatMoney(selectedChoice.artistSubsidyCents)}
                </dd>
              </div>
            )}
          </>
        )}

        <div className="flex items-start justify-between gap-4 border-t border-border pt-3">
          <dt className="shrink-0 font-medium uppercase tracking-wide text-muted-foreground">Total</dt>
          <dd className="tabular text-lg font-semibold">{formatMoney(totalCents)}</dd>
        </div>
      </dl>

      <p className="text-xs text-muted-foreground">
        Subtotal {formatMoney(subtotalCents)}
        {selectedChoice ? ` · shipping ${selectedChoice.customerChargeCents === 0 ? "free" : formatMoney(selectedChoice.customerChargeCents)}` : ""}
      </p>
    </section>
  );
}
