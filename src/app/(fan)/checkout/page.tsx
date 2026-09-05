import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth } from "@/server/auth/request";
import { listShippingOptionsForCheckout, resolveShippingChoices } from "@/server/commerce/queries";
import { serializeShippingChoices } from "@/server/commerce/shipping-display";
import { resolveCartForCheckout } from "@/server/commerce/resolve";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CheckoutForm } from "@/components/fan/checkout-form";
import { EventCommerceTakeover } from "@/components/fan/event-commerce-takeover";
import { EventCommerceBody } from "@/components/fan/event-commerce-chrome";
import { getSavedShippingAddress } from "@/server/fans/preferences";

export const metadata: Metadata = { title: "Checkout — Rolling GA" };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireAuth("/checkout");
  const { cart: cartId } = await searchParams;

  // The same resolver the checkout action runs, so the page can never show a total or a
  // set of shipping options that the order would then be refused for.
  const resolution = await resolveCartForCheckout(ctx.userId);
  if (!resolution.ok) redirect("/cart");
  if (cartId && resolution.cartId !== cartId) redirect("/cart");

  const { artistId, lines, subtotalCents: subtotal, eventContext, eventId, tourId } = resolution;
  const [shippingOptions, savedShippingAddress] = await Promise.all([
    listShippingOptionsForCheckout(artistId, { eventId, tourId }),
    getSavedShippingAddress(ctx.userId),
  ]);
  const shippingChoices = serializeShippingChoices(resolveShippingChoices(shippingOptions, subtotal));
  const branded = Boolean(eventContext);

  return (
    <EventCommerceTakeover
      eventContext={eventContext}
      userId={ctx.userId}
      title="Checkout"
      subtitle="Complete your drop from tonight's show"
    >
      <EventCommerceBody className={cn(!branded && "pt-6")}>
        <div
          className={cn(
            "mb-6 rounded-xl border p-4",
            branded ? "border-artist-border bg-artist-surface" : "border-border bg-card",
          )}
        >
          <h2 className={cn("eyebrow mb-3", branded ? "text-artist-muted" : "text-muted-foreground")}>
            Order summary
          </h2>
          <ul className="space-y-2 text-sm">
            {lines.map((line) => (
              <li key={`${line.variantId}-${line.dropId ?? ""}`} className="flex items-center justify-between gap-3">
                <span className={branded ? "text-artist-muted" : "text-muted-foreground"}>
                  × {line.quantity}
                </span>
                <span className={cn("flex-1", branded && "text-artist-fg")}>
                  {line.name}
                  {line.size ? (
                    <span className={branded ? "text-artist-muted" : "text-muted-foreground"}>
                      {" "}
                      · {line.size}
                    </span>
                  ) : null}
                </span>
                <span className={cn("tabular", branded && "text-artist-fg")}>
                  {formatMoney(line.unitPriceCents * line.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div
            className={cn(
              "mt-3 flex items-center justify-between border-t pt-3 font-medium",
              branded ? "border-artist-border text-artist-fg" : "border-border",
            )}
          >
            <span>Subtotal</span>
            <span className="tabular">{formatMoney(subtotal)}</span>
          </div>
        </div>

        <CheckoutForm
          cartId={resolution.cartId}
          subtotalCents={subtotal}
          shippingOptions={shippingChoices}
          savedShippingAddress={savedShippingAddress}
          cartLines={lines.map((line) => ({
            name: line.name,
            size: line.size,
            quantity: line.quantity,
          }))}
          branded={branded}
        />
      </EventCommerceBody>
    </EventCommerceTakeover>
  );
}
