"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import {
  ShippingOptionPicker,
  ShippingTotalsBreakdown,
} from "@/components/fan/shipping-options-ui";
import { CheckoutReviewSummary } from "@/components/fan/checkout-review-summary";
import type { ShippingChoiceView } from "@/lib/shipping-view";
import {
  hasSavedShippingAddress,
  isCompleteShippingAddress,
  mergeSavedShippingAddress,
  type SavedShippingAddress,
  type ShippingAddressFields,
} from "@/lib/shipping-address";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { checkoutAction, type CheckoutState } from "@/server/commerce/actions";

export interface CheckoutCartLineView {
  name: string;
  size: string | null;
  quantity: number;
}

/**
 * Fast mobile checkout form.
 *
 * Returning fans with a complete saved address see a review-first layout (size, ship to,
 * delivery, shipping, total) and can expand the address form only when needed.
 */
export function CheckoutForm({
  cartId,
  subtotalCents,
  shippingOptions,
  savedShippingAddress = null,
  cartLines = [],
  branded = false,
}: {
  cartId: string;
  subtotalCents: number;
  shippingOptions: ShippingChoiceView[];
  savedShippingAddress?: SavedShippingAddress | null;
  cartLines?: CheckoutCartLineView[];
  branded?: boolean;
}) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(checkoutAction, {});
  const [selectedShipping, setSelectedShipping] = React.useState(shippingOptions[0]?.id ?? "");
  const mergedAddress = React.useMemo(
    () => mergeSavedShippingAddress(savedShippingAddress),
    [savedShippingAddress],
  );
  const [address, setAddress] = React.useState<ShippingAddressFields>(mergedAddress);
  const hasSavedAddress = hasSavedShippingAddress(savedShippingAddress);
  const canFastCheckout = hasSavedAddress && isCompleteShippingAddress(mergedAddress);
  const [editShipping, setEditShipping] = React.useState(!canFastCheckout);

  React.useEffect(() => {
    setAddress(mergedAddress);
    setEditShipping(!canFastCheckout);
  }, [mergedAddress, canFastCheckout]);

  const selectedOption = shippingOptions.find((o) => o.id === selectedShipping);
  const total = subtotalCents + (selectedOption?.customerChargeCents ?? 0);
  const sizeLabels = cartLines
    .map((line) => (line.size ? `${line.size}${line.quantity > 1 ? ` ×${line.quantity}` : ""}` : null))
    .filter(Boolean) as string[];

  function updateAddressField(field: keyof ShippingAddressFields, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="cartId" value={cartId} />

      {canFastCheckout && !editShipping && (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            branded
              ? "border-artist-accent/30 bg-artist-accent/10 text-artist-muted"
              : "border-primary/30 bg-primary/10 text-muted-foreground",
          )}
        >
          <p className={cn("font-semibold", branded ? "text-artist-fg" : "text-foreground")}>
            Express checkout
          </p>
          <p>Your saved address is ready — confirm shipping and get your drop.</p>
        </div>
      )}

      {canFastCheckout && !editShipping ? (
        <>
          <CheckoutReviewSummary
            sizes={sizeLabels}
            address={address}
            selectedChoice={selectedOption}
            subtotalCents={subtotalCents}
            totalCents={total}
            onEditShipping={() => setEditShipping(true)}
          />
          <input type="hidden" name="shippingName" value={address.shippingName} />
          <input type="hidden" name="shippingLine1" value={address.shippingLine1} />
          <input type="hidden" name="shippingLine2" value={address.shippingLine2} />
          <input type="hidden" name="shippingCity" value={address.shippingCity} />
          <input type="hidden" name="shippingRegion" value={address.shippingRegion} />
          <input type="hidden" name="shippingPostalCode" value={address.shippingPostalCode} />
          <input type="hidden" name="shippingCountry" value={address.shippingCountry} />
        </>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Shipping address</h2>
            {canFastCheckout && (
              <button
                type="button"
                onClick={() => setEditShipping(false)}
                className="text-sm font-medium text-muted-foreground underline hover:text-foreground"
              >
                Use saved address
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="shippingName">Full name</Label>
            <Input
              id="shippingName"
              name="shippingName"
              autoComplete="name"
              required
              value={address.shippingName}
              onChange={(event) => updateAddressField("shippingName", event.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="shippingLine1">Address line 1</Label>
            <Input
              id="shippingLine1"
              name="shippingLine1"
              autoComplete="address-line1"
              required
              value={address.shippingLine1}
              onChange={(event) => updateAddressField("shippingLine1", event.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="shippingLine2">Address line 2 (optional)</Label>
            <Input
              id="shippingLine2"
              name="shippingLine2"
              autoComplete="address-line2"
              value={address.shippingLine2}
              onChange={(event) => updateAddressField("shippingLine2", event.target.value)}
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="shippingCity">City</Label>
              <Input
                id="shippingCity"
                name="shippingCity"
                autoComplete="address-level2"
                required
                value={address.shippingCity}
                onChange={(event) => updateAddressField("shippingCity", event.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shippingRegion">State / Region</Label>
              <Input
                id="shippingRegion"
                name="shippingRegion"
                autoComplete="address-level1"
                required
                value={address.shippingRegion}
                onChange={(event) => updateAddressField("shippingRegion", event.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="shippingPostalCode">Postal code</Label>
              <Input
                id="shippingPostalCode"
                name="shippingPostalCode"
                autoComplete="postal-code"
                required
                value={address.shippingPostalCode}
                onChange={(event) => updateAddressField("shippingPostalCode", event.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shippingCountry">Country</Label>
              <Input
                id="shippingCountry"
                name="shippingCountry"
                autoComplete="country"
                required
                value={address.shippingCountry}
                onChange={(event) => updateAddressField("shippingCountry", event.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
            <input
              type="checkbox"
              name="saveShippingForFuture"
              value="true"
              defaultChecked={!hasSavedAddress}
              className="mt-0.5 size-4 rounded border-input"
            />
            <span className="text-muted-foreground">
              Save this address for future Rolling GA purchases
            </span>
          </label>
        </section>
      )}

      {shippingOptions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Shipping method</h2>
          <ShippingOptionPicker
            choices={shippingOptions}
            selectedId={selectedShipping}
            onSelectedChange={setSelectedShipping}
          />
        </section>
      )}

      {!canFastCheckout || editShipping ? (
        <ShippingTotalsBreakdown
          subtotalCents={subtotalCents}
          selectedChoice={selectedOption}
          totalCents={total}
        />
      ) : null}

      <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-xs text-warning">
        <strong>Dev mode:</strong> No payment is collected. Orders are created immediately for testing.
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">{state.error}</p>
      )}

      <Button
        type="submit"
        disabled={pending}
        size="lg"
        variant={branded ? "moment" : "default"}
        className={cn("w-full text-base font-semibold", !branded && "h-14")}
      >
        {pending ? (
          <Loader2 className="size-5 animate-spin" aria-hidden />
        ) : branded ? (
          `Get my drop · ${formatMoney(total)}`
        ) : (
          `Confirm order · ${formatMoney(total)}`
        )}
      </Button>
    </form>
  );
}
