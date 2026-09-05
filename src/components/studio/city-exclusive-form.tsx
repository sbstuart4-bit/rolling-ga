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
import { PRODUCT_CATEGORIES } from "@/lib/types";
import { createCityExclusiveAction, type MerchActionState } from "@/server/studio/merch-actions";

export function CityExclusiveForm({
  artistId,
  events,
  defaultEventId,
}: {
  artistId: string;
  events: { id: string; venueCity: string }[];
  defaultEventId?: string;
}) {
  const [state, action, pending] = useActionState<MerchActionState, FormData>(
    createCityExclusiveAction,
    {},
  );

  return (
    <form action={action} className="space-y-5 rounded-2xl border border-border bg-card/40 p-6">
      <input type="hidden" name="artistId" value={artistId} />

      <header className="space-y-1">
        <h2 className="text-lg font-semibold">City exclusive</h2>
        <p className="text-sm text-muted-foreground">
          Verified attendees only · scoped to one show · optional quantity and availability window.
        </p>
      </header>

      <div className="space-y-1.5">
        <Label htmlFor="eventId">Eligible show</Label>
        <select
          id="eventId"
          name="eventId"
          required
          defaultValue={defaultEventId ?? ""}
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Select show</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.venueCity}
            </option>
          ))}
        </select>
      </div>

      <Field label="Product name" name="name" required placeholder="Detroit Encore Tee" />
      <Field label="Tagline" name="tagline" placeholder="For those who were there." />
      <div className="space-y-1.5">
        <Label htmlFor="story">Story</Label>
        <textarea id="story" name="story" rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
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
        <Field label="Produced quantity (optional)" name="producedQuantity" type="number" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Price (cents)" name="basePriceCents" type="number" required />
        <Field label="Unit cost (cents)" name="unitCostCents" type="number" />
        <Field label="SKU" name="sku" required />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Sizes" name="sizes" placeholder="S, M, L, XL" defaultValue="S, M, L, XL" />
        <Field label="Initial stock" name="initialStock" type="number" defaultValue="100" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Available from" name="availableFrom" type="datetime-local" />
        <Field label="Available until" name="availableUntil" type="datetime-local" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="images">Image URLs (one per line)</Label>
        <textarea id="images" name="images" rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-xs" />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Create city exclusive"}
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
