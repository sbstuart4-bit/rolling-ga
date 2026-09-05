/**
 * End-to-end demo purchase.
 *
 * Walks the whole fan path against the real domain services — verification, cart,
 * checkout resolution and the dev payment provider — on the June 30 demo show, with the
 * demo clock parked at showtime. Nothing here is stubbed except the session and the
 * Next.js primitives that need a request context.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { eq } from "drizzle-orm";
import { carts, inventory } from "@/db/schema";
import {
  db,
  createUser,
  createArtist,
  createVenue,
  createTour,
  createEvent,
  createEventToken,
  createProduct,
  createVariantWithInventory,
  createShippingOption,
  authContextFor,
} from "./helpers";
import { demoAnchorDate, demoShowDate } from "@/lib/demo-calendar";

const getAuthContext = vi.hoisted(() => vi.fn());
const redirected = vi.hoisted(() => ({ url: "" }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    redirected.url = url;
    throw new Error("NEXT_REDIRECT");
  },
}));
vi.mock("@/server/auth/session", () => ({ getAuthContext }));

import { addToCartAction, checkoutAction } from "@/server/commerce/actions";
import { getCartForDisplay, getOrder, listOrderItems } from "@/server/commerce/queries";
import { resolveCartForCheckout } from "@/server/commerce/resolve";
import { demoNow, resetDemoClock, setDemoClockOffset } from "@/server/demo/clock";
import { verifyAttendance } from "@/server/verification/service";
import { hasVerifiedAttendance } from "@/server/verification/service";

/** Park the demo clock half an hour into the June 30 show. */
function moveClockToShowtime() {
  setDemoClockOffset(demoShowDate().getTime() - demoAnchorDate().getTime() + 30 * 60_000);
}

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

beforeAll(() => moveClockToShowtime());
afterAll(() => resetDemoClock());

describe("demo purchase, end to end", () => {
  it("takes a verified fan from the show to a confirmed order", async () => {
    // ---- The show, on the seeded demo calendar -----------------------------
    const showStart = demoShowDate();
    const artist = await createArtist("The Degens");
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id, {
      startsAt: showStart,
      endsAt: new Date(showStart.getTime() + 2 * 60 * 60_000),
    });
    const token = await createEventToken(event.id);

    expect(demoNow().getTime()).toBeGreaterThan(showStart.getTime());
    expect(demoNow().getTime()).toBeLessThan(event.endsAt.getTime());

    // A show-exclusive piece, locked until attendance is proven.
    const product = await createProduct(artist.id, {
      name: "Detroit Encore Tee",
      accessType: "event_specific",
      eventId: event.id,
      basePriceCents: 5500,
      unitCostCents: 1800,
      images: ["/demo/products/detroit-encore-tee.svg"],
    });
    const variant = await createVariantWithInventory(product.id, 8, { size: "L" });
    const shipping = await createShippingOption(artist.id, {
      baseCustomerChargeCents: 600,
      carrierCostCents: 800,
    });

    const fan = await createUser({ displayName: "Scott Weller" });
    getAuthContext.mockResolvedValue(authContextFor(fan));

    // ---- 1. The piece is locked before verification ------------------------
    const lockedAttempt = await addToCartAction(
      {},
      form({
        productId: product.id,
        productSlug: product.slug,
        artistId: artist.id,
        variantId: variant.id,
        eventId: event.id,
        quantity: "1",
        unitPriceCents: "5500",
      }),
    );
    expect(lockedAttempt.error).toBeTruthy();

    // ---- 2. Verify attendance by scanning the show QR ----------------------
    const verification = await verifyAttendance("event_qr", {
      userId: fan.id,
      eventId: event.id,
      token: token.token,
    });
    expect(verification.ok).toBe(true);
    expect(await hasVerifiedAttendance(fan.id, event.id)).toBe(true);

    // ---- 3. Add the now-unlocked piece, with a tampered price --------------
    const added = await addToCartAction(
      {},
      form({
        productId: product.id,
        productSlug: product.slug,
        artistId: artist.id,
        variantId: variant.id,
        eventId: event.id,
        quantity: "1",
        unitPriceCents: "100",
      }),
    );
    expect(added).toEqual({ ok: true });

    // ---- 4. The cart shows the real product, at the real price -------------
    const cartView = await getCartForDisplay(fan.id);
    expect(cartView).not.toBeNull();
    expect(cartView!.items).toHaveLength(1);
    expect(cartView!.items[0]).toMatchObject({
      productName: "Detroit Encore Tee",
      size: "L",
      imageUrl: "/demo/products/detroit-encore-tee.svg",
      unitPriceCents: 5500,
      sourceEventId: event.id,
    });
    expect(cartView!.eventContext).toMatchObject({
      eventId: event.id,
      artistName: "The Degens",
    });

    const resolution = await resolveCartForCheckout(fan.id);
    expect(resolution.ok).toBe(true);
    if (!resolution.ok) return;
    expect(resolution.artistId).toBe(artist.id);
    expect(resolution.eventId).toBe(event.id);
    expect(resolution.eventContext?.eventSlug).toBe(event.slug);
    expect(resolution.subtotalCents).toBe(5500);

    // ---- 5. Check out with a real shipping option --------------------------
    redirected.url = "";
    await expect(
      checkoutAction(
        {},
        form({
          cartId: resolution.cartId,
          shippingOptionId: shipping.id,
          shippingName: "Scott Weller",
          shippingLine1: "1400 Woodward Ave",
          shippingCity: "Detroit",
          shippingRegion: "MI",
          shippingPostalCode: "48226",
          shippingCountry: "US",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirected.url).toMatch(/^\/order\/ord/);
    const orderId = redirected.url.replace("/order/", "");

    // ---- 6. The order confirmation state -----------------------------------
    const order = await getOrder(orderId, fan.id);
    expect(order).not.toBeNull();
    expect(order!.status).toBe("paid");
    expect(order!.artistId).toBe(artist.id);
    expect(order!.eventId).toBe(event.id);
    expect(order!.commerceSource).toBe("event_scoped");
    expect(order!.artistName).toBe("The Degens");
    expect(order!.subtotalCents).toBe(5500);
    expect(order!.shippingCustomerChargeCents).toBe(600);
    expect(order!.totalCents).toBe(6100);
    expect(order!.shippingMethodLabel).toBe("Standard");
    expect(order!.orderNumber).toMatch(/^RGA-/);

    // Snapshots come from the product, not from a placeholder.
    const items = await listOrderItems(orderId);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      productId: product.id,
      variantId: variant.id,
      nameSnapshot: "Detroit Encore Tee",
      sizeSnapshot: "L",
      imageSnapshot: "/demo/products/detroit-encore-tee.svg",
      quantity: 1,
      unitPriceCents: 5500,
      totalCents: 5500,
      unitCostCents: 1800,
    });

    // ---- 7. Inventory reserved, cart closed --------------------------------
    const [stock] = await db().select().from(inventory).where(eq(inventory.variantId, variant.id));
    expect(stock.onHand).toBe(8);
    expect(stock.reserved).toBe(1);

    const [cart] = await db().select().from(carts).where(eq(carts.id, resolution.cartId));
    expect(cart.status).toBe("converted");
  });
});
