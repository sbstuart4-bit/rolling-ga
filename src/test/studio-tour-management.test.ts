import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/font/google", () => {
  const mockFont = () => ({ variable: "--font-mock" });
  return {
    Inter: mockFont,
    Archivo: mockFont,
    Bebas_Neue: mockFont,
    JetBrains_Mono: mockFont,
    Space_Grotesk: mockFont,
    DM_Serif_Display: mockFont,
  };
});
import { and, count, eq } from "drizzle-orm";
import {
  eventThemes,
  events,
  orders,
  products,
  tours,
  venues,
  verifiedAttendance,
} from "@/db/schema";
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
import { resolveEventTheme } from "@/server/theme/resolve";
import { loadTourDashboard, loadEventConfigBundle } from "@/server/studio/tour-queries";
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
  duplicateEventConfigAction,
  resetEventToTourDefaultsAction,
  updateEventOverrideAction,
  updateTourDefaultsAction,
} from "@/server/studio/tour-actions";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

beforeEach(() => {
  redirected.url = "";
  getAuthContext.mockReset();
});

describe("studio tour management", () => {
  it("inherits tour theme tokens until a show override is saved", async () => {
    const manager = await createUser();
    const artist = await createArtist("Nightfall");
    const venue = await createVenue();
    const tour = await createTour(artist.id);

    await db()
      .update(tours)
      .set({
        accent: "#ff00aa",
        showMessaging: "Welcome to the Nightfall World Tour",
        artworkUrl: "https://cdn.example/tour-art.jpg",
      })
      .where(eq(tours.id, tour.id));

    const detroit = await createEvent(artist.id, tour.id, venue.id);

    const inherited = await resolveEventTheme(detroit.id);
    expect(inherited.accent).toBe("#ff00aa");
    expect(inherited.showMessaging).toBe("Welcome to the Nightfall World Tour");
    expect(inherited.provenance.accent).toBe("tour");

    getAuthContext.mockResolvedValue(
      authContextFor(manager, {
        roles: ["artist_member"],
        memberships: [membershipFor(artist, true)],
      }),
    );

    await updateEventOverrideAction(
      {},
      form({
        tourId: tour.id,
        eventId: detroit.id,
        artistId: artist.id,
        cityArtworkUrl: "https://cdn.example/detroit-hero.jpg",
        localMessage: "Detroit, we've been waiting.",
      }),
    );

    const overridden = await resolveEventTheme(detroit.id);
    expect(overridden.cityArtworkUrl).toBe("https://cdn.example/detroit-hero.jpg");
    expect(overridden.localMessage).toBe("Detroit, we've been waiting.");
    expect(overridden.accent).toBe("#ff00aa");
    expect(overridden.provenance.accent).toBe("tour");
  });

  it("resets a show back to tour defaults", async () => {
    const manager = await createUser();
    const artist = await createArtist("Nightfall");
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id, {
      postShowWindowMinutes: 120,
    });

    await db().update(events).set({ localMessage: "Local only" }).where(eq(events.id, event.id));

    await db().insert(eventThemes).values({
      eventId: event.id,
      cityArtworkUrl: "https://cdn.example/override.jpg",
      accent: "#000000",
    });

    getAuthContext.mockResolvedValue(
      authContextFor(manager, {
        roles: ["artist_member"],
        memberships: [membershipFor(artist, true)],
      }),
    );

    await resetEventToTourDefaultsAction(
      form({
        tourId: tour.id,
        eventId: event.id,
        artistId: artist.id,
      }),
    );

    const [row] = await db().select().from(events).where(eq(events.id, event.id)).limit(1);
    expect(row?.localMessage).toBeNull();
    expect(row?.postShowWindowMinutes).toBeNull();

    const themeRows = await db()
      .select()
      .from(eventThemes)
      .where(eq(eventThemes.eventId, event.id));
    expect(themeRows).toHaveLength(0);

    const resolved = await resolveEventTheme(event.id);
    expect(resolved.cityArtworkUrl).toBeNull();
  });

  it("blocks cross-artist tour access", async () => {
    const managerB = await createUser();
    const artistA = await createArtist("Artist A");
    const artistB = await createArtist("Artist B");
    const tourA = await createTour(artistA.id);

    getAuthContext.mockResolvedValue(
      authContextFor(managerB, {
        roles: ["artist_member"],
        memberships: [membershipFor(artistB, true)],
      }),
    );

    const ctx = authContextFor(managerB, {
      roles: ["artist_member"],
      memberships: [membershipFor(artistB, true)],
    });

    const dashboard = await loadTourDashboard(ctx, artistB.id, tourA.id);
    expect(dashboard).toBeNull();

    await expect(
      updateTourDefaultsAction(
        {},
        form({
          tourId: tourA.id,
          artistId: artistA.id,
          name: "Stolen tour",
          postShowWindowMinutes: "480",
          shippingStrategy: "fan_pays_full",
        }),
      ),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("duplicates configuration without copying transactional records", async () => {
    const manager = await createUser();
    const fan = await createUser();
    const venueDetroit = await createVenue();
    const venueToronto = await createVenue();
    await db()
      .update(venues)
      .set({ city: "Toronto", name: "Scotiabank Arena" })
      .where(eq(venues.id, venueToronto.id));

    const artist = await createArtist("Nightfall");
    const tour = await createTour(artist.id);
    const detroit = await createEvent(artist.id, tour.id, venueDetroit.id, {
      postShowWindowMinutes: 90,
    });
    const toronto = await createEvent(artist.id, tour.id, venueToronto.id);

    await db()
      .update(events)
      .set({ localMessage: "Detroit exclusive night" })
      .where(eq(events.id, detroit.id));
    await db().insert(eventThemes).values({
      eventId: detroit.id,
      cityArtworkUrl: "https://cdn.example/detroit.jpg",
      accent: "#aabbcc",
    });

    const product = await createProduct(artist.id, {
      eventId: detroit.id,
      name: "Detroit Tee",
    });
    await createVariantWithInventory(product.id, 5);
    await createVerifiedAttendance(fan.id, detroit.id);

    const [ordersBefore] = await db().select({ total: count() }).from(orders);
    const [attendanceBefore] = await db()
      .select({ total: count() })
      .from(verifiedAttendance)
      .where(eq(verifiedAttendance.eventId, toronto.id));

    getAuthContext.mockResolvedValue(
      authContextFor(manager, {
        roles: ["artist_member"],
        memberships: [membershipFor(artist, true)],
      }),
    );

    const result = await duplicateEventConfigAction(
      {},
      form({
        artistId: artist.id,
        tourId: tour.id,
        sourceEventId: detroit.id,
        targetEventId: toronto.id,
      }),
    );
    expect(result.ok).toBe(true);

    const [torontoEvent] = await db()
      .select()
      .from(events)
      .where(eq(events.id, toronto.id))
      .limit(1);
    expect(torontoEvent?.localMessage).toBe("Detroit exclusive night");
    expect(torontoEvent?.postShowWindowMinutes).toBe(90);

    const [torontoTheme] = await db()
      .select()
      .from(eventThemes)
      .where(eq(eventThemes.eventId, toronto.id))
      .limit(1);
    expect(torontoTheme?.cityArtworkUrl).toBe("https://cdn.example/detroit.jpg");

    const torontoProducts = await db()
      .select({ total: count() })
      .from(products)
      .where(and(eq(products.eventId, toronto.id), eq(products.active, true)));
    expect(Number(torontoProducts[0]?.total ?? 0)).toBe(0);

    const [attendanceAfter] = await db()
      .select({ total: count() })
      .from(verifiedAttendance)
      .where(eq(verifiedAttendance.eventId, toronto.id));
    expect(Number(attendanceAfter?.total ?? 0)).toBe(Number(attendanceBefore?.total ?? 0));

    const [ordersAfter] = await db().select({ total: count() }).from(orders);
    expect(Number(ordersAfter?.total ?? 0)).toBe(Number(ordersBefore?.total ?? 0));

    const fanTheme = await resolveEventTheme(toronto.id);
    expect(fanTheme.cityArtworkUrl).toBe("https://cdn.example/detroit.jpg");
    expect(fanTheme.localMessage).toBe("Detroit exclusive night");
  });

  it("loads tour dashboard readiness for authorized artist members", async () => {
    const manager = await createUser();
    const artist = await createArtist("Nightfall");
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);

    await db().insert(eventThemes).values({
      eventId: event.id,
      heroImageUrl: "https://cdn.example/hero.jpg",
    });

    const product = await createProduct(artist.id, { eventId: event.id });
    await createVariantWithInventory(product.id, 3);

    const ctx = authContextFor(manager, {
      roles: ["artist_member"],
      memberships: [membershipFor(artist, true)],
    });

    const dashboard = await loadTourDashboard(ctx, artist.id, tour.id);
    expect(dashboard?.tour.id).toBe(tour.id);
    expect(dashboard?.events).toHaveLength(1);
    expect(dashboard?.readiness[0]?.takeoverConfigured).toBe(true);
    expect(dashboard?.readiness[0]?.merchConfigured).toBe(true);

    const bundle = await loadEventConfigBundle(ctx, artist.id, event.id);
    expect(bundle?.resolvedTheme.heroImageUrl).toBe("https://cdn.example/hero.jpg");
  });
});
