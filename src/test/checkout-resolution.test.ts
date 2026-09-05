/**
 * Checkout artist resolution and line revalidation.
 *
 * A cart can sit for days between being filled and being paid for, so everything in it
 * is re-derived at checkout. These tests cover the artist the order is attributed to and
 * each way a line can go stale between the two moments.
 */
import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { cartItems, carts, inventory } from "@/db/schema";
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
} from "./helpers";
import { resolveCartForCheckout } from "@/server/commerce/resolve";
import { demoNow } from "@/server/demo/clock";

async function createCart(userId: string, eventId?: string) {
  const [cart] = await db()
    .insert(carts)
    .values({ userId, eventId: eventId ?? null })
    .returning();
  return cart;
}

async function addLine(
  cartId: string,
  values: {
    productId?: string;
    variantId?: string;
    dropId?: string;
    quantity?: number;
    unitPriceCents: number;
  },
) {
  const [item] = await db()
    .insert(cartItems)
    .values({
      cartId,
      productId: values.productId ?? null,
      variantId: values.variantId ?? null,
      dropId: values.dropId ?? null,
      quantity: values.quantity ?? 1,
      unitPriceCents: values.unitPriceCents,
    })
    .returning();
  return item;
}

describe("checkout — artist resolution", () => {
  it("derives the artist and total from the cart's own contents", async () => {
    const user = await createUser();
    const artist = await createArtist();
    const product = await createProduct(artist.id, { basePriceCents: 4000, name: "Tour Tee" });
    const variant = await createVariantWithInventory(product.id, 10, { size: "L" });
    const cart = await createCart(user.id);
    await addLine(cart.id, {
      productId: product.id,
      variantId: variant.id,
      quantity: 2,
      unitPriceCents: 4000,
    });

    const resolution = await resolveCartForCheckout(user.id);

    expect(resolution.ok).toBe(true);
    if (!resolution.ok) return;
    expect(resolution.artistId).toBe(artist.id);
    expect(resolution.subtotalCents).toBe(8000);
    expect(resolution.lines).toHaveLength(1);
    expect(resolution.lines[0].name).toBe("Tour Tee");
    expect(resolution.lines[0].size).toBe("L");
  });

  it("rejects a cart spanning two artists", async () => {
    const user = await createUser();
    const artistA = await createArtist("Artist A");
    const artistB = await createArtist("Artist B");
    const productA = await createProduct(artistA.id);
    const productB = await createProduct(artistB.id);
    const variantA = await createVariantWithInventory(productA.id, 10);
    const variantB = await createVariantWithInventory(productB.id, 10);
    const cart = await createCart(user.id);
    await addLine(cart.id, { productId: productA.id, variantId: variantA.id, unitPriceCents: 4500 });
    await addLine(cart.id, { productId: productB.id, variantId: variantB.id, unitPriceCents: 4500 });

    const resolution = await resolveCartForCheckout(user.id);

    expect(resolution.ok).toBe(false);
    if (resolution.ok) return;
    expect(resolution.reason).toBe("multiple_artists");
  });

  it("drops a cart show that belongs to a different artist", async () => {
    const user = await createUser();
    const artistA = await createArtist("Artist A");
    const artistB = await createArtist("Artist B");
    const venue = await createVenue();
    const tourB = await createTour(artistB.id);
    const eventB = await createEvent(artistB.id, tourB.id, venue.id);
    const product = await createProduct(artistA.id);
    const variant = await createVariantWithInventory(product.id, 10);
    const cart = await createCart(user.id, eventB.id);
    await addLine(cart.id, { productId: product.id, variantId: variant.id, unitPriceCents: 4500 });

    const resolution = await resolveCartForCheckout(user.id);

    expect(resolution.ok).toBe(true);
    if (!resolution.ok) return;
    expect(resolution.artistId).toBe(artistA.id);
    expect(resolution.eventId).toBeNull();
  });

  it("keeps a cart show that belongs to the cart's artist", async () => {
    const user = await createUser();
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const product = await createProduct(artist.id);
    const variant = await createVariantWithInventory(product.id, 10);
    const cart = await createCart(user.id, event.id);
    await addLine(cart.id, { productId: product.id, variantId: variant.id, unitPriceCents: 4500 });

    const resolution = await resolveCartForCheckout(user.id);

    expect(resolution.ok).toBe(true);
    if (!resolution.ok) return;
    expect(resolution.eventId).toBe(event.id);
  });

  it("rejects an empty cart", async () => {
    const user = await createUser();
    await createCart(user.id);

    const resolution = await resolveCartForCheckout(user.id);

    expect(resolution.ok).toBe(false);
    if (resolution.ok) return;
    expect(resolution.reason).toBe("cart_empty");
  });
});

describe("checkout — line revalidation", () => {
  it("re-derives the price from the product, ignoring what the cart stored", async () => {
    const user = await createUser();
    const artist = await createArtist();
    const product = await createProduct(artist.id, { basePriceCents: 7000 });
    const variant = await createVariantWithInventory(product.id, 10, { priceDeltaCents: 500 });
    const cart = await createCart(user.id);
    await addLine(cart.id, {
      productId: product.id,
      variantId: variant.id,
      quantity: 2,
      unitPriceCents: 1,
    });

    const resolution = await resolveCartForCheckout(user.id);

    expect(resolution.ok).toBe(true);
    if (!resolution.ok) return;
    expect(resolution.lines[0].unitPriceCents).toBe(7500);
    expect(resolution.subtotalCents).toBe(15000);
  });

  it("rejects a line whose variant no longer belongs to its product", async () => {
    const user = await createUser();
    const artist = await createArtist();
    const product = await createProduct(artist.id);
    const other = await createProduct(artist.id);
    const foreignVariant = await createVariantWithInventory(other.id, 10);
    await createVariantWithInventory(product.id, 10);
    const cart = await createCart(user.id);
    await addLine(cart.id, {
      productId: product.id,
      variantId: foreignVariant.id,
      unitPriceCents: 4500,
    });

    const resolution = await resolveCartForCheckout(user.id);

    expect(resolution.ok).toBe(false);
    if (resolution.ok) return;
    expect(resolution.reason).toBe("variant_not_found");
  });

  it("rejects a line whose product has been deactivated", async () => {
    const user = await createUser();
    const artist = await createArtist();
    const product = await createProduct(artist.id, { active: false });
    const variant = await createVariantWithInventory(product.id, 10);
    const cart = await createCart(user.id);
    await addLine(cart.id, { productId: product.id, variantId: variant.id, unitPriceCents: 4500 });

    const resolution = await resolveCartForCheckout(user.id);

    expect(resolution.ok).toBe(false);
    if (resolution.ok) return;
    expect(resolution.reason).toBe("product_not_found");
  });

  it("blocks checkout when eligibility has not been earned", async () => {
    const user = await createUser();
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const product = await createProduct(artist.id, {
      accessType: "event_specific",
      eventId: event.id,
    });
    const variant = await createVariantWithInventory(product.id, 10);
    const cart = await createCart(user.id);
    await addLine(cart.id, { productId: product.id, variantId: variant.id, unitPriceCents: 4500 });

    const blocked = await resolveCartForCheckout(user.id);
    expect(blocked.ok).toBe(false);
    if (blocked.ok) return;
    expect(blocked.reason).toBe("not_eligible");

    await createVerifiedAttendance(user.id, event.id);

    const allowed = await resolveCartForCheckout(user.id);
    expect(allowed.ok).toBe(true);
  });

  it("blocks checkout once the drop window has closed", async () => {
    const user = await createUser();
    const artist = await createArtist();
    const product = await createProduct(artist.id, { basePriceCents: 5000 });
    const variant = await createVariantWithInventory(product.id, 10);
    const now = demoNow();
    const drop = await createDrop(artist.id, {
      startsAt: new Date(now.getTime() - 2 * 60 * 60_000),
      endsAt: new Date(now.getTime() - 60 * 60_000),
    });
    await addDropProduct(drop.id, product.id, 2500);
    const cart = await createCart(user.id);
    await addLine(cart.id, {
      productId: product.id,
      variantId: variant.id,
      dropId: drop.id,
      unitPriceCents: 2500,
    });

    const resolution = await resolveCartForCheckout(user.id);

    expect(resolution.ok).toBe(false);
    if (resolution.ok) return;
    expect(resolution.reason).toBe("drop_closed");
  });

  it("blocks checkout when stock has been reserved away since the cart was filled", async () => {
    const user = await createUser();
    const artist = await createArtist();
    const product = await createProduct(artist.id);
    const variant = await createVariantWithInventory(product.id, 2);
    const cart = await createCart(user.id);
    await addLine(cart.id, {
      productId: product.id,
      variantId: variant.id,
      quantity: 2,
      unitPriceCents: 4500,
    });

    expect((await resolveCartForCheckout(user.id)).ok).toBe(true);

    await db().update(inventory).set({ reserved: 1 }).where(eq(inventory.variantId, variant.id));

    const resolution = await resolveCartForCheckout(user.id);
    expect(resolution.ok).toBe(false);
    if (resolution.ok) return;
    expect(resolution.reason).toBe("out_of_stock");
  });
});
