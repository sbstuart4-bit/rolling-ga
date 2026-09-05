import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Package, ShoppingBag } from "lucide-react";
import { BundleUpsellCard } from "@/components/fan/bundle-upsell-card";
import { CartShippingPreview } from "@/components/fan/shipping-options-ui";
import { EventCommerceTakeover } from "@/components/fan/event-commerce-takeover";
import { EventCommerceBody } from "@/components/fan/event-commerce-chrome";
import { Button } from "@/components/ui/button";
import { cartMetadataTitle, cartPageSubtitle } from "@/lib/cart-copy";
import { cn } from "@/lib/utils";
import { requireAuth } from "@/server/auth/request";
import {
  getCartForDisplay,
  listShippingOptionsForCheckout,
  resolveShippingChoices,
} from "@/server/commerce/queries";
import { serializeShippingChoices } from "@/server/commerce/shipping-display";
import { removeCartItemAction } from "@/server/commerce/actions";
import { listActiveBundlesForEvent } from "@/server/catalog/queries";
import { formatMoney } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await requireAuth();
  const cartData = await getCartForDisplay(ctx.userId);
  return { title: cartMetadataTitle(cartData?.eventContext) };
}

export default async function CartPage() {
  const ctx = await requireAuth("/cart");
  const cartData = await getCartForDisplay(ctx.userId);

  if (!cartData || cartData.items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60dvh] max-w-lg flex-col items-center justify-center gap-6 px-5 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="size-7 text-muted-foreground" aria-hidden />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold">Your cart is empty</h1>
          <p className="text-sm text-muted-foreground">Add something from an active drop or product page.</p>
        </div>
        <Button asChild>
          <Link href="/">Browse drops</Link>
        </Button>
      </div>
    );
  }

  const { cart, items, eventContext, tourId } = cartData;
  const subtotal = items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);
  const artistId = items[0]?.artistId;
  const eventId = eventContext?.eventId ?? cart.eventId ?? null;

  const shippingOptions = artistId
    ? await listShippingOptionsForCheckout(artistId, { eventId, tourId })
    : [];
  const shippingChoices = serializeShippingChoices(resolveShippingChoices(shippingOptions, subtotal));
  const branded = Boolean(eventContext);

  const bundleSections =
    eventContext && artistId
      ? await listActiveBundlesForEvent(eventContext.eventId, artistId)
      : [];
  const featuredBundle = bundleSections[0];
  const cartProductSlugs = new Set(items.map((item) => item.productSlug).filter(Boolean));
  const showBundleUpsell =
    featuredBundle &&
    featuredBundle.items.some((item) => !cartProductSlugs.has(item.productSlug));

  return (
    <EventCommerceTakeover
      eventContext={eventContext}
      userId={ctx.userId}
      title="My Drop"
      subtitle={cartPageSubtitle(eventContext)}
    >
      <EventCommerceBody className={cn(!branded && "pt-6")}>
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className={cn(
                "flex items-start gap-4 rounded-xl border p-4",
                branded ? "border-artist-border bg-artist-surface" : "border-border bg-card",
              )}
            >
              <div
                className={cn(
                  "relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg",
                  branded ? "bg-artist-bg" : "bg-muted",
                )}
              >
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt="" fill sizes="56px" className="object-cover" />
                ) : (
                  <Package
                    className={cn("size-6", branded ? "text-artist-muted/40" : "text-muted-foreground/40")}
                    aria-hidden
                  />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className={cn("font-medium", branded && "text-artist-fg")}>
                  {item.productName ?? "Unavailable item"}
                </p>
                <p className={cn("text-sm", branded ? "text-artist-muted" : "text-muted-foreground")}>
                  {[item.size, item.color].filter(Boolean).join(" · ")}
                  {item.size || item.color ? " · " : ""}
                  Qty {item.quantity}
                </p>
              </div>
              <div className="space-y-1 text-right">
                <p className={cn("tabular font-medium", branded && "text-artist-fg")}>
                  {formatMoney(item.unitPriceCents * item.quantity)}
                </p>
                <form action={removeCartItemAction}>
                  <input type="hidden" name="itemId" value={item.id} />
                  <button
                    type="submit"
                    className={cn(
                      "text-xs underline",
                      branded
                        ? "text-artist-muted hover:text-artist-fg"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Remove
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>

        {showBundleUpsell && featuredBundle && eventContext && (
          <BundleUpsellCard
            bundleName={featuredBundle.bundle.name}
            description={featuredBundle.bundle.description}
            bundlePriceCents={featuredBundle.bundle.bundlePriceCents}
            savingsCents={featuredBundle.savingsCents}
            itemCount={featuredBundle.items.length}
            shopHref={`/event/${eventContext.eventSlug}/shop#bundle`}
            branded={branded}
          />
        )}

        <CartShippingPreview
          choices={shippingChoices}
          subtotalCents={subtotal}
          checkoutHref={`/checkout?cart=${cart.id}`}
          branded={branded}
        />
      </EventCommerceBody>
    </EventCommerceTakeover>
  );
}
