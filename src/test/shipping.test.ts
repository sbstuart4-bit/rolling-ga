import { describe, it, expect } from "vitest";
import {
  buildShippingChoice,
  resolveShippingQuote,
  shippingOptionInScope,
} from "@/lib/shipping";

const baseOption = {
  id: "shp_test",
  name: "Standard",
  speed: "standard" as const,
  carrierCostCents: 1200,
  baseCustomerChargeCents: 1200,
  subsidyCents: 0,
  freeThresholdCents: null,
  deliveryMinDays: 3,
  deliveryMaxDays: 6,
  strategy: "fan_pays_full" as const,
};

describe("resolveShippingQuote", () => {
  it("charges the fan the full configured amount for fan_pays_full", () => {
    const quote = resolveShippingQuote(
      { ...baseOption, strategy: "fan_pays_full" },
      5000,
    );

    expect(quote.customerChargeCents).toBe(1200);
    expect(quote.artistSubsidyCents).toBe(0);
    expect(quote.carrierCostCents).toBe(1200);
    expect(quote.thresholdMet).toBe(false);
  });

  it("applies a partial artist subsidy for artist_subsidized", () => {
    const quote = resolveShippingQuote(
      {
        ...baseOption,
        strategy: "artist_subsidized",
        baseCustomerChargeCents: 1200,
        subsidyCents: 701,
      },
      5000,
    );

    expect(quote.customerChargeCents).toBe(499);
    expect(quote.artistSubsidyCents).toBe(701);
    expect(quote.carrierCostCents).toBe(1200);
  });

  it("waives fan shipping when the free threshold is met", () => {
    const below = resolveShippingQuote(
      {
        ...baseOption,
        strategy: "free_above_threshold",
        baseCustomerChargeCents: 990,
        freeThresholdCents: 7500,
      },
      5000,
    );
    expect(below.customerChargeCents).toBe(990);
    expect(below.artistSubsidyCents).toBe(0);
    expect(below.thresholdMet).toBe(false);

    const above = resolveShippingQuote(
      {
        ...baseOption,
        strategy: "free_above_threshold",
        baseCustomerChargeCents: 990,
        freeThresholdCents: 7500,
      },
      7500,
    );
    expect(above.customerChargeCents).toBe(0);
    expect(above.artistSubsidyCents).toBe(1200);
    expect(above.thresholdMet).toBe(true);
  });

  it("covers carrier cost on promotional_free shipping", () => {
    const quote = resolveShippingQuote(
      {
        ...baseOption,
        strategy: "promotional_free",
        baseCustomerChargeCents: 0,
        subsidyCents: 1180,
      },
      3000,
    );

    expect(quote.customerChargeCents).toBe(0);
    expect(quote.artistSubsidyCents).toBe(1200);
  });
});

describe("buildShippingChoice", () => {
  it("includes estimated delivery dates and speed labels", () => {
    const now = new Date("2026-06-30T20:00:00.000Z");
    const choice = buildShippingChoice(
      {
        ...baseOption,
        name: "Next-day delivery",
        speed: "next_day",
        deliveryMinDays: 1,
        deliveryMaxDays: 1,
      },
      5000,
      now,
    );

    expect(choice.speedLabel).toBe("Next day");
    expect(choice.estimatedDeliveryFrom.toISOString()).toBe(
      new Date(now.getTime() + 86_400_000).toISOString(),
    );
    expect(choice.estimatedDeliveryTo.toISOString()).toBe(
      new Date(now.getTime() + 86_400_000).toISOString(),
    );
  });
});

describe("shippingOptionInScope", () => {
  it("includes artist-wide options everywhere", () => {
    expect(
      shippingOptionInScope({ eventId: null, tourId: null }, { eventId: "evt_1", tourId: "tor_1" }),
    ).toBe(true);
  });

  it("filters event promos to the matching show", () => {
    expect(
      shippingOptionInScope({ eventId: "evt_detroit", tourId: null }, { eventId: "evt_detroit" }),
    ).toBe(true);
    expect(
      shippingOptionInScope({ eventId: "evt_detroit", tourId: null }, { eventId: "evt_chicago" }),
    ).toBe(false);
    expect(shippingOptionInScope({ eventId: "evt_detroit", tourId: null }, {})).toBe(false);
  });
});
