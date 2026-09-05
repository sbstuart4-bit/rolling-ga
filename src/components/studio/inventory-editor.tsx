"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { availableUnits } from "@/lib/merch-catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateInventoryAction, type MerchActionState } from "@/server/studio/merch-actions";

export function InventoryEditor({
  artistId,
  productId,
  variants,
}: {
  artistId: string;
  productId: string;
  variants: {
    id: string;
    sku: string;
    size: string | null;
    onHand: number | null;
    reserved: number | null;
    reorderPoint: number | null;
  }[];
}) {
  if (variants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No variants — digital products skip inventory.</p>
    );
  }

  return (
    <div className="space-y-4">
      {variants.map((variant) => (
        <VariantInventoryRow
          key={variant.id}
          artistId={artistId}
          productId={productId}
          variant={variant}
        />
      ))}
    </div>
  );
}

function VariantInventoryRow({
  artistId,
  productId,
  variant,
}: {
  artistId: string;
  productId: string;
  variant: {
    id: string;
    sku: string;
    size: string | null;
    onHand: number | null;
    reserved: number | null;
    reorderPoint: number | null;
  };
}) {
  const [state, action, pending] = useActionState<MerchActionState, FormData>(
    updateInventoryAction,
    {},
  );

  const available = availableUnits(variant.onHand, variant.reserved);

  return (
    <form action={action} className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
      <input type="hidden" name="artistId" value={artistId} />
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="variantId" value={variant.id} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{variant.size ?? "One size"}</p>
          <p className="text-xs text-muted-foreground font-mono">{variant.sku}</p>
        </div>
        <dl className="flex gap-4 text-xs tabular">
          <div><dt className="text-muted-foreground">Available</dt><dd className="font-semibold">{available}</dd></div>
          <div><dt className="text-muted-foreground">Reserved</dt><dd>{variant.reserved ?? 0}</dd></div>
          <div><dt className="text-muted-foreground">On hand</dt><dd>{variant.onHand ?? 0}</dd></div>
        </dl>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`onHand-${variant.id}`}>On hand</Label>
          <Input id={`onHand-${variant.id}`} name="onHand" type="number" defaultValue={variant.onHand ?? 0} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`reorder-${variant.id}`}>Reorder point</Label>
          <Input id={`reorder-${variant.id}`} name="reorderPoint" type="number" defaultValue={variant.reorderPoint ?? 5} className="h-10" />
        </div>
      </div>

      {state.ok && <p className="text-xs text-emerald-400">Inventory updated.</p>}
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}

      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? <Loader2 className="size-3 animate-spin" /> : "Update inventory"}
      </Button>
    </form>
  );
}
