"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ShippingAddressFields } from "@/lib/shipping-address";
import { updateShippingAddressAction, type PreferenceActionState } from "@/server/fans/actions";

export function ShippingAddressForm({ initialAddress }: { initialAddress: ShippingAddressFields }) {
  const [state, action, pending] = useActionState<PreferenceActionState, FormData>(
    updateShippingAddressAction,
    {},
  );
  const [address, setAddress] = React.useState(initialAddress);

  function updateField(field: keyof ShippingAddressFields, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
  }

  return (
    <form action={action} className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="space-y-1.5">
        <Label htmlFor="shippingName">Full name</Label>
        <Input
          id="shippingName"
          name="shippingName"
          required
          value={address.shippingName}
          onChange={(event) => updateField("shippingName", event.target.value)}
          className="h-11"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="shippingLine1">Address line 1</Label>
        <Input
          id="shippingLine1"
          name="shippingLine1"
          required
          value={address.shippingLine1}
          onChange={(event) => updateField("shippingLine1", event.target.value)}
          className="h-11"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="shippingLine2">Address line 2 (optional)</Label>
        <Input
          id="shippingLine2"
          name="shippingLine2"
          value={address.shippingLine2}
          onChange={(event) => updateField("shippingLine2", event.target.value)}
          className="h-11"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="shippingCity">City</Label>
          <Input
            id="shippingCity"
            name="shippingCity"
            required
            value={address.shippingCity}
            onChange={(event) => updateField("shippingCity", event.target.value)}
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="shippingRegion">State / Region</Label>
          <Input
            id="shippingRegion"
            name="shippingRegion"
            required
            value={address.shippingRegion}
            onChange={(event) => updateField("shippingRegion", event.target.value)}
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
            required
            value={address.shippingPostalCode}
            onChange={(event) => updateField("shippingPostalCode", event.target.value)}
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="shippingCountry">Country</Label>
          <Input
            id="shippingCountry"
            name="shippingCountry"
            required
            value={address.shippingCountry}
            onChange={(event) => updateField("shippingCountry", event.target.value)}
            className="h-11"
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      {state.ok && (
        <p role="status" className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          Shipping address saved
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Save shipping address"}
      </Button>
    </form>
  );
}
