import { describe, it, expect, vi, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { drops } from "@/db/schema";
import {
  authContextFor,
  createArtist,
  createEvent,
  createProduct,
  createTour,
  createUser,
  createVariantWithInventory,
  createVerifiedAttendance,
  createVenue,
  db,
  membershipFor,
} from "./helpers";
import { listDropsForEventShop } from "@/server/catalog/queries";
import { loadEventShopCatalog } from "@/server/events/shop";
import { loadLiveCommandCenterSnapshot } from "@/server/studio/live";
import { demoNow } from "@/server/demo/clock";

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

import { createLiveDropAction } from "@/server/studio/drop-actions";
import { addToCartAction, checkoutAction } from "@/server/commerce/actions";
import { resolveCartForCheckout } from "@/server/commerce/resolve";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

beforeEach(() => {
  redirected.url = "";
  getAuthContext.mockReset();
});

describe("studio live drop end-to-end", () => {
  it("launches a drop that appears in the fan event shop and updates live metrics after purchase", async () => {
    const manager = await createUser();
    const fan = await createUser();
    const venue = await createVenue();
    const now = demoNow();

    const artist = await createArtist("Nightfall");
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id, {
      startsAt: new Date(now.getTime() - 60 * 60_000),
      endsAt: new Date(now.getTime() + 60 * 60_000),
    });

    const product = await createProduct(artist.id, {
      name: "Detroit Encore Tee",
      accessType: "event_specific",
      eventId: event.id,
      basePriceCents: 5500,
    });
    await createVariantWithInventory(product.id, 20, { size: "L" });
    await createVerifiedAttendance(fan.id, event.id);

    getAuthContext.mockResolvedValue(
      authContextFor(manager, {
        roles: ["artist_member"],
        memberships: [membershipFor(artist, true)],
      }),
    );

    const preview = await createLiveDropAction(
      {},
      form({
        artistId: artist.id,
        eventId: event.id,
        productId: product.id,
        dropPriceCents: "5500",
        quantityLimit: "500",
        startMode: "now",
        durationMode: "minutes",
        durationMinutes: "45",
        confirm: "false",
      }),
    );

    expect(preview.preview?.productName).toBe("Detroit Encore Tee");
    expect(preview.preview?.eligibleFanCount).toBe(1);

    await expect(
      createLiveDropAction(
        {},
        form({
          artistId: artist.id,
          eventId: event.id,
          productId: product.id,
          dropPriceCents: "5500",
          quantityLimit: "500",
          startMode: "now",
          durationMode: "minutes",
          durationMinutes: "45",
          confirm: "true",
        }),
      ),
    ).rejects.toThrow(`NEXT_REDIRECT:/studio/live/${event.id}`);

    const shopDrops = await listDropsForEventShop({
      eventId: event.id,
      tourId: tour.id,
      artistId: artist.id,
    });
    expect(shopDrops.some((drop) => drop.title === "Detroit Encore Tee")).toBe(true);

    const catalog = await loadEventShopCatalog(
      {
        id: event.id,
        slug: event.slug,
        artistId: artist.id,
        tourId: tour.id,
        venueCity: venue.city,
        venueName: venue.name,
        artistName: artist.name,
        artistSlug: artist.slug,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        timezone: event.timezone,
      } as never,
      fan.id,
    );
    expect(catalog.dropSections.length).toBeGreaterThan(0);

    getAuthContext.mockResolvedValue(authContextFor(fan));
    await addToCartAction(
      {},
      form({
        productId: product.id,
        productSlug: product.slug,
        artistId: artist.id,
        quantity: "1",
        eventId: event.id,
        eventSlug: event.slug,
        dropId: shopDrops[0]!.id,
      }),
    );

    const resolution = await resolveCartForCheckout(fan.id);
    if (!resolution.ok) throw new Error(resolution.message);

    redirected.url = "";
    await expect(
      checkoutAction(
        {},
        form({
          cartId: resolution.cartId,
          shippingName: "Fan",
          shippingLine1: "123 Main",
          shippingCity: "Detroit",
          shippingRegion: "MI",
          shippingPostalCode: "48201",
          shippingCountry: "US",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    getAuthContext.mockResolvedValue(
      authContextFor(manager, {
        roles: ["artist_member"],
        memberships: [membershipFor(artist, true)],
      }),
    );

    const snapshot = await loadLiveCommandCenterSnapshot(
      authContextFor(manager, { memberships: [membershipFor(artist, true)] }),
      artist.id,
      event.id,
    );

    expect(snapshot?.orderCount).toBe(1);
    expect(snapshot?.gmvCents).toBeGreaterThan(0);
    expect(snapshot?.verifiedAttendees).toBe(1);
    expect(snapshot?.activeDrop?.title).toBe("Detroit Encore Tee");
  });

  it("blocks artist A from launching a drop on artist B show", async () => {
    const manager = await createUser();
    const venue = await createVenue();
    const now = demoNow();

    const artistA = await createArtist("Artist A");
    const artistB = await createArtist("Artist B");
    const tourA = await createTour(artistA.id);
    const tourB = await createTour(artistB.id);
    const showA = await createEvent(artistA.id, tourA.id, venue.id, {
      startsAt: new Date(now.getTime() - 60 * 60_000),
      endsAt: new Date(now.getTime() + 60 * 60_000),
    });
    const showB = await createEvent(artistB.id, tourB.id, venue.id, {
      startsAt: new Date(now.getTime() - 60 * 60_000),
      endsAt: new Date(now.getTime() + 60 * 60_000),
    });
    const productB = await createProduct(artistB.id, {
      name: "Foreign Tee",
      accessType: "event_specific",
      eventId: showB.id,
    });

    getAuthContext.mockResolvedValue(
      authContextFor(manager, {
        roles: ["artist_member"],
        memberships: [membershipFor(artistA, true), membershipFor(artistB, true)],
      }),
    );

    const wrongShow = await createLiveDropAction(
      {},
      form({
        artistId: artistA.id,
        eventId: showB.id,
        productId: productB.id,
        dropPriceCents: "5500",
        startMode: "now",
        durationMode: "minutes",
        durationMinutes: "45",
        confirm: "false",
      }),
    );
    expect(wrongShow.error).toBeTruthy();

    const wrongProduct = await createLiveDropAction(
      {},
      form({
        artistId: artistA.id,
        eventId: showA.id,
        productId: productB.id,
        dropPriceCents: "5500",
        startMode: "now",
        durationMode: "minutes",
        durationMinutes: "45",
        confirm: "true",
      }),
    );
    expect(wrongProduct.error).toBeTruthy();

    const artistBDrops = await db().select().from(drops).where(eq(drops.artistId, artistB.id));
    expect(artistBDrops).toHaveLength(0);
  });
});
