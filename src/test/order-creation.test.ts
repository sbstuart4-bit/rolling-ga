/**
 * Order creation and inventory reservation.
 */
import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { inventory, orderItems, orders } from "@/db/schema";
import {
  db,
  createUser,
  createArtist,
  createVenue,
  createTour,
  createEvent,
  createProduct,
  createVariantWithInventory,
} from "./helpers";
import { createOrderFromCheckout } from "@/server/payments/dev-order";

describe("order creation (DevCheckoutProvider)", () => {
  it("creates an order with the correct total", async () => {
    const user = await createUser();
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const product = await createProduct(artist.id);
    const variant = await createVariantWithInventory(product.id, 5);

    // Create a minimal cart (no db-level cart needed for this test — we call the function directly)
    // We need a cart id — create a simple placeholder
    const { carts } = await import("@/db/schema");
    const [cart] = await db().insert(carts).values({ userId: user.id }).returning();

    const result = await createOrderFromCheckout({
      userId: user.id,
      artistId: artist.id,
      eventId: event.id,
      commerceSource: "event_scoped",
      cartId: cart.id,
      lines: [
        {
          productId: product.id,
          variantId: variant.id,
          name: product.name,
          quantity: 2,
          unitPriceCents: 4500,
        },
      ],
      subtotalCents: 9000,
      shippingCustomerChargeCents: 500,
      shippingCarrierCostCents: 700,
      shippingArtistSubsidyCents: 200,
      taxCents: 0,
      totalCents: 9500,
      shippingName: "Test Fan",
      shippingLine1: "123 Main St",
      shippingCity: "Detroit",
      shippingRegion: "MI",
      shippingPostalCode: "48201",
      shippingCountry: "US",
    });

    expect(result.ok).toBe(true);
    expect(result.orderNumber).toMatch(/^RGA-/);

    // Verify order row
    const [order] = await db()
      .select()
      .from(orders)
      .where(eq(orders.id, result.orderId!));
    expect(order.totalCents).toBe(9500);
    expect(order.status).toBe("paid");
    expect(order.artistId).toBe(artist.id);

    // Verify line item
    const items = await db().select().from(orderItems).where(eq(orderItems.orderId, order.id));
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
    expect(items[0].unitPriceCents).toBe(4500);

    // Verify inventory was reserved (not decremented)
    const [inv] = await db().select().from(inventory).where(eq(inventory.variantId, variant.id));
    expect(inv.onHand).toBe(5); // on-hand unchanged
    expect(inv.reserved).toBe(2); // two units reserved
  });

  it("sets cart status to converted", async () => {
    const user = await createUser();
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const product = await createProduct(artist.id);
    const variant = await createVariantWithInventory(product.id, 10);

    const { carts } = await import("@/db/schema");
    const [cart] = await db().insert(carts).values({ userId: user.id }).returning();

    await createOrderFromCheckout({
      userId: user.id,
      artistId: artist.id,
      eventId: event.id,
      commerceSource: "event_scoped",
      cartId: cart.id,
      lines: [{ productId: product.id, variantId: variant.id, name: product.name, quantity: 1, unitPriceCents: 4500 }],
      subtotalCents: 4500,
      shippingCustomerChargeCents: 0,
      shippingCarrierCostCents: 0,
      shippingArtistSubsidyCents: 0,
      taxCents: 0,
      totalCents: 4500,
      shippingName: "Test",
      shippingLine1: "1 Main",
      shippingCity: "Detroit",
      shippingRegion: "MI",
      shippingPostalCode: "48201",
      shippingCountry: "US",
    });

    const [updatedCart] = await db().select().from(carts).where(eq(carts.id, cart.id));
    expect(updatedCart.status).toBe("converted");
  });
});
