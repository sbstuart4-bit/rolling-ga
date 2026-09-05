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
import {
  PRODUCT_ACCESS_LABELS,
  PRODUCT_ACCESS_TYPES,
  PRODUCT_CATEGORIES,
} from "@/lib/types";
import { updateProductAction, type MerchActionState } from "@/server/studio/merch-actions";

export function EditProductForm({
  artistId,
  product,
  tours,
  events,
}: {
  artistId: string;
  product: {
    id: string;
    name: string;
    tagline: string | null;
    story: string | null;
    category: string;
    accessType: string;
    basePriceCents: number;
    unitCostCents: number | null;
    sku: string;
    images: string[] | null;
    tourId: string | null;
    eventId: string | null;
    isDigital: boolean;
    producedQuantity: number | null;
    availableFrom: Date | null;
    availableUntil: Date | null;
  };
  tours: { id: string; name: string }[];
  events: { id: string; venueCity: string }[];
}) {
  const [state, action, pending] = useActionState<MerchActionState, FormData>(
    updateProductAction,
    {},
  );

  return (
    <form action={action} className="space-y-5 rounded-2xl border border-border bg-card/40 p-6">
      <input type="hidden" name="artistId" value={artistId} />
      <input type="hidden" name="productId" value={product.id} />

      <Field label="Product name" name="name" defaultValue={product.name} required />
      <Field label="Tagline" name="tagline" defaultValue={product.tagline ?? ""} />
      <div className="space-y-1.5">
        <Label htmlFor="story">Description</Label>
        <textarea id="story" name="story" rows={3} defaultValue={product.story ?? ""} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Select name="category" defaultValue={product.category}>
            <SelectTrigger id="category" className="h-11 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRODUCT_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="accessType">Access</Label>
          <Select name="accessType" defaultValue={product.accessType}>
            <SelectTrigger id="accessType" className="h-11 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRODUCT_ACCESS_TYPES.map((type) => (
                <SelectItem key={type} value={type}>{PRODUCT_ACCESS_LABELS[type]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Price (cents)" name="basePriceCents" type="number" defaultValue={String(product.basePriceCents)} required />
        <Field label="Unit cost (cents)" name="unitCostCents" type="number" defaultValue={product.unitCostCents?.toString() ?? ""} />
        <Field label="SKU" name="sku" defaultValue={product.sku} required />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="tourId">Tour</Label>
          <select id="tourId" name="tourId" defaultValue={product.tourId ?? ""} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">None</option>
            {tours.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="eventId">Show</Label>
          <select id="eventId" name="eventId" defaultValue={product.eventId ?? ""} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">None</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.venueCity}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="images">Image URLs</Label>
        <textarea id="images" name="images" rows={2} defaultValue={product.images?.join("\n") ?? ""} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-xs" />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isDigital" defaultChecked={product.isDigital} />
        Digital-only (Endless Aisle)
      </label>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.ok && <p className="text-sm text-emerald-400">Product saved.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Save changes"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} defaultValue={defaultValue} className="h-11" />
    </div>
  );
}
