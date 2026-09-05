import { describe, it, expect, vi, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { bundleItems, bundles, inventory, products, productVariants } from "@/db/schema";
import {
  authContextFor,
  createArtist,
  createEvent,
  createProduct,
  createTour,
  createUser,
  createVariantWithInventory,
  createVenue,
  db,
  membershipFor,
} from "./helpers";
import {
  classifyMerchSections,
  resolveAvailabilityChannel,
} from "@/lib/merch-catalog";
import { isEligibleForProduct } from "@/server/catalog/queries";
import {
  computeShowAssortment,
  getProductForStudio,
  listAllProductsForStudio,
  loadShowAssortment,
} from "@/server/studio/merch-queries";
import { AuthorizationError } from "@/server/auth/guards";

const getAuthContext = vi.hoisted(() => vi.fn());
const redirected = vi.hoisted(() => ({ url: "" }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    redirected.url = url;
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));
vi.mock("@/server/auth/session", () => ({ getAuthContext }));

import {
  createBundleAction,
  createCityExclusiveAction,
  createProductAction,
  updateInventoryAction,
} from "@/server/studio/merch-actions";

function form(fields: Record<string, string | string[]>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      for (const entry of value) data.append(key, entry);
    } else {
      data.append(key, value);
    }
  }
  return data;
}

beforeEach(() => {
  redirected.url = "";
  getAuthContext.mockReset();
});

describe("studio merch catalog", () => {
  it("classifies tour core vs endless aisle vs city exclusives", () => {
    const tourCore = {
      id: "1",
      name: "Tour Tee",
      category: "apparel" as const,
      accessType: "public" as const,
      basePriceCents: 4500,
      unitCostCents: 1100,
      isDigital: false,
      active: true,
      tourId: "tor_1",
      eventId: null,
      availableFrom: null,
      availableUntil: null,
    };

    const endless = { ...tourCore, id: "2", name: "Live Album", category: "digital" as const, isDigital: true };
    const exclusive = {
      ...tourCore,
      id: "3",
      name: "Detroit Tee",
      accessType: "event_specific" as const,
      eventId: "evt_1",
    };

    expect(classifyMerchSections(tourCore)).toContain("tour_core");
    expect(classifyMerchSections(endless)).toContain("endless_aisle");
    expect(classifyMerchSections(exclusive)).toContain("city_exclusives");
    expect(resolveAvailabilityChannel(tourCore, true)).toBe("both");
    expect(resolveAvailabilityChannel(endless, false)).toBe("rolling_ga");
  });

  it("enforces tour and event product eligibility for fans", async () => {
    const artist = await createArtist();
    const tour = await createTour(artist.id);
    const venue = await createVenue();
    const event = await createEvent(artist.id, tour.id, venue.id);

    const tourProduct = await createProduct(artist.id, {
      accessType: "tour_specific",
      tourId: tour.id,
    });
    const eventProduct = await createProduct(artist.id, {
      accessType: "event_specific",
      eventId: event.id,
    });

    const tourEligible = await isEligibleForProduct(
      { accessType: "tour_specific", tourId: tour.id, eventId: null, availableFrom: null, availableUntil: null },
      { attendedEventIds: [], attendedTourIds: [tour.id], attendedArtistIds: [artist.id] },
    );
    expect(tourEligible.eligible).toBe(true);

    const eventEligible = await isEligibleForProduct(
      { accessType: "event_specific", eventId: event.id, tourId: null, availableFrom: null, availableUntil: null },
      { attendedEventIds: [event.id], attendedTourIds: [], attendedArtistIds: [] },
    );
    expect(eventEligible.eligible).toBe(true);

    const eventLocked = await isEligibleForProduct(
      { accessType: "event_specific", eventId: event.id, tourId: null, availableFrom: null, availableUntil: null },
      { attendedEventIds: [], attendedTourIds: [], attendedArtistIds: [] },
    );
    expect(eventLocked.eligible).toBe(false);

    expect(tourProduct.tourId).toBe(tour.id);
    expect(eventProduct.eventId).toBe(event.id);
  });

  it("creates a verified-attendee city exclusive scoped to one event", async () => {
    const manager = await createUser();
    const artist = await createArtist("Nightfall");
    const tour = await createTour(artist.id);
    const venue = await createVenue();
    const detroit = await createEvent(artist.id, tour.id, venue.id);

    getAuthContext.mockResolvedValue(
      authContextFor(manager, {
        roles: ["artist_member"],
        memberships: [membershipFor(artist, true)],
      }),
    );

    await expect(
      createCityExclusiveAction(
        {},
        form({
          artistId: artist.id,
          eventId: detroit.id,
          name: "Detroit Encore Tee",
          category: "apparel",
          basePriceCents: "5500",
          sku: "DET-TEE-001",
          sizes: "S, M, L",
          initialStock: "200",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:");

    const rows = await db()
      .select()
      .from(products)
      .where(eq(products.artistId, artist.id));
    const exclusive = rows.find((p) => p.name === "Detroit Encore Tee");
    expect(exclusive?.accessType).toBe("event_specific");
    expect(exclusive?.eventId).toBe(detroit.id);
    expect(exclusive?.tourId).toBe(tour.id);
  });

  it("tracks inventory without fake synchronization", async () => {
    const manager = await createUser();
    const artist = await createArtist();
    const product = await createProduct(artist.id, { name: "Inventory Tee" });
    const variant = await createVariantWithInventory(product.id, 20, { size: "M" });

    getAuthContext.mockResolvedValue(
      authContextFor(manager, {
        roles: ["artist_member"],
        memberships: [membershipFor(artist, true)],
      }),
    );

    const result = await updateInventoryAction(
      {},
      form({
        artistId: artist.id,
        productId: product.id,
        variantId: variant.id,
        onHand: "35",
        reorderPoint: "8",
      }),
    );
    expect(result.ok).toBe(true);

    const [row] = await db()
      .select()
      .from(inventory)
      .where(eq(inventory.variantId, variant.id))
      .limit(1);
    expect(row?.onHand).toBe(35);
    expect(row?.reorderPoint).toBe(8);
  });

  it("creates bundles from artist-owned products only", async () => {
    const manager = await createUser();
    const artist = await createArtist();
    const other = await createArtist("Other");
    const tee = await createProduct(artist.id, { name: "Bundle Tee" });
    const pin = await createProduct(artist.id, { name: "Bundle Pin" });
    const foreign = await createProduct(other.id, { name: "Foreign" });

    getAuthContext.mockResolvedValue(
      authContextFor(manager, {
        roles: ["artist_member"],
        memberships: [membershipFor(artist, true)],
      }),
    );

    await expect(
      createBundleAction(
        {},
        form({
          artistId: artist.id,
          name: "Complete Your Detroit Drop",
          bundlePriceCents: "6500",
          accessType: "event_specific",
          productIds: [tee.id, pin.id],
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:");

    const [bundle] = await db().select().from(bundles).where(eq(bundles.artistId, artist.id));
    expect(bundle?.name).toBe("Complete Your Detroit Drop");

    const items = await db()
      .select()
      .from(bundleItems)
      .where(eq(bundleItems.bundleId, bundle!.id));
    expect(items).toHaveLength(2);

    await expect(
      createBundleAction(
        {},
        form({
          artistId: artist.id,
          name: "Bad bundle",
          bundlePriceCents: "1000",
          accessType: "public",
          productIds: [tee.id, foreign.id],
        }),
      ),
    ).resolves.toMatchObject({ error: expect.any(String) });
  });

  it("blocks cross-artist product access", async () => {
    const managerB = await createUser();
    const artistA = await createArtist("A");
    const artistB = await createArtist("B");
    const productA = await createProduct(artistA.id);

    const ctxB = authContextFor(managerB, {
      roles: ["artist_member"],
      memberships: [membershipFor(artistB, true)],
    });

    getAuthContext.mockResolvedValue(ctxB);

    const detail = await getProductForStudio(ctxB, artistB.id, productA.id);
    expect(detail).toBeNull();

    await expect(
      createProductAction(
        {},
        form({
          artistId: artistA.id,
          name: "Stolen",
          category: "apparel",
          accessType: "public",
          basePriceCents: "1000",
          sku: "STOLEN",
        }),
      ),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("computes show assortment from actual catalog configuration", async () => {
    const manager = await createUser();
    const artist = await createArtist();
    const tour = await createTour(artist.id);
    const venue = await createVenue();
    const event = await createEvent(artist.id, tour.id, venue.id);

    await createProduct(artist.id, { name: "Physical 1", tourId: tour.id, accessType: "public" });
    await createProduct(artist.id, { name: "Physical 2", tourId: tour.id, accessType: "tour_specific" });
    await db().insert(products).values({
      artistId: artist.id,
      slug: `digital-${Date.now()}`,
      name: "Digital EP",
      category: "digital",
      accessType: "public",
      basePriceCents: 999,
      sku: `DIG-${Date.now()}`,
      tourId: tour.id,
      isDigital: true,
      active: true,
    });
    await createProduct(artist.id, {
      name: "Detroit Only",
      eventId: event.id,
      accessType: "event_specific",
    });

    const ctx = authContextFor(manager, {
      roles: ["artist_member"],
      memberships: [membershipFor(artist, true)],
    });

    const all = await listAllProductsForStudio(artist.id);
    const counts = computeShowAssortment(all, event);
    expect(counts.physicalCore).toBeGreaterThanOrEqual(2);
    expect(counts.rollingGaExtended).toBeGreaterThanOrEqual(1);
    expect(counts.cityExclusives).toBe(1);
    expect(counts.totalAvailable).toBeGreaterThanOrEqual(4);

    const assortment = await loadShowAssortment(ctx, artist.id, event.id);
    expect(assortment?.cityExclusives).toHaveLength(1);
  });
});
