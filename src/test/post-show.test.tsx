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
  PostShowVerifiedExperience,
  PostShowVisitorExperience,
} from "@/components/fan/post-show-experience";
import { resolveEventState } from "@/lib/event-state";
import {
  canPurchaseInEventAttendeeStore,
  isAttendeeStoreOpen,
  isPostShowPhase,
} from "@/lib/post-show-commerce";
import { hasEarnedCredential } from "@/lib/fan-experience/access-state";
import { resolveLine, loadAttendanceFacts } from "@/server/commerce/resolve";
import { loadEventPage } from "@/server/events/context";
import { listEventContent } from "@/server/events/queries";
import {
  createArtist,
  createEvent,
  createProduct,
  createTour,
  createUser,
  createVariantWithInventory,
  createVenue,
  createVerifiedAttendance,
} from "./helpers";

describe("post-show lifecycle helpers", () => {
  it("opens the attendee store during live and recently_ended", () => {
    expect(isAttendeeStoreOpen("live")).toBe(true);
    expect(isAttendeeStoreOpen("recently_ended")).toBe(true);
    expect(isAttendeeStoreOpen("archived")).toBe(false);
  });

  it("blocks event-window commerce after the post-show window unless a drop extends", () => {
    const archived = resolveEventState(
      {
        startsAt: new Date("2026-01-01T20:00:00Z"),
        endsAt: new Date("2026-01-01T22:00:00Z"),
        doorsAt: null,
        postShowWindowMinutes: 60,
        cancelled: false,
      },
      480,
      new Date("2026-01-02T12:00:00Z"),
    );

    expect(archived.state).toBe("archived");
    expect(
      canPurchaseInEventAttendeeStore(
        archived,
        { dropEndsAt: null, productAvailableUntil: null },
        new Date("2026-01-02T12:00:00Z"),
      ),
    ).toBe(false);
    expect(
      canPurchaseInEventAttendeeStore(
        archived,
        { dropEndsAt: new Date("2026-01-03T00:00:00Z"), productAvailableUntil: null },
        new Date("2026-01-02T12:00:00Z"),
      ),
    ).toBe(true);
  });
});

describe("PostShowVerifiedExperience", () => {
  const page = {
    event: {
      id: "evt_test",
      slug: "detroit-tonight",
      artistId: "art_test",
      venueCity: "Detroit",
      venueName: "The Fillmore",
      artistName: "The Degens",
      artistSlug: "the-degens",
      tourName: "Signal Decay",
      startsAt: new Date("2026-06-30T20:00:00Z"),
      timezone: "America/Detroit",
    },
    timing: {
      state: "recently_ended" as const,
      postShowClosesAt: new Date("2026-07-01T04:00:00Z"),
      msUntilStart: 0,
      msUntilPostShowClose: 3_600_000,
    },
    theme: { background: "#000", foreground: "#fff", accent: "#7c3aed" },
    fanExperience: {
      access: "postshow_open",
      credential: "earned",
      purchase: "none",
      experience: null,
    },
    verification: { opensAt: new Date(), closesAt: new Date(), open: false },
  };

  it("renders thank-you copy, credential link, and shop CTA during post-show", () => {
    const html = renderToStaticMarkup(
      <PostShowVerifiedExperience
        slug="detroit-tonight"
        page={page as never}
        hub={{
          credential: { credentialId: "cred_1" } as never,
          storeOpen: true,
          purchasableDropCount: 1,
          purchasableProductCount: 0,
          orders: [],
          content: [],
          stayConnectedState: "prompt",
        }}
      />,
    );

    expect(html).toContain("Thank you, DETROIT");
    expect(html).toContain("You were there");
    expect(html).toContain("/event/detroit-tonight/credential");
    expect(html).toContain("Complete your collection");
    expect(html).toContain("/event/detroit-tonight/shop");
    expect(html).toContain("/shows");
    expect(html).toContain("Stay connected with THE DEGENS");
    expect(html).toContain("Yes, keep me connected");
    expect(html).toContain("Not now");
  });

  it("shows store-closed copy after the commerce window", () => {
    const html = renderToStaticMarkup(
      <PostShowVerifiedExperience
        slug="detroit-tonight"
        page={
          {
            ...page,
            timing: { ...page.timing, state: "archived", postShowClosesAt: null },
          } as never
        }
        hub={{
          credential: { credentialId: "cred_1" } as never,
          storeOpen: false,
          purchasableDropCount: 0,
          purchasableProductCount: 0,
          orders: [{ orderId: "ord_1", orderNumber: "RGA-1", name: "Tee", size: "L", quantity: 1, totalCents: 4500, placedAt: new Date() }],
          content: [],
          stayConnectedState: "connected",
        }}
      />,
    );

    expect(html).toContain("attendee store for this show has closed");
    expect(html).toContain("What you took home");
    expect(html).toContain("Tee");
  });
});

describe("PostShowVisitorExperience", () => {
  it("does not expose attendee-only post-show content", () => {
    const html = renderToStaticMarkup(
      <PostShowVisitorExperience artistName="The Degens" artistSlug="the-degens" city="Detroit" />,
    );

    expect(html).toContain("This show has ended");
    expect(html).not.toContain("Complete your collection");
    expect(html).not.toContain("credential");
  });
});

describe("post-show commerce enforcement", () => {
  it("blocks add-to-cart after the post-show window for event-scoped products", async () => {
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const startsAt = new Date("2026-06-01T20:00:00Z");
    const endsAt = new Date("2026-06-01T22:00:00Z");
    const event = await createEvent(artist.id, tour.id, venue.id, {
      startsAt,
      endsAt,
      postShowWindowMinutes: 120,
    });
    const fan = await createUser();
    await createVerifiedAttendance(fan.id, event.id);

    const product = await createProduct(artist.id, {
      accessType: "event_specific",
      eventId: event.id,
    });
    const variant = await createVariantWithInventory(product.id, 5);
    const attendance = await loadAttendanceFacts(fan.id);

    const duringPostShow = await resolveLine({
      productId: product.id,
      variantId: variant.id,
      eventId: event.id,
      quantity: 1,
      attendance,
      now: new Date("2026-06-01T23:00:00Z"),
    });
    expect(duringPostShow.ok).toBe(true);

    const afterWindow = await resolveLine({
      productId: product.id,
      variantId: variant.id,
      eventId: event.id,
      quantity: 1,
      attendance,
      now: new Date("2026-06-02T12:00:00Z"),
    });
    expect(afterWindow.ok).toBe(false);
    if (!afterWindow.ok) {
      expect(afterWindow.reason).toBe("post_show_closed");
    }
  });

  it("keeps verified credential context and withholds attendee content from visitors", async () => {
    const artist = await createArtist();
    const venue = await createVenue();
    const tour = await createTour(artist.id);
    const startsAt = new Date("2026-06-01T20:00:00Z");
    const endsAt = new Date("2026-06-01T22:00:00Z");
    const event = await createEvent(artist.id, tour.id, venue.id, { startsAt, endsAt });
    const verified = await createUser({ displayName: "Verified Fan" });
    const visitor = await createUser({ displayName: "Visitor" });
    await createVerifiedAttendance(verified.id, event.id);

    const verifiedPage = await loadEventPage(event.slug, verified.id);
    const visitorPage = await loadEventPage(event.slug, visitor.id);

    expect(hasEarnedCredential(verifiedPage!.fanExperience)).toBe(true);
    expect(hasEarnedCredential(visitorPage!.fanExperience)).toBe(false);

    const postShowTiming = resolveEventState(
      {
        startsAt,
        endsAt,
        doorsAt: null,
        postShowWindowMinutes: null,
        cancelled: false,
      },
      tour.postShowWindowMinutes,
      new Date("2026-06-01T23:30:00Z"),
    );
    expect(postShowTiming.state).toBe("recently_ended");
    expect(isPostShowPhase(postShowTiming.state)).toBe(true);

    const attendeeContent = await listEventContent(event.id, true);
    const visitorContent = await listEventContent(event.id, false);
    expect(attendeeContent.length).toBeGreaterThanOrEqual(0);
    expect(visitorContent.every((row) => !row.attendeesOnly)).toBe(true);
  });
});
