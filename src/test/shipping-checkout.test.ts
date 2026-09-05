import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createArtist,
  createProduct,
  createUser,
  createVariantWithInventory,
  createShippingOption,
  authContextFor,
} from "./helpers";
import { resolveShippingQuote } from "@/lib/shipping";

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
import { getOrder } from "@/server/commerce/queries";
import { resolveCartForCheckout } from "@/server/commerce/resolve";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

async function checkoutCart(userId: string, shippingOptionId: string) {
  const resolution = await resolveCartForCheckout(userId);
  if (!resolution.ok) throw new Error(resolution.message);

  redirected.url = "";
  await expect(
    checkoutAction(
      {},
      form({
        cartId: resolution.cartId,
        shippingOptionId,
        shippingName: "Test Fan",
        shippingLine1: "123 Main St",
        shippingCity: "Detroit",
        shippingRegion: "MI",
        shippingPostalCode: "48201",
        shippingCountry: "US",
      }),
    ),
  ).rejects.toThrow("NEXT_REDIRECT");

  return redirected.url.replace("/order/", "");
}

describe("checkout shipping persistence", () => {
  beforeEach(() => {
    redirected.url = "";
  });

  it("persists full-pay shipping on the order", async () => {
    const artist = await createArtist();
    const product = await createProduct(artist.id, { basePriceCents: 4000 });
    await createVariantWithInventory(product.id, 5);
    const shipping = await createShippingOption(artist.id, {
      name: "Standard",
      strategy: "fan_pays_full",
      carrierCostCents: 900,
      baseCustomerChargeCents: 900,
    });

    const fan = await createUser();
    getAuthContext.mockResolvedValue(authContextFor(fan));

    await addToCartAction(
      {},
      form({
        productId: product.id,
        productSlug: product.slug,
        artistId: artist.id,
        quantity: "1",
      }),
    );

    const orderId = await checkoutCart(fan.id, shipping.id);
    const order = await getOrder(orderId, fan.id);

    expect(order!.shippingCustomerChargeCents).toBe(900);
    expect(order!.shippingCarrierCostCents).toBe(900);
    expect(order!.shippingArtistSubsidyCents).toBe(0);
    expect(order!.totalCents).toBe(4900);
    expect(order!.shippingOptionId).toBe(shipping.id);
  });

  it("persists partial artist subsidy on the order", async () => {
    const artist = await createArtist();
    const product = await createProduct(artist.id, { basePriceCents: 4000 });
    await createVariantWithInventory(product.id, 5);
    const shipping = await createShippingOption(artist.id, {
      name: "Next-day delivery",
      speed: "next_day",
      strategy: "artist_subsidized",
      carrierCostCents: 1200,
      baseCustomerChargeCents: 1200,
      subsidyCents: 701,
      deliveryMinDays: 1,
      deliveryMaxDays: 1,
    });

    const fan = await createUser();
    getAuthContext.mockResolvedValue(authContextFor(fan));

    await addToCartAction(
      {},
      form({
        productId: product.id,
        productSlug: product.slug,
        artistId: artist.id,
        quantity: "1",
      }),
    );

    const quote = resolveShippingQuote(shipping, 4000);
    expect(quote.customerChargeCents).toBe(499);
    expect(quote.artistSubsidyCents).toBe(701);

    const orderId = await checkoutCart(fan.id, shipping.id);
    const order = await getOrder(orderId, fan.id);

    expect(order!.shippingCustomerChargeCents).toBe(499);
    expect(order!.shippingArtistSubsidyCents).toBe(701);
    expect(order!.shippingCarrierCostCents).toBe(1200);
    expect(order!.totalCents).toBe(4499);
  });

  it("persists free shipping when the threshold is met", async () => {
    const artist = await createArtist();
    const product = await createProduct(artist.id, { basePriceCents: 8000 });
    await createVariantWithInventory(product.id, 5);
    const shipping = await createShippingOption(artist.id, {
      name: "Standard",
      strategy: "free_above_threshold",
      carrierCostCents: 1100,
      baseCustomerChargeCents: 990,
      freeThresholdCents: 7500,
    });

    const fan = await createUser();
    getAuthContext.mockResolvedValue(authContextFor(fan));

    await addToCartAction(
      {},
      form({
        productId: product.id,
        productSlug: product.slug,
        artistId: artist.id,
        quantity: "1",
      }),
    );

    const orderId = await checkoutCart(fan.id, shipping.id);
    const order = await getOrder(orderId, fan.id);

    expect(order!.shippingCustomerChargeCents).toBe(0);
    expect(order!.shippingArtistSubsidyCents).toBe(1100);
    expect(order!.shippingCarrierCostCents).toBe(1100);
    expect(order!.totalCents).toBe(8000);
  });
});
