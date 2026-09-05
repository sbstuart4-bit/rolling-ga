import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  artists,
  cartItems,
  carts,
  events,
  orderItems,
  orders,
  productVariants,
  products,
  shipments,
  shippingOptions,
  venues,
} from "@/db/schema";
import {
  getCommerceEventContext,
  primaryCartEventId,
  type CommerceEventContext,
} from "./attribution";
import { buildShippingChoice, shippingOptionInScope, type ResolvedShippingChoice } from "@/lib/shipping";
import { resolveProductImage } from "@/lib/demo-product-images";
import { demoNow } from "@/server/demo/clock";
export { getCommerceEventContext, type CommerceEventContext } from "./attribution";
export { getOrCreateCart, countCartItems, findActiveCart } from "./cart";

export async function getCartWithItems(userId: string) {
  const cart = await db
    .select()
    .from(carts)
    .where(and(eq(carts.userId, userId), eq(carts.status, "active")))
    .orderBy(desc(carts.createdAt))
    .limit(1);

  if (!cart[0]) return null;

  const items = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.cartId, cart[0].id))
    .orderBy(asc(cartItems.addedAt));

  return { cart: cart[0], items };
}

/**
 * The cart joined to the catalogue for rendering.
 *
 * Deliberately separate from `resolveCartForCheckout`: that refuses the whole cart when
 * a line has gone bad, whereas the cart screen has to show every line — including a
 * broken one — so the fan can see what it is and remove it.
 */
export async function getCartForDisplay(userId: string) {
  const [cart] = await db
    .select()
    .from(carts)
    .where(and(eq(carts.userId, userId), eq(carts.status, "active")))
    .orderBy(desc(carts.createdAt))
    .limit(1);

  if (!cart) return null;

  const rows = await db
    .select({
      id: cartItems.id,
      quantity: cartItems.quantity,
      unitPriceCents: cartItems.unitPriceCents,
      sourceEventId: cartItems.sourceEventId,
      productId: products.id,
      productName: products.name,
      productSlug: products.slug,
      productImages: products.images,
      artistId: products.artistId,
      size: productVariants.size,
      color: productVariants.color,
    })
    .from(cartItems)
    .leftJoin(products, eq(products.id, cartItems.productId))
    .leftJoin(productVariants, eq(productVariants.id, cartItems.variantId))
    .where(eq(cartItems.cartId, cart.id))
    .orderBy(asc(cartItems.addedAt));

  const items = rows.map(({ productImages, productId, ...row }) => ({
    ...row,
    imageUrl:
      productId != null
        ? (resolveProductImage(productId, productImages) ?? null)
        : (productImages?.[0] ?? null),
  }));

  const eventId = primaryCartEventId(
    cart.eventId,
    items.map((item) => item.sourceEventId),
  );
  const eventContext = await getCommerceEventContext(eventId);

  let tourId: string | null = null;
  if (eventId) {
    const [eventRow] = await db
      .select({ tourId: events.tourId })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);
    tourId = eventRow?.tourId ?? null;
  }

  return { cart, items, eventContext, tourId };
}

export type CartDisplayLine = NonNullable<
  Awaited<ReturnType<typeof getCartForDisplay>>
>["items"][number];

/* ------------------------------------------------------------------ *
 * Shipping options
 * ------------------------------------------------------------------ */

export interface ShippingCheckoutScope {
  eventId?: string | null;
  tourId?: string | null;
}

export async function listShippingOptions(artistId: string) {
  const rows = await db
    .select()
    .from(shippingOptions)
    .where(and(eq(shippingOptions.artistId, artistId), eq(shippingOptions.active, true)))
    .orderBy(asc(shippingOptions.displayOrder));

  return rows;
}

/** Active options scoped to the fan's show context (artist-wide, tour, or event promos). */
export async function listShippingOptionsForCheckout(
  artistId: string,
  scope: ShippingCheckoutScope = {},
) {
  const rows = await listShippingOptions(artistId);
  return rows.filter((option) => shippingOptionInScope(option, scope));
}

export function resolveShippingChoices(
  options: Awaited<ReturnType<typeof listShippingOptions>>,
  subtotalCents: number,
  now = demoNow(),
): ResolvedShippingChoice[] {
  return options.map((option) =>
    buildShippingChoice(
      {
        id: option.id,
        name: option.name,
        speed: option.speed,
        strategy: option.strategy,
        carrierCostCents: option.carrierCostCents,
        baseCustomerChargeCents: option.baseCustomerChargeCents,
        subsidyCents: option.subsidyCents,
        freeThresholdCents: option.freeThresholdCents,
        deliveryMinDays: option.deliveryMinDays ?? 3,
        deliveryMaxDays: option.deliveryMaxDays ?? 7,
      },
      subtotalCents,
      now,
    ),
  );
}

export { customerShippingCharge } from "@/lib/shipping";

/* ------------------------------------------------------------------ *
 * Orders
 * ------------------------------------------------------------------ */

const orderSelection = {
  id: orders.id,
  orderNumber: orders.orderNumber,
  status: orders.status,
  subtotalCents: orders.subtotalCents,
  shippingCustomerChargeCents: orders.shippingCustomerChargeCents,
  shippingCarrierCostCents: orders.shippingCarrierCostCents,
  shippingArtistSubsidyCents: orders.shippingArtistSubsidyCents,
  taxCents: orders.taxCents,
  totalCents: orders.totalCents,
  shippingOptionId: orders.shippingOptionId,
  shippingMethodLabel: orders.shippingMethodLabel,
  estimatedDeliveryFrom: orders.estimatedDeliveryFrom,
  estimatedDeliveryTo: orders.estimatedDeliveryTo,
  shippingName: orders.shippingName,
  shippingLine1: orders.shippingLine1,
  shippingLine2: orders.shippingLine2,
  shippingCity: orders.shippingCity,
  shippingRegion: orders.shippingRegion,
  shippingPostalCode: orders.shippingPostalCode,
  shippingCountry: orders.shippingCountry,
  paymentMethodKind: orders.paymentMethodKind,
  placedAt: orders.placedAt,
  artistId: orders.artistId,
  eventId: orders.eventId,
  commerceSource: orders.commerceSource,
  eventSlug: events.slug,
  venueName: venues.name,
  venueCity: venues.city,
  eventStartsAt: events.startsAt,
  eventTimezone: events.timezone,
  artistName: artists.name,
} as const;

export type OrderRow = Awaited<ReturnType<typeof listOrdersForFan>>[number];

export async function listOrdersForFan(userId: string) {
  return db
    .select(orderSelection)
    .from(orders)
    .innerJoin(artists, eq(artists.id, orders.artistId))
    .leftJoin(events, eq(events.id, orders.eventId))
    .leftJoin(venues, eq(venues.id, events.venueId))
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.placedAt));
}

export async function getOrder(orderId: string, userId: string) {
  const [row] = await db
    .select(orderSelection)
    .from(orders)
    .innerJoin(artists, eq(artists.id, orders.artistId))
    .leftJoin(events, eq(events.id, orders.eventId))
    .leftJoin(venues, eq(venues.id, events.venueId))
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);

  return row ?? null;
}

export async function listOrderItems(orderId: string) {
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function listOrderShipments(orderId: string) {
  return db.select().from(shipments).where(eq(shipments.orderId, orderId));
}

export async function listOrdersForEvent(eventId: string, artistId: string) {
  return db
    .select(orderSelection)
    .from(orders)
    .innerJoin(artists, eq(artists.id, orders.artistId))
    .leftJoin(events, eq(events.id, orders.eventId))
    .leftJoin(venues, eq(venues.id, events.venueId))
    .where(and(eq(orders.eventId, eventId), eq(orders.artistId, artistId)))
    .orderBy(desc(orders.placedAt));
}
