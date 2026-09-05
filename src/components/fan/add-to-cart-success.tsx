"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AddToCartSuccess({
  productName,
  variantLabel,
  quantity,
  eventSlug,
  branded = false,
  onKeepShopping,
}: {
  productName: string;
  variantLabel?: string | null;
  quantity: number;
  eventSlug?: string;
  branded?: boolean;
  /** Generic journeys dismiss inline; event-scoped journeys link to the show shop. */
  onKeepShopping?: () => void;
}) {
  const keepShoppingHref = eventSlug ? `/event/${eventSlug}/shop` : undefined;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "space-y-4 rounded-2xl border p-5",
        branded
          ? "border-artist-accent/30 bg-artist-accent/10"
          : "border-border bg-muted/40",
      )}
    >
      <div className="space-y-1">
        <p
          className={cn(
            "flex items-center gap-2 text-sm font-semibold tracking-wide uppercase",
            branded ? "text-artist-accent" : "text-foreground",
          )}
        >
          <Check className="size-4 shrink-0" aria-hidden />
          {branded ? "Added to My Drop" : "Added to cart"}
        </p>
        <p className={cn("font-medium", branded ? "text-artist-fg" : "text-foreground")}>
          {productName}
        </p>
        <p className={cn("text-sm", branded ? "text-artist-muted" : "text-muted-foreground")}>
          {[variantLabel, `Qty ${quantity}`].filter(Boolean).join(" · ")}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          asChild
          size="lg"
          variant={branded ? "moment" : "default"}
          className={cn("w-full font-semibold tracking-wide uppercase", !branded && "h-12")}
        >
          <Link href="/cart">{branded ? "View My Drop" : "View cart"}</Link>
        </Button>

        {keepShoppingHref ? (
          <Button
            asChild
            variant="outline"
            size="lg"
            className={cn(
              "h-12 w-full font-semibold tracking-wide uppercase",
              branded &&
                "border-artist-border bg-transparent text-artist-fg hover:bg-artist-accent/10",
            )}
          >
            <Link href={keepShoppingHref}>Keep shopping</Link>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-12 w-full font-semibold"
            onClick={onKeepShopping}
          >
            Keep shopping
          </Button>
        )}
      </div>
    </div>
  );
}
