/**
 * Cart price trust and entity matching.
 *
 * The browser can post any product, variant, drop and price it likes. These tests hold
 * the line that none of it is believed: the price is always re-derived, and ids that
 * don't belong together are refused rather than quietly reconciled.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { and, eq } from "drizzle-orm";
import { cartItems, carts } from "@/db/schema";
import {
  db,
  createUser,
  createArtist,
  createVenue,
  createTour,
  createEvent,
  createProduct,
  createVariantWithInventory,
  createDrop,
  addDropProduct,
  authContextFor,
} from "./helpers";

const getAuthContext = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getAuthContext }));

import { addToCartAction } from "@/server/commerce/actions";
import { demoNow } from "@/server/demo/clock";

function form(fields: Record<string, string | undefined>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) data.append(key, value);
  }
  return data;
}

async function cartLinesFor(userId: string) {
  const [cart] = await db()
    .select()
    .from(carts)
    .where(and(eq(carts.userId, userId), eq(carts.status, "active")))
    .limit(1);

  if (!cart) return [];
  return db().select().from(cartItems).where(eq(cartItems.cartId, cart.id));
}

beforeEach(() => {
  getAuthContext.mockReset();
});

describe("add to cart — price trust", () => {
  it("ignores a unit price supplied by the browser", async () => {
    const user = await createUser();
    const artist = await createArtist();
    const product = await createProduct(artist.id, { basePriceCents: 6500 });
    const variant = await createVariantWithInventory(product.id, 5);
    getAuthContext.mockResolvedValue(authContextFor(user));

    const result = await addToCartAction(
      {},
      form({
        productId: product.id,
        productSlug: product.slug,
        artistId: artist.id,
        variantId: variant.id,
        quantity: "1",
        unitPriceCents: "1",
      }),
    );

    expect(result).toEqual({ ok: true });

    const lines = await cartLinesFor(user.id);
    expect(lines).toHaveLength(1);
    expect(lines[0].unitPriceCents).toBe(6500);
  });

  it("adds the variant's price delta to the product's base price", async () => {
    const user = await createUser();
    const artist = await createArtist();
    const product = await createProduct(artist.id, { basePriceCents: 4000 });
    const variant = await createVariantWithInventory(product.id, 5, {
      size: "XXL",
      priceDeltaCents: 300,
    });
    getAuthContext.mockResolvedValue(authContextFor(user));

    await addToCartAction(
      {},
      form({
        productId: product.id,
        productSlug: product.slug,
        artistId: artist.id,
        variantId: variant.id,
        quantity: "1",
        unitPriceCents: "4000",
      }),
    );

    const lines = await cartLinesFor(user.id);
    expect(lines[0].unitPriceCents).toBe(4300);
  });

  it("uses the drop price when the product is part of an open drop", async () => {
    const user = await createUser();
    const artist = await createArtist();
    const product = await createProduct(artist.id, { basePriceCents: 5000 });
    const variant = await createVariantWithInventory(product.id, 5);
    const now = demoNow();
    const drop = await createDrop(artist.id, {
      startsAt: new Date(now.getTime() - 60_000),
      endsAt: new Date(now.getTime() + 60 * 60_000),
    });
    await addDropProduct(drop.id, product.id, 3500);
    getAuthContext.mockResolvedValue(authContextFor(user));

    await addToCartAction(
      {},
      form({
        productId: product.id,
        productSlug: product.slug,
        artistId: artist.id,
        variantId: variant.id,
        dropId: drop.id,
        quantity: "1",
        unitPriceCents: "5000",
      }),
    );

    const lines = await cartLinesFor(user.id);
    expect(lines[0].unitPriceCents).toBe(3500);
  });

  it("refuses a drop price for a product that is not in the drop", async () => {
    const user = await createUser();
    const artist = await createArtist();
    const discounted = await createProduct(artist.id, { basePriceCents: 5000 });
    const other = await createProduct(artist.id, { basePriceCents: 9000 });
    const variant = await createVariantWithInventory(other.id, 5);
    const now = demoNow();
    const drop = await createDrop(artist.id, {
      startsAt: new Date(now.getTime() - 60_000),
      endsAt: new Date(now.getTime() + 60 * 60_000),
    });
    await addDropProduct(drop.id, discounted.id, 1000);
    getAuthContext.mockResolvedValue(authContextFor(user));

    const result = await addToCartAction(
      {},
      form({
        productId: other.id,
        productSlug: other.slug,
        artistId: artist.id,
        variantId: variant.id,
        dropId: drop.id,
        quantity: "1",
        unitPriceCents: "1000",
      }),
    );

    expect(result.error).toBeTruthy();
    expect(await cartLinesFor(user.id)).toHaveLength(0);
  });

  it("refuses a drop whose window has closed", async () => {
    const user = await createUser();
    const artist = await createArtist();
    const product = await createProduct(artist.id, { basePriceCents: 5000 });
    const variant = await createVariantWithInventory(product.id, 5);
    const now = demoNow();
    const drop = await createDrop(artist.id, {
      startsAt: new Date(now.getTime() - 2 * 60 * 60_000),
      endsAt: new Date(now.getTime() - 60 * 60_000),
    });
    await addDropProduct(drop.id, product.id, 1500);
    getAuthContext.mockResolvedValue(authContextFor(user));

    const result = await addToCartAction(
      {},
      form({
        productId: product.id,
        productSlug: product.slug,
        artistId: artist.id,
        variantId: variant.id,
        dropId: drop.id,
        quantity: "1",
        unitPriceCents: "1500",
      }),
    );

    expect(result.error).toBeTruthy();
    expect(await cartLinesFor(user.id)).toHaveLength(0);
  });
});

describe("add to cart — entity matching", () => {
  it("rejects a product belonging to another artist", async () => {
    const user = await createUser();
    const artistA = await createArtist("Artist A");
    const artistB = await createArtist("Artist B");
    const productB = await createProduct(artistB.id);
    const variantB = await createVariantWithInventory(productB.id, 5);
    getAuthContext.mockResolvedValue(authContextFor(user));

    const result = await addToCartAction(
      {},
      form({
        productId: productB.id,
        productSlug: productB.slug,
        artistId: artistA.id,
        variantId: variantB.id,
        quantity: "1",
        unitPriceCents: "4500",
      }),
    );

    expect(result.error).toBeTruthy();
    expect(await cartLinesFor(user.id)).toHaveLength(0);
  });

  it("rejects a product id that does not match the submitted slug", async () => {
    const user = await createUser();
    const artist = await createArtist();
    const product = await createProduct(artist.id);
    const other = await createProduct(artist.id);
    const variant = await createVariantWithInventory(product.id, 5);
    getAuthContext.mockResolvedValue(authContextFor(user));

    const result = await addToCartAction(
      {},
      form({
        productId: product.id,
        productSlug: other.slug,
        artistId: artist.id,
        variantId: variant.id,
        quantity: "1",
        unitPriceCents: "4500",
      }),
    );

    expect(result.error).toBeTruthy();
    expect(await cartLinesFor(user.id)).toHaveLength(0);
  });

  it("rejects a variant belonging to another product", async () => {
    const user = await createUser();
    const artist = await createArtist();
    const product = await createProduct(artist.id, { basePriceCents: 4000 });
    await createVariantWithInventory(product.id, 5);
    const other = await createProduct(artist.id, { basePriceCents: 9000 });
    const otherVariant = await createVariantWithInventory(other.id, 5);
    getAuthContext.mockResolvedValue(authContextFor(user));

    const result = await addToCartAction(
      {},
      form({
        productId: product.id,
        productSlug: product.slug,
        artistId: artist.id,
        variantId: otherVariant.id,
        quantity: "1",
        unitPriceCents: "4000",
      }),
    );

    expect(result.error).toBeTruthy();
    expect(await cartLinesFor(user.id)).toHaveLength(0);
  });

  it("rejects a show that belongs to another artist", async () => {
    const user = await createUser();
    const artistA = await createArtist("Artist A");
    const artistB = await createArtist("Artist B");
    const product = await createProduct(artistA.id);
    const variant = await createVariantWithInventory(product.id, 5);
    const venue = await createVenue();
    const tourB = await createTour(artistB.id);
    const eventB = await createEvent(artistB.id, tourB.id, venue.id);
    getAuthContext.mockResolvedValue(authContextFor(user));

    const result = await addToCartAction(
      {},
      form({
        productId: product.id,
        productSlug: product.slug,
        artistId: artistA.id,
        variantId: variant.id,
        eventId: eventB.id,
        quantity: "1",
        unitPriceCents: "4500",
      }),
    );

    expect(result.error).toBeTruthy();
    expect(await cartLinesFor(user.id)).toHaveLength(0);
  });

  it("rejects an ineligible product even when the browser omits nothing else", async () => {
    const user = await createUser();
    const artist = await createArtist();
    const product = await createProduct(artist.id, { accessType: "verified_attendee" });
    const variant = await createVariantWithInventory(product.id, 5);
    getAuthContext.mockResolvedValue(authContextFor(user));

    const result = await addToCartAction(
      {},
      form({
        productId: product.id,
        productSlug: product.slug,
        artistId: artist.id,
        variantId: variant.id,
        quantity: "1",
        unitPriceCents: "4500",
      }),
    );

    expect(result.error).toBeTruthy();
    expect(await cartLinesFor(user.id)).toHaveLength(0);
  });

  it("resolves the single variant when the form posts no size", async () => {
    const user = await createUser();
    const artist = await createArtist();
    const product = await createProduct(artist.id, { basePriceCents: 2500 });
    const variant = await createVariantWithInventory(product.id, 5, { size: null });
    getAuthContext.mockResolvedValue(authContextFor(user));

    const result = await addToCartAction(
      {},
      form({
        productId: product.id,
        productSlug: product.slug,
        artistId: artist.id,
        quantity: "1",
      }),
    );

    expect(result).toEqual({ ok: true });
    const lines = await cartLinesFor(user.id);
    expect(lines[0].variantId).toBe(variant.id);
    expect(lines[0].unitPriceCents).toBe(2500);
  });
});
