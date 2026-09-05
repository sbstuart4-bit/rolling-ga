import { describe, it, expect } from "vitest";
import {
  listDropsForEventShop,
  listDropProducts,
  isEligibleForProduct,
} from "@/server/catalog/queries";
import { loadEventShopCatalog } from "@/server/events/shop";
import { getEventBySlug } from "@/server/events/queries";
import {
  createArtist,
  createEvent,
  createProduct,
  createTour,
  createUser,
  createVenue,
  createVerifiedAttendance,
  createDrop,
  addDropProduct,
} from "./helpers";

describe("event shop catalog", () => {
  it("lists event-specific and tour-wide drops for a show", async () => {
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);

    const eventDrop = await createDrop(artist.id, { eventId: event.id, status: "live" });
    await createDrop(artist.id, { status: "live" });
    await createDrop(artist.id, { eventId: (await createEvent(artist.id, tour.id, venue.id)).id });

    const results = await listDropsForEventShop({
      eventId: event.id,
      tourId: tour.id,
      artistId: artist.id,
    });

    expect(results.map((d) => d.id)).toContain(eventDrop.id);
    expect(results.every((d) => d.eventId === event.id || d.eventId === null)).toBe(true);
  });

  it("evaluates product eligibility with event context from drop items", async () => {
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);
    const fan = await createUser();

    const product = await createProduct(artist.id, {
      accessType: "event_specific",
      eventId: event.id,
    });
    const drop = await createDrop(artist.id, { eventId: event.id, status: "live" });
    await addDropProduct(drop.id, product.id);

    const [item] = await listDropProducts(drop.id);
    expect(item.eventId).toBe(event.id);

    const locked = await isEligibleForProduct(
      {
        accessType: item.accessType,
        eventId: item.eventId,
        tourId: item.tourId,
        availableFrom: item.availableFrom,
        availableUntil: item.availableUntil,
      },
      { attendedEventIds: [], attendedTourIds: [], attendedArtistIds: [] },
    );
    expect(locked.eligible).toBe(false);

    await createVerifiedAttendance(fan.id, event.id);

    const page = await getEventBySlug(event.slug);
    expect(page).not.toBeNull();

    const catalog = await loadEventShopCatalog(page!, fan.id);
    const section = catalog.dropSections.find((s) => s.drop.id === drop.id);
    expect(section?.products[0]?.eligibility.eligible).toBe(true);
  });
});
