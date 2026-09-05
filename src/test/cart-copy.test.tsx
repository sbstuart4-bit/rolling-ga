import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CartPageHeader } from "@/components/fan/cart-page-header";
import {
  cartMetadataTitle,
  cartPageSubtitle,
  cartPageTitle,
  type CartEventContextRef,
} from "@/lib/cart-copy";

const mockEventContext: CartEventContextRef = {
  eventId: "evt_test",
  eventSlug: "detroit-tonight",
  artistId: "art_test",
  artistName: "The Degens",
  venueName: "The Fillmore",
  venueCity: "Detroit",
  startsAt: new Date("2026-06-30T20:00:00.000Z"),
  timezone: "America/Detroit",
};

describe("cart copy", () => {
  it("uses My Drop language when event context exists", () => {
    expect(cartPageTitle(mockEventContext)).toBe("My Drop");
    expect(cartPageSubtitle(mockEventContext)).toBe("Your selections from tonight\u2019s experience");
    expect(cartMetadataTitle(mockEventContext)).toBe("My Drop \u2014 Rolling GA");
  });

  it("uses generic Cart language without event context", () => {
    expect(cartPageTitle(null)).toBe("Cart");
    expect(cartPageSubtitle(null)).toBeNull();
    expect(cartMetadataTitle(undefined)).toBe("Cart \u2014 Rolling GA");
  });
});

describe("CartPageHeader", () => {
  it("renders event-scoped title and subtitle", () => {
    const html = renderToStaticMarkup(<CartPageHeader eventContext={mockEventContext} />);

    expect(html).toContain("My Drop");
    expect(html).toContain("Your selections from tonight");
    expect(html).not.toContain(">Cart<");
  });

  it("renders generic Cart title without subtitle", () => {
    const html = renderToStaticMarkup(<CartPageHeader eventContext={null} />);

    expect(html).toContain(">Cart<");
    expect(html).not.toContain("My Drop");
    expect(html).not.toContain("tonight");
  });
});
