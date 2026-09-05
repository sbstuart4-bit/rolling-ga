import { describe, it, expect, vi } from "vitest";
import { eq } from "drizzle-orm";
import { productVariants } from "@/db/schema";
import {
  initialVariantSelection,
  resolvePreferredVariant,
} from "@/lib/apparel-size";
import {
  authContextFor,
  createArtist,
  createProduct,
  createUser,
  createVariantWithInventory,
  db,
  getFanApparelSize,
  setFanApparelSize,
} from "./helpers";
import { getSavedApparelSize, saveApparelSizeForUser } from "@/server/fans/preferences";
import { updateApparelSizeAction } from "@/server/fans/actions";

const getAuthContext = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getAuthContext }));

import { addToCartAction } from "@/server/commerce/actions";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

const sizedVariants = [
  { id: "var_s", size: "S", available: 3 },
  { id: "var_m", size: "M", available: 5 },
  { id: "var_l", size: "L", available: 0 },
  { id: "var_xl", size: "XL", available: 2 },
];

describe("apparel size resolution", () => {
  it("preselects a saved size when it is available", () => {
    const resolution = resolvePreferredVariant(sizedVariants, "M");
    expect(resolution).toEqual({ kind: "matched", variantId: "var_m", size: "M" });

    const initial = initialVariantSelection(sizedVariants, "M");
    expect(initial.variantId).toBe("var_m");
  });

  it("flags an unavailable saved size and picks another variant", () => {
    const resolution = resolvePreferredVariant(sizedVariants, "L");
    expect(resolution).toEqual({ kind: "unavailable", savedSize: "L" });

    const initial = initialVariantSelection(sizedVariants, "L");
    expect(initial.variantId).toBe("var_s");
    expect(initial.resolution.kind).toBe("unavailable");
  });

  it("handles fans without a saved size", () => {
    expect(resolvePreferredVariant(sizedVariants, null)).toEqual({ kind: "none" });
    expect(initialVariantSelection(sizedVariants, null).variantId).toBe("var_s");
  });
});

describe("saved apparel size preferences", () => {
  it("loads saved size for returning fans", async () => {
    const fan = await createUser();
    await setFanApparelSize(fan.id, "M");
    expect(await getSavedApparelSize(fan.id)).toBe("M");
  });

  it("does not expose one fan's size to another fan", async () => {
    const fanA = await createUser();
    const fanB = await createUser();
    await setFanApparelSize(fanA.id, "L");

    expect(await getSavedApparelSize(fanB.id)).toBeNull();
    expect(await getSavedApparelSize(fanA.id)).toBe("L");
  });

  it("updates preferred size explicitly from profile", async () => {
    const fan = await createUser();
    getAuthContext.mockResolvedValue(authContextFor(fan));

    const result = await updateApparelSizeAction({}, form({ apparelSize: "XL" }));
    expect(result.ok).toBe(true);
    expect(await getFanApparelSize(fan.id)).toBe("XL");
  });

  it("persists preferred size only when explicitly requested on add to cart", async () => {
    const artist = await createArtist();
    const product = await createProduct(artist.id, { basePriceCents: 4000 });
    await createVariantWithInventory(product.id, 5, { size: "M" });
    await createVariantWithInventory(product.id, 5, { size: "L" });
    const fan = await createUser();
    await setFanApparelSize(fan.id, "M");
    getAuthContext.mockResolvedValue(authContextFor(fan));
    const allVariants = await db()
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, product.id));
    const large = allVariants.find((row) => row.size === "L");
    expect(large).toBeTruthy();

    await addToCartAction(
      {},
      form({
        productId: product.id,
        productSlug: product.slug,
        artistId: artist.id,
        variantId: large!.id,
        quantity: "1",
      }),
    );

    expect(await getFanApparelSize(fan.id)).toBe("M");
  });

  it("saves a new preferred size when the fan opts in on add to cart", async () => {
    const artist = await createArtist();
    const product = await createProduct(artist.id, { basePriceCents: 4000 });
    await createVariantWithInventory(product.id, 5, { size: "M" });
    await createVariantWithInventory(product.id, 5, { size: "L" });

    const fan = await createUser();
    getAuthContext.mockResolvedValue(authContextFor(fan));

    const allVariants = await db()
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, product.id));
    const large = allVariants.find((row) => row.size === "L");
    expect(large).toBeTruthy();

    await addToCartAction(
      {},
      form({
        productId: product.id,
        productSlug: product.slug,
        artistId: artist.id,
        variantId: large!.id,
        quantity: "1",
        saveApparelSize: "true",
        preferredApparelSize: "L",
      }),
    );

    expect(await getFanApparelSize(fan.id)).toBe("L");
  });

  it("upserts apparel size when preferences row was missing", async () => {
    const fan = await createUser();
    await saveApparelSizeForUser(fan.id, "S");
    expect(await getFanApparelSize(fan.id)).toBe("S");
  });
});
