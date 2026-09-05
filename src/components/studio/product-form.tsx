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
import {
  PRODUCT_ACCESS_LABELS,
  PRODUCT_ACCESS_TYPES,
  PRODUCT_CATEGORIES,
} from "@/lib/types";
import { createProductAction, type MerchActionState } from "@/server/studio/merch-actions";

export function ProductForm({
  artistId,
  tours,
  events,
  defaults,
}: {
  artistId: string;
  tours: { id: string; name: string }[];
  events: { id: string; venueCity: string; tourId: string }[];
  defaults?: {
    eventId?: string;
    tourId?: string;
    accessType?: string;
    isDigital?: boolean;
  };
}) {
  const [state, action, pending] = useActionState<MerchActionState, FormData>(
    createProductAction,
    {},
  );

  return (
    <form action={action} className="space-y-5 rounded-2xl border border-border bg-card/40 p-6">
      <input type="hidden" name="artistId" value={artistId} />

      <Field label="Product name" name="name" required />
      <Field label="Tagline" name="tagline" />
      <div className="space-y-1.5">
        <Label htmlFor="story">Description</Label>
        <textarea
          id="story"
          name="story"
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Select name="category" defaultValue="apparel">
            <SelectTrigger id="category" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="accessType">Access</Label>
          <Select name="accessType" defaultValue={defaults?.accessType ?? "public"}>
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

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Price (cents)" name="basePriceCents" type="number" required />
        <Field label="Unit cost (cents, optional)" name="unitCostCents" type="number" />
        <Field label="SKU" name="sku" required />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="tourId">Tour eligibility</Label>
          <select
            id="tourId"
            name="tourId"
            defaultValue={defaults?.tourId ?? ""}
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Any / none</option>
            {tours.map((tour) => (
              <option key={tour.id} value={tour.id}>
                {tour.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="eventId">Show eligibility</Label>
          <select
            id="eventId"
            name="eventId"
            defaultValue={defaults?.eventId ?? ""}
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Not show-specific</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.venueCity}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Sizes (comma-separated)" name="sizes" placeholder="S, M, L, XL" />
        <Field label="Initial stock per variant" name="initialStock" type="number" defaultValue="50" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="images">Image URLs (one per line)</Label>
        <textarea
          id="images"
          name="images"
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-xs"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox name="isDigital" defaultChecked={defaults?.isDigital} />
        Digital-only (Endless Aisle — no venue inventory)
      </label>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Create product"}
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
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="h-11"
      />
    </div>
  );
}
