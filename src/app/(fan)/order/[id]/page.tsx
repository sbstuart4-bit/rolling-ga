import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCommerceTakeover } from "@/components/fan/event-commerce-takeover";
import { EventCommerceBody } from "@/components/fan/event-commerce-chrome";
import { EventReturnLink } from "@/components/fan/event-commerce-context";
import { formatDeliveryWindow, formatMoney, formatDateTime } from "@/lib/format";
import { resolveFulfillmentStatus } from "@/lib/fulfillment";
import { FULFILLMENT_STATUS_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { requireAuth } from "@/server/auth/request";
import { getOrder, listOrderItems } from "@/server/commerce/queries";
import type { CommerceEventContext } from "@/server/commerce/attribution";

export const metadata: Metadata = { title: "It's yours — Rolling GA" };

/**
 * IT'S YOURS — the order confirmation screen.
 *
 * Named after the moment of purchase rather than "order #12345" because this is a
 * credential experience, not a checkout receipt. The fan's show record is surfaced
 * immediately so the purchase and the night connect in one place.
 */
export default async function OrderPage(props: PageProps<"/order/[id]">) {
  const { id } = await props.params;
  const ctx = await requireAuth(`/order/${id}`);

  const order = await getOrder(id, ctx.userId);
  if (!order) notFound();

  const [items] = await Promise.all([
    listOrderItems(order.id),
  ]);

  const eventContext: CommerceEventContext | null =
    order.eventId && order.eventSlug && order.eventStartsAt && order.eventTimezone
      ? {
          eventId: order.eventId,
          eventSlug: order.eventSlug,
          artistId: order.artistId,
          artistName: order.artistName,
          venueName: order.venueName ?? order.venueCity ?? "",
          venueCity: order.venueCity ?? "",
          startsAt: order.eventStartsAt,
          timezone: order.eventTimezone,
        }
      : null;
  const branded = Boolean(eventContext);
  const fulfillmentStatus = resolveFulfillmentStatus(order.fulfillmentStatus, order.status);

  return (
    <EventCommerceTakeover
      eventContext={eventContext}
      userId={ctx.userId}
      title="It's yours"
      subtitle={
        eventContext
          ? `Your piece of ${eventContext.artistName} at ${eventContext.venueCity} is on its way.`
          : undefined
      }
      backHref={eventContext ? `/event/${eventContext.eventSlug}` : undefined}
      backLabel="← Back to tonight's experience"
    >
      <EventCommerceBody className={cn("moment-layout moment-layout-centered space-y-7 py-10", !branded && "pt-6")}>
        <div className="space-y-3">
          <div
            className={cn(
              "mx-auto flex size-16 items-center justify-center rounded-full",
              branded ? "bg-artist-accent text-artist-accent-fg" : "bg-primary text-primary-foreground",
            )}
          >
            <BadgeCheck className="size-8" aria-hidden />
          </div>
          <h1 className={cn("display-xl text-3xl", branded && "text-artist-fg")}>It&rsquo;s yours</h1>
          <p className={cn("text-balance", branded ? "text-artist-muted" : "text-muted-foreground")}>
            Order <span className="tabular font-mono text-sm">{order.orderNumber}</span> confirmed.
            {eventContext
              ? " Your piece of tonight is on its way."
              : order.shippingName
                ? ` Shipping to ${order.shippingName}.`
                : ""}
          </p>
          {eventContext && (
            <p className={cn("text-sm", branded ? "text-artist-muted" : "text-muted-foreground")}>
              From {eventContext.artistName} at {eventContext.venueCity}
            </p>
          )}
        </div>

        <section className="space-y-2 text-left">
          <h2 className={cn("eyebrow", branded ? "text-artist-muted" : "text-muted-foreground")}>
            What you ordered
          </h2>
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3",
                  branded ? "border-artist-border bg-artist-surface" : "border-border bg-card",
                )}
              >
                <Package
                  className={cn("size-4 shrink-0", branded ? "text-artist-muted" : "text-muted-foreground")}
                  aria-hidden
                />
                <div className="flex-1 space-y-0.5">
                  <p className={cn("text-sm font-medium", branded && "text-artist-fg")}>
                    {item.nameSnapshot}
                  </p>
                  {item.sizeSnapshot && (
                    <p className={cn("text-xs", branded ? "text-artist-muted" : "text-muted-foreground")}>
                      {item.sizeSnapshot}
                    </p>
                  )}
                </div>
                <span className={cn("tabular text-sm", branded && "text-artist-fg")}>
                  {formatMoney(item.totalCents)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {order.shippingMethodLabel && (
          <section className="space-y-2 text-left">
            <h2 className={cn("eyebrow", branded ? "text-artist-muted" : "text-muted-foreground")}>
              Shipping
            </h2>
            <div
              className={cn(
                "space-y-1 rounded-xl border px-4 py-3 text-sm",
                branded ? "border-artist-border bg-artist-surface" : "border-border bg-card",
              )}
            >
              <p className={cn("font-medium", branded && "text-artist-fg")}>{order.shippingMethodLabel}</p>
              {order.estimatedDeliveryFrom && (
                <p className={branded ? "text-artist-muted" : "text-muted-foreground"}>
                  Estimated {formatDeliveryWindow(order.estimatedDeliveryFrom, order.estimatedDeliveryTo)}
                </p>
              )}
              {order.shippingCustomerChargeCents === 0 ? (
                <p className={branded ? "text-artist-muted" : "text-muted-foreground"}>Shipping: Free</p>
              ) : (
                <p className={branded ? "text-artist-muted" : "text-muted-foreground"}>
                  Shipping: {formatMoney(order.shippingCustomerChargeCents)}
                </p>
              )}
              {order.shippingLine1 && (
                <p className={branded ? "text-artist-muted" : "text-muted-foreground"}>
                  {order.shippingLine1}
                  {order.shippingCity ? `, ${order.shippingCity}` : ""}
                  {order.shippingPostalCode ? ` ${order.shippingPostalCode}` : ""}
                </p>
              )}
            </div>
          </section>
        )}

        {fulfillmentStatus ? (
          <section className="space-y-2 text-left">
            <h2 className={cn("eyebrow", branded ? "text-artist-muted" : "text-muted-foreground")}>
              Fulfillment
            </h2>
            <div
              className={cn(
                "rounded-xl border px-4 py-3 text-sm",
                branded ? "border-artist-border bg-artist-surface" : "border-border bg-card",
              )}
            >
              <p className={cn("font-medium", branded && "text-artist-fg")}>
                {FULFILLMENT_STATUS_LABELS[fulfillmentStatus]}
              </p>
              {order.promisedDeliveryAt ? (
                <p className={cn("mt-1", branded ? "text-artist-muted" : "text-muted-foreground")}>
                  Promised by {formatDateTime(order.promisedDeliveryAt, order.eventTimezone ?? undefined)}
                </p>
              ) : null}
              {order.actualDeliveredAt ? (
                <p className={cn("mt-1", branded ? "text-artist-muted" : "text-muted-foreground")}>
                  Delivered {formatDateTime(order.actualDeliveredAt, order.eventTimezone ?? undefined)}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        <section
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            branded ? "border-artist-border bg-artist-surface text-artist-fg" : "border-border bg-card",
          )}
        >
          <div className="flex justify-between font-semibold">
            <span>Total paid</span>
            <span className="tabular">{formatMoney(order.totalCents)}</span>
          </div>
        </section>

        <div className="space-y-2">
          {eventContext ? (
            <>
              <EventReturnLink context={eventContext} branded={branded} />
              <Button
                asChild
                variant="outline"
                size="lg"
                className={cn(
                  "w-full",
                  branded && "border-artist-border bg-transparent text-artist-fg hover:bg-artist-accent/10",
                )}
              >
                <Link href="/shows">View in My Shows</Link>
              </Button>
            </>
          ) : (
            <Button asChild size="lg" className="h-13 w-full font-semibold">
              <Link href="/shows">View in My Shows</Link>
            </Button>
          )}
          {!branded && (
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/">Back to Rolling GA</Link>
            </Button>
          )}
        </div>
      </EventCommerceBody>
    </EventCommerceTakeover>
  );
}
