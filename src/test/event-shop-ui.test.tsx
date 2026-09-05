import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EventShopProductCard } from "@/components/fan/event-shop/event-shop-product-card";
import { EventShopUnlockBanner } from "@/components/fan/event-shop/event-shop-sections";
import { eventShopProductTag } from "@/lib/event-shop-present";

describe("eventShopProductTag", () => {
  it("prefers drop exclusivity labels for shelf tags", () => {
    expect(
      eventShopProductTag({
        dropExclusivity: "flash",
        accessType: "verified_attendee",
        category: "apparel",
      }),
    ).toBe("Flash");
  });

  it("maps access types when no drop context exists", () => {
    expect(eventShopProductTag({ accessType: "event_specific" })).toBe("Show");
    expect(eventShopProductTag({ accessType: "verified_attendee" })).toBe("Attendee");
  });
});

describe("event shop UI", () => {
  it("renders unlocked banner copy from the Figma frame", () => {
    const html = renderToStaticMarkup(<EventShopUnlockBanner />);
    expect(html).toContain("Unlocked tonight");
    expect(html).toContain("Attendee exclusives are live");
  });

  it("renders locked and unlocked product card states", () => {
    const locked = renderToStaticMarkup(
      <EventShopProductCard
        href="/event/detroit-tonight/verify"
        name="Detroit Exclusive"
        priceCents={5500}
        tag="Show"
        locked
        lockLabel="Verify at the venue to unlock"
        actionLabel="Unlock"
      />,
    );
    expect(locked).toContain("Detroit Exclusive");
    expect(locked).toContain("Verify at the venue to unlock");
    expect(locked).toContain("Unlock");

    const unlocked = renderToStaticMarkup(
      <EventShopProductCard
        href="/product/detroit-exclusive?a=art_1&amp;e=detroit-tonight"
        name="Detroit Exclusive"
        priceCents={5500}
        tag="Show"
        locked={false}
        actionLabel="View"
      />,
    );
    expect(unlocked).toContain('href="/product/detroit-exclusive?a=art_1&amp;e=detroit-tonight"');
    expect(unlocked).toContain("View");
    expect(unlocked).not.toContain("Locked");
  });
});
