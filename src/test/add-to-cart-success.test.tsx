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
import { AddToCartSuccess } from "@/components/fan/add-to-cart-success";

describe("AddToCartSuccess", () => {
  it("renders branded copy and event shop link for scoped journeys", () => {
    const html = renderToStaticMarkup(
      <AddToCartSuccess
        productName="Signal Tee"
        variantLabel="L"
        quantity={1}
        eventSlug="detroit-tonight"
        branded
      />,
    );

    expect(html).toContain("Added to My Drop");
    expect(html).toContain("Signal Tee");
    expect(html).toContain("L");
    expect(html).toContain("Qty 1");
    expect(html).toContain('href="/cart"');
    expect(html).toContain("View My Drop");
    expect(html).toContain('href="/event/detroit-tonight/shop"');
    expect(html).toContain("Keep shopping");
    expect(html).toContain("border-artist-accent/30");
  });

  it("renders neutral copy and dismiss keep-shopping for generic journeys", () => {
    const html = renderToStaticMarkup(
      <AddToCartSuccess
        productName="Tour Hoodie"
        quantity={1}
        onKeepShopping={() => {}}
      />,
    );

    expect(html).toContain("Added to cart");
    expect(html).toContain("View cart");
    expect(html).toContain("Keep shopping");
    expect(html).not.toContain("Added to My Drop");
    expect(html).not.toContain("/event/");
    expect(html).toContain("border-border");
  });
});
