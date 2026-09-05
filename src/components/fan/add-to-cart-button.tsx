"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import { AddToCartSuccess } from "@/components/fan/add-to-cart-success";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  initialVariantSelection,
  resolvePreferredVariant,
  type SizedVariantOption,
} from "@/lib/apparel-size";
import { cn } from "@/lib/utils";
import { addToCartAction, type CartActionState } from "@/server/commerce/actions";

/**
 * No price is posted. The action re-derives it from the product, the variant and any
 * drop that applies, so what the browser believes an item costs never reaches the cart.
 */
export function AddToCartButton({
  productId,
  productName,
  productSlug,
  artistId,
  eventId,
  eventSlug,
  dropId,
  variants,
  savedApparelSize = null,
  branded = false,
}: {
  productId: string;
  productName: string;
  productSlug: string;
  artistId: string;
  eventId?: string;
  eventSlug?: string;
  dropId?: string;
  variants?: SizedVariantOption[];
  savedApparelSize?: string | null;
  branded?: boolean;
}) {
  const [state, action, pending] = useActionState<CartActionState, FormData>(addToCartAction, {});
  const initial = React.useMemo(
    () => initialVariantSelection(variants ?? [], savedApparelSize),
    [variants, savedApparelSize],
  );
  const [selectedVariant, setSelectedVariant] = React.useState(initial.variantId);
  const [successVisible, setSuccessVisible] = React.useState(false);

  React.useEffect(() => {
    setSelectedVariant(initial.variantId);
  }, [initial.variantId]);

  React.useEffect(() => {
    if (state.ok) setSuccessVisible(true);
  }, [state]);

  const hasSizes = variants && variants.length > 0;
  const sizedVariant = hasSizes ? variants.find((variant) => variant.id === selectedVariant) : null;
  const outOfStock = sizedVariant ? sizedVariant.available === 0 : false;
  const variantLabel = sizedVariant?.size ?? (hasSizes ? null : undefined);
  const quantity = 1;
  const resolution = hasSizes
    ? resolvePreferredVariant(variants, savedApparelSize)
    : { kind: "none" as const };
  const selectedSize = sizedVariant?.size?.trim().toUpperCase() ?? "";
  const savedSize = savedApparelSize?.trim().toUpperCase() ?? "";
  const sizeMatchesSaved = Boolean(savedSize && selectedSize && savedSize === selectedSize);
  const showSaveSizeOption = hasSizes && selectedSize.length > 0 && !sizeMatchesSaved;

  if (successVisible && state.ok) {
    return (
      <AddToCartSuccess
        productName={productName}
        variantLabel={variantLabel}
        quantity={quantity}
        eventSlug={eventSlug}
        branded={branded}
        onKeepShopping={() => setSuccessVisible(false)}
      />
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="productSlug" value={productSlug} />
      <input type="hidden" name="artistId" value={artistId} />
      {eventId && <input type="hidden" name="eventId" value={eventId} />}
      {eventSlug && <input type="hidden" name="eventSlug" value={eventSlug} />}
      {dropId && <input type="hidden" name="dropId" value={dropId} />}
      <input type="hidden" name="quantity" value={String(quantity)} />
      {showSaveSizeOption && selectedSize ? (
        <>
          <input type="hidden" name="preferredApparelSize" value={selectedSize} />
        </>
      ) : null}

      {hasSizes && (
        <div className="space-y-2">
          {resolution.kind === "matched" && selectedVariant === resolution.variantId && (
            <p className={cn("text-sm font-medium text-emerald-700 dark:text-emerald-400", branded && "text-artist-accent")}>
              Your saved size ({resolution.size}) is selected
            </p>
          )}

          {resolution.kind === "unavailable" && (
            <p role="status" className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
              Your saved size ({resolution.savedSize}) is sold out for this piece. Choose another size.
            </p>
          )}

          {resolution.kind === "not_in_product" && (
            <p className="text-sm text-muted-foreground">
              Your saved size ({resolution.savedSize}) is not offered on this piece.
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor={`size-${productId}`} className={cn(branded && "text-artist-muted")}>
              Size
            </Label>
            <Select value={selectedVariant} onValueChange={setSelectedVariant} name="variantId">
              <SelectTrigger
                id={`size-${productId}`}
                className={cn(
                  "h-11",
                  branded && "border-artist-border bg-artist-surface text-artist-fg",
                )}
              >
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {variants.map((variant) => (
                  <SelectItem key={variant.id} value={variant.id} disabled={variant.available === 0}>
                    {variant.size ?? "One size"}
                    {variant.available === 0
                      ? " — sold out"
                      : variant.available <= 5
                        ? ` — ${variant.available} left`
                        : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showSaveSizeOption && (
            <label className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm">
              <input
                type="checkbox"
                name="saveApparelSize"
                value="true"
                defaultChecked={!savedSize}
                className="mt-0.5 size-4 rounded border-input"
              />
              <span className={cn("text-muted-foreground", branded && "text-artist-muted")}>
                Save {selectedSize} as my preferred size
              </span>
            </label>
          )}
        </div>
      )}

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        variant={branded ? "moment" : "default"}
        disabled={outOfStock || pending || (hasSizes && !selectedVariant)}
        className={cn("w-full", !branded && "bg-primary hover:bg-primary/90")}
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Adding…
          </>
        ) : outOfStock ? (
          "Sold out"
        ) : (
          <>
            <ShoppingBag className="size-4" aria-hidden />
            {branded ? "Add to my drop" : "Add to cart"}
          </>
        )}
      </Button>
    </form>
  );
}
