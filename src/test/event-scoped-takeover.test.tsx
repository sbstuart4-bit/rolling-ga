import { describe, it, expect, vi } from "vitest";

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

import { renderToStaticMarkup } from "react-dom/server";
import {
  EventScopedTakeover,
  EventShopBackLink,
} from "@/components/fan/event-scoped-takeover";
import type { EventPageContext } from "@/server/events/context";
import {
  eventShopBackHref,
  resolveCartEventId,
  resolveEventTakeoverContext,
} from "@/server/events/takeover";
import {
  createArtist,
  createEvent,
  createTour,
  createUser,
  createVenue,
} from "./helpers";

const mockEventPage = {
  event: {
    id: "evt_test",
    slug: "detroit-tonight",
    title: "Detroit",
    doorsAt: new Date(),
    startsAt: new Date(),
    endsAt: new Date(),
    timezone: "America/Detroit",
    expectedAttendance: null,
    actualAttendance: null,
    localMessage: null,
    postShowWindowMinutes: null,
    verificationOpensAt: null,
    verificationClosesAt: null,
    cancelled: false,
    artistId: "art_test",
    artistName: "The Degens",
    artistSlug: "the-degens",
    tourId: "tor_test",
    tourName: "Signal Decay",
    tourSlug: "signal-decay",
    tourWindowMinutes: 480,
    venueId: "ven_test",
    venueName: "The Fillmore",
    venueCity: "Detroit",
    venueRegion: "MI",
    venueCountry: "US",
    venueCapacity: null,
  },
  timing: {
    state: "live" as const,
    postShowClosesAt: null,
    msUntilStart: 0,
    msUntilPostShowClose: null,
  },
  theme: {
    background: "#0a0a0a",
    foreground: "#f5f5f5",
    accent: "#7c3aed",
  },
  fanExperience: {
    access: "live_unlocked" as const,
    credential: "none" as const,
    purchase: "none" as const,
    experience: null,
  },
  verification: {
    opensAt: new Date(),
    closesAt: new Date(),
    open: true,
  },
} as EventPageContext;

describe("event-scoped takeover", () => {
  it("resolveEventTakeoverContext returns null for missing slug", async () => {
    const fan = await createUser();
    const result = await resolveEventTakeoverContext(undefined, fan.id);
    expect(result).toBeNull();
  });

  it("resolveEventTakeoverContext returns null for invalid slug", async () => {
    const fan = await createUser();
    const result = await resolveEventTakeoverContext("not-a-real-show", fan.id);
    expect(result).toBeNull();
  });

  it("resolveEventTakeoverContext loads theme for a valid event slug", async () => {
    const fan = await createUser();
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id);

    const result = await resolveEventTakeoverContext(event.slug, fan.id);
    expect(result).not.toBeNull();
    expect(result?.event.id).toBe(event.id);
    expect(result?.theme).toBeDefined();
  });

  it("EventScopedTakeover wraps content in artist CSS variables when scoped", () => {
    const html = renderToStaticMarkup(
      <EventScopedTakeover eventPage={mockEventPage}>
        <p>Drop detail</p>
      </EventScopedTakeover>,
    );

    expect(html).toContain("--artist-bg");
    expect(html).toContain("Drop detail");
  });

  it("EventScopedTakeover passes through unchanged when context is absent", () => {
    const html = renderToStaticMarkup(
      <EventScopedTakeover eventPage={null}>
        <p>Generic drop</p>
      </EventScopedTakeover>,
    );

    expect(html).not.toContain("--artist-bg");
    expect(html).toContain("Generic drop");
  });

  it("EventShopBackLink points to the event shop", () => {
    const html = renderToStaticMarkup(<EventShopBackLink eventSlug="detroit-tonight" />);

    expect(html).toContain('href="/event/detroit-tonight/shop"');
    expect(html).toContain("Back to show shop");
    expect(eventShopBackHref("detroit-tonight")).toBe("/event/detroit-tonight/shop");
  });

  it("resolveCartEventId prefers the show context over product fallback", () => {
    expect(resolveCartEventId(mockEventPage, "evt_product_only")).toBe("evt_test");
    expect(resolveCartEventId(null, "evt_product_only")).toBe("evt_product_only");
    expect(resolveCartEventId(null, null)).toBeUndefined();
  });
});
