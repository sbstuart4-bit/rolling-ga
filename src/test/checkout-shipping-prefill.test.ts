import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  authContextFor,
  createArtist,
  createProduct,
  createShippingOption,
  createUser,
  createVariantWithInventory,
  db,
  getFanShippingAddress,
  setFanShippingAddress,
} from "./helpers";
import {
  getSavedShippingAddress,
  saveShippingAddressForUser,
} from "@/server/fans/preferences";
import {
  hasSavedShippingAddress,
  mergeSavedShippingAddress,
} from "@/lib/shipping-address";
import { fanPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";

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

async function checkoutWithAddress(
  userId: string,
  shippingOptionId: string,
  address: Record<string, string>,
  saveForFuture?: boolean,
) {
  const resolution = await resolveCartForCheckout(userId);
  if (!resolution.ok) throw new Error(resolution.message);

  const fields: Record<string, string> = {
    cartId: resolution.cartId,
    shippingOptionId,
    ...address,
  };
  if (saveForFuture) fields.saveShippingForFuture = "true";

  redirected.url = "";
  await expect(checkoutAction({}, form(fields))).rejects.toThrow("NEXT_REDIRECT");
  return redirected.url.replace("/order/", "");
}

async function seedCheckoutFan() {
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

  return { fan, shipping };
}

describe("shipping address helpers", () => {
  it("merges partial saved addresses without inventing missing fields", () => {
    const merged = mergeSavedShippingAddress({
      shippingLine1: "123 Main St",
      shippingCity: "Detroit",
    });

    expect(merged.shippingLine1).toBe("123 Main St");
    expect(merged.shippingCity).toBe("Detroit");
    expect(merged.shippingName).toBe("");
    expect(merged.shippingCountry).toBe("US");
    expect(hasSavedShippingAddress({ shippingCity: "Detroit" })).toBe(true);
    expect(hasSavedShippingAddress(null)).toBe(false);
  });
});

describe("checkout shipping pre-fill", () => {
  beforeEach(() => {
    redirected.url = "";
  });

  it("returns saved address for a returning fan", async () => {
    const fan = await createUser();
    await setFanShippingAddress(fan.id, {
      shippingName: "Jordan Lee",
      shippingLine1: "88 Woodward Ave",
      shippingCity: "Detroit",
      shippingRegion: "MI",
      shippingPostalCode: "48226",
      shippingCountry: "US",
    });

    const saved = await getSavedShippingAddress(fan.id);
    expect(saved?.shippingName).toBe("Jordan Lee");
    expect(saved?.shippingLine1).toBe("88 Woodward Ave");
  });

  it("returns null when the fan has no saved address", async () => {
    const fan = await createUser();
    expect(await getSavedShippingAddress(fan.id)).toBeNull();
  });

  it("does not expose one fan's address to another fan", async () => {
    const fanA = await createUser();
    const fanB = await createUser();
    await setFanShippingAddress(fanA.id, {
      shippingName: "Fan A",
      shippingLine1: "1 Private Lane",
      shippingCity: "Detroit",
      shippingRegion: "MI",
      shippingPostalCode: "48201",
      shippingCountry: "US",
    });

    expect(await getSavedShippingAddress(fanB.id)).toBeNull();
    expect((await getSavedShippingAddress(fanA.id))?.shippingLine1).toBe("1 Private Lane");
  });

  it("uses edited checkout address on the order without updating preferences when save is disabled", async () => {
    const { fan, shipping } = await seedCheckoutFan();
    await setFanShippingAddress(fan.id, {
      shippingName: "Saved Name",
      shippingLine1: "123 Main St",
      shippingCity: "Detroit",
      shippingRegion: "MI",
      shippingPostalCode: "48201",
      shippingCountry: "US",
    });

    const orderId = await checkoutWithAddress(fan.id, shipping.id, {
      shippingName: "Edited Name",
      shippingLine1: "456 Oak Ave",
      shippingCity: "Ann Arbor",
      shippingRegion: "MI",
      shippingPostalCode: "48104",
      shippingCountry: "US",
    });

    const order = await getOrder(orderId, fan.id);
    const prefs = await getFanShippingAddress(fan.id);

    expect(order!.shippingLine1).toBe("456 Oak Ave");
    expect(order!.shippingName).toBe("Edited Name");
    expect(prefs!.shippingLine1).toBe("123 Main St");
    expect(prefs!.shippingName).toBe("Saved Name");
  });

  it("updates fan_preferences after successful checkout when save-for-future is enabled", async () => {
    const { fan, shipping } = await seedCheckoutFan();

    const orderId = await checkoutWithAddress(
      fan.id,
      shipping.id,
      {
        shippingName: "New Fan",
        shippingLine1: "900 Jefferson Ave",
        shippingCity: "Detroit",
        shippingRegion: "MI",
        shippingPostalCode: "48226",
        shippingCountry: "US",
      },
      true,
    );

    const order = await getOrder(orderId, fan.id);
    const prefs = await getFanShippingAddress(fan.id);

    expect(order!.shippingLine1).toBe("900 Jefferson Ave");
    expect(prefs!.shippingLine1).toBe("900 Jefferson Ave");
    expect(prefs!.shippingName).toBe("New Fan");
  });

  it("overwrites saved preferences only when save-for-future is checked", async () => {
    const { fan, shipping } = await seedCheckoutFan();
    await setFanShippingAddress(fan.id, {
      shippingName: "Old Name",
      shippingLine1: "Old Street",
      shippingCity: "Detroit",
      shippingRegion: "MI",
      shippingPostalCode: "48201",
      shippingCountry: "US",
    });

    await checkoutWithAddress(
      fan.id,
      shipping.id,
      {
        shippingName: "Updated Name",
        shippingLine1: "New Street",
        shippingCity: "Detroit",
        shippingRegion: "MI",
        shippingPostalCode: "48202",
        shippingCountry: "US",
      },
      true,
    );

    const prefs = await getFanShippingAddress(fan.id);
    expect(prefs!.shippingLine1).toBe("New Street");
    expect(prefs!.shippingName).toBe("Updated Name");
  });

  it("does not persist preferences when checkout fails before order creation", async () => {
    const fan = await createUser();
    getAuthContext.mockResolvedValue(authContextFor(fan));

    const result = await checkoutAction(
      {},
      form({
        cartId: "cart_missing",
        shippingName: "Ghost",
        shippingLine1: "Nowhere",
        shippingCity: "Detroit",
        shippingRegion: "MI",
        shippingPostalCode: "48201",
        shippingCountry: "US",
        saveShippingForFuture: "true",
      }),
    );

    expect(result.error).toBeTruthy();
    expect(await getSavedShippingAddress(fan.id)).toBeNull();
  });

  it("saveShippingAddressForUser upserts when preferences row was missing", async () => {
    const fan = await createUser();
    await saveShippingAddressForUser(fan.id, {
      shippingName: "Upsert Fan",
      shippingLine1: "100 State St",
      shippingLine2: "",
      shippingCity: "Chicago",
      shippingRegion: "IL",
      shippingPostalCode: "60601",
      shippingCountry: "US",
    });

    const [row] = await db()
      .select({ shippingCity: fanPreferences.shippingCity })
      .from(fanPreferences)
      .where(eq(fanPreferences.userId, fan.id));

    expect(row?.shippingCity).toBe("Chicago");
  });
});

describe("artist studio privacy", () => {
  it("does not read fan_preferences in the studio fans CRM page", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/(studio)/studio/fans/page.tsx"),
      "utf8",
    );

    expect(source).not.toMatch(/fanPreferences|fan_preferences/);
    expect(source).not.toMatch(/shippingLine1|shipping_name/);
  });
});
