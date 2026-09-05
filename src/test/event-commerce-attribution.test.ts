/**
 * Event-scoped commerce attribution from add-to-cart through order confirmation.
 */
import { describe, it, expect, vi } from "vitest";
import { eq } from "drizzle-orm";
import { carts, orders } from "@/db/schema";
import {
  db,
  createUser,
  createArtist,
  createVenue,
  createTour,
  createEvent,
  createProduct,
  createVariantWithInventory,
  createVerifiedAttendance,
  createDrop,
  addDropProduct,
  authContextFor,
} from "./helpers";
import {
  commerceSourceForEvent,
  getCommerceEventContext,
  resolveValidatedCommerceEvent,
} from "@/server/commerce/attribution";
import { addToCartAction } from "@/server/commerce/actions";
import { getCartForDisplay, getOrder } from "@/server/commerce/queries";
import { resolveCartForCheckout } from "@/server/commerce/resolve";
import { demoNow } from "@/server/demo/clock";

const getAuthContext = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getAuthContext }));

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

describe("event commerce attribution", () => {
  it("resolves event slug to id and rejects artist mismatch", async () => {
    const artistA = await createArtist("Artist A");
    const artistB = await createArtist("Artist B");
    const venue = await createVenue();
    const tour = await createTour(artistA.id);
    const event = await createEvent(artistA.id, tour.id, venue.id);
    const product = await createProduct(artistA.id);

    const valid = await resolveValidatedCommerceEvent({
      eventSlug: event.slug,
      artistId: artistA.id,
      productId: product.id,
    });
    expect(valid.eventId).toBe(event.id);

    const invalid = await resolveValidatedCommerceEvent({
      eventSlug: event.slug,
      artistId: artistB.id,
      productId: product.id,
    });
    expect(invalid.error).toBeTruthy();
    expect(invalid.eventId).toBeNull();
  });

  it("ignores invalid event slug without creating false attribution", async () => {
    const artist = await createArtist();
    const product = await createProduct(artist.id);

    const result = await resolveValidatedCommerceEvent({
      eventSlug: "not-a-real-show",
      artistId: artist.id,
      productId: product.id,
    });
    expect(result.eventId).toBeNull();
    expect(result.error).toBeUndefined();
  });

  it("persists event context from product add-to-cart through checkout resolution", async () => {
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const product = await createProduct(artist.id, {
      accessType: "verified_attendee",
    });
    const variant = await createVariantWithInventory(product.id, 10);
    const fan = await createUser();
    await createVerifiedAttendance(fan.id, event.id);
    getAuthContext.mockResolvedValue(authContextFor(fan));

    const added = await addToCartAction(
      {},
      form({
        productId: product.id,
        productSlug: product.slug,
        artistId: artist.id,
        variantId: variant.id,
        eventSlug: event.slug,
        quantity: "1",
      }),
    );
    expect(added.ok).toBe(true);

    const cartView = await getCartForDisplay(fan.id);
    expect(cartView?.cart.eventId).toBe(event.id);
    expect(cartView?.items[0]?.sourceEventId).toBe(event.id);
    expect(cartView?.eventContext).toMatchObject({
      eventId: event.id,
      eventSlug: event.slug,
      artistName: artist.name,
      venueCity: venue.city,
    });

    const resolution = await resolveCartForCheckout(fan.id);
    expect(resolution.ok).toBe(true);
    if (!resolution.ok) return;
    expect(resolution.eventId).toBe(event.id);
    expect(resolution.eventContext?.eventSlug).toBe(event.slug);
    expect(commerceSourceForEvent(resolution.eventId)).toBe("event_scoped");
  });

  it("persists event context when adding from a drop on a show", async () => {
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const product = await createProduct(artist.id);
    const variant = await createVariantWithInventory(product.id, 10);
    const now = demoNow();
    const drop = await createDrop(artist.id, {
      eventId: event.id,
      startsAt: new Date(now.getTime() - 60_000),
      endsAt: new Date(now.getTime() + 60 * 60_000),
    });
    await addDropProduct(drop.id, product.id);
    const fan = await createUser();
    getAuthContext.mockResolvedValue(authContextFor(fan));

    const added = await addToCartAction(
      {},
      form({
        productId: product.id,
        productSlug: product.slug,
        artistId: artist.id,
        variantId: variant.id,
        eventSlug: event.slug,
        dropId: drop.id,
        quantity: "1",
      }),
    );
    expect(added.ok, added.error).toBe(true);

    const cartView = await getCartForDisplay(fan.id);
    expect(cartView?.items[0]?.sourceEventId).toBe(event.id);
  });

  it("rejects drop from a different show than the event slug", async () => {
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const eventA = await createEvent(artist.id, tour.id, venue.id);
    const eventB = await createEvent(artist.id, tour.id, venue.id);
    const product = await createProduct(artist.id);
    await createVariantWithInventory(product.id, 10);
    const drop = await createDrop(artist.id, { eventId: eventB.id });
    await addDropProduct(drop.id, product.id);
    const fan = await createUser();
    getAuthContext.mockResolvedValue(authContextFor(fan));

    const result = await addToCartAction(
      {},
      form({
        productId: product.id,
        productSlug: product.slug,
        artistId: artist.id,
        eventSlug: eventA.slug,
        dropId: drop.id,
        quantity: "1",
      }),
    );
    expect(result.error).toBeTruthy();
  });

  it("generic add-to-cart works without event context", async () => {
    const artist = await createArtist();
    const product = await createProduct(artist.id, { accessType: "public" });
    const variant = await createVariantWithInventory(product.id, 10);
    const fan = await createUser();
    getAuthContext.mockResolvedValue(authContextFor(fan));

    const added = await addToCartAction(
      {},
      form({
        productId: product.id,
        productSlug: product.slug,
        artistId: artist.id,
        variantId: variant.id,
        quantity: "1",
      }),
    );
    expect(added.ok).toBe(true);

    const cartView = await getCartForDisplay(fan.id);
    expect(cartView?.cart.eventId).toBeNull();
    expect(cartView?.eventContext).toBeNull();

    const resolution = await resolveCartForCheckout(fan.id);
    expect(resolution.ok).toBe(true);
    if (!resolution.ok) return;
    expect(resolution.eventId).toBeNull();
    expect(commerceSourceForEvent(resolution.eventId)).toBe("generic");
  });

  it("stores commerceSource on the order when eventId is present", async () => {
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);

    const context = await getCommerceEventContext(event.id);
    expect(context?.eventSlug).toBeTruthy();

    const { createOrderFromCheckout } = await import("@/server/payments/dev-order");
    const fan = await createUser();
    const product = await createProduct(artist.id);
    const variant = await createVariantWithInventory(product.id, 5);
    const [cart] = await db().insert(carts).values({ userId: fan.id, eventId: event.id }).returning();

    const result = await createOrderFromCheckout({
      userId: fan.id,
      artistId: artist.id,
      eventId: event.id,
      commerceSource: "event_scoped",
      cartId: cart.id,
      lines: [
        {
          productId: product.id,
          variantId: variant.id,
          name: product.name,
          quantity: 1,
          unitPriceCents: 4500,
        },
      ],
      subtotalCents: 4500,
      shippingCustomerChargeCents: 0,
      shippingCarrierCostCents: 0,
      shippingArtistSubsidyCents: 0,
      taxCents: 0,
      totalCents: 4500,
      shippingName: "Test Fan",
      shippingLine1: "123 Main St",
      shippingCity: "Detroit",
      shippingRegion: "MI",
      shippingPostalCode: "48201",
      shippingCountry: "US",
    });

    const order = await getOrder(result.orderId!, fan.id);
    expect(order?.eventId).toBe(event.id);
    expect(order?.commerceSource).toBe("event_scoped");
    expect(order?.eventSlug).toBe(event.slug);

    const [raw] = await db().select().from(orders).where(eq(orders.id, result.orderId!));
    expect(raw.commerceSource).toBe("event_scoped");
  });
});
