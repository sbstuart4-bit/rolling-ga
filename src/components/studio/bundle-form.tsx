"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { formatMoney } from "@/lib/format";
import { PRODUCT_ACCESS_LABELS, PRODUCT_ACCESS_TYPES } from "@/lib/types";
import { createBundleAction, type MerchActionState } from "@/server/studio/merch-actions";

export function BundleForm({
  artistId,
  products,
  events,
  tours,
  defaultEventId,
}: {
  artistId: string;
  products: { id: string; name: string; basePriceCents: number }[];
  events: { id: string; venueCity: string }[];
  tours: { id: string; name: string }[];
  defaultEventId?: string;
}) {
  const [state, action, pending] = useActionState<MerchActionState, FormData>(
    createBundleAction,
    {},
  );

  return (
    <form action={action} className="space-y-5 rounded-2xl border border-border bg-card/40 p-6">
      <input type="hidden" name="artistId" value={artistId} />

      <Field label="Bundle name" name="name" required placeholder="Complete Your Detroit Drop" />
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea id="description" name="description" rows={2} placeholder="Tee + Poster + Pin" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Bundle price (cents)" name="bundlePriceCents" type="number" required />
        <div className="space-y-1.5">
          <Label htmlFor="accessType">Access</Label>
          <Select name="accessType" defaultValue="event_specific">
            <SelectTrigger id="accessType" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_ACCESS_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {PRODUCT_ACCESS_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="eventId">Show (optional)</Label>
          <select id="eventId" name="eventId" defaultValue={defaultEventId ?? ""} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Not show-specific</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>{event.venueCity}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tourId">Tour (optional)</Label>
          <select id="tourId" name="tourId" className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Any</option>
            {tours.map((tour) => (
              <option key={tour.id} value={tour.id}>{tour.name}</option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Products in bundle (select at least 2)</legend>
        {products.map((product) => (
          <label key={product.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
            <Checkbox name="productIds" value={product.id} />
            <span className="flex-1">{product.name}</span>
            <span className="tabular text-muted-foreground">{formatMoney(product.basePriceCents)}</span>
          </label>
        ))}
      </fieldset>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Create bundle"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} placeholder={placeholder} className="h-11" />
    </div>
  );
}
