import { describe, expect, it } from "vitest";
import { getDropBySlugOnly, getProductBySlugOnly } from "@/server/catalog/queries";
import { createArtist, createDrop, createProduct } from "./helpers";

describe("slug-only catalog lookups", () => {
  it("resolves a unique product without artist id", async () => {
    const artist = await createArtist();
    const product = await createProduct(artist.id, { slug: "unique-product-slug" });
    const resolved = await getProductBySlugOnly("unique-product-slug");
    expect(resolved?.id).toBe(product.id);
    expect(resolved?.artistId).toBe(artist.id);
  });

  it("returns null for ambiguous product slugs", async () => {
    const a = await createArtist();
    const b = await createArtist();
    await createProduct(a.id, { slug: "shared-product-slug" });
    await createProduct(b.id, { slug: "shared-product-slug" });
    expect(await getProductBySlugOnly("shared-product-slug")).toBeNull();
  });

  it("resolves a unique drop without artist id", async () => {
    const artist = await createArtist();
    const drop = await createDrop(artist.id, { slug: "unique-drop-slug", status: "live" });
    const resolved = await getDropBySlugOnly("unique-drop-slug");
    expect(resolved?.id).toBe(drop.id);
    expect(resolved?.artistId).toBe(artist.id);
  });
});
