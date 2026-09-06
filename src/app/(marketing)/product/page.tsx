import type { Metadata } from "next";
import { ClaimLabel } from "@/components/marketing/claim-label";
import { EndlessAisleEquation } from "@/components/marketing/endless-aisle-equation";
import { ExperienceDegensForm } from "@/components/marketing/experience-degens-form";
import { FulfillmentSteps } from "@/components/marketing/fulfillment-steps";
import { MarketingSection } from "@/components/marketing/marketing-section";
import { MarketingWorld } from "@/components/marketing/marketing-world";
import { ExclusivityList, TakeoverPhone } from "@/components/marketing/takeover-phone";

export const metadata: Metadata = {
  title: "Product",
  description:
    "Endless Aisle, verified-attendance exclusives, and expedited direct-to-fan fulfillment — without claiming the booth is gone.",
};

export default function ProductPage() {
  return (
    <>
      <MarketingWorld world="rga">
        <MarketingSection
          eyebrow="Product"
          headline="The merch table without the walls."
          headingLevel={1}
        >
          <p className="mk-body mb-12 max-w-2xl text-lg leading-relaxed text-world-muted">
            Carry the greatest hits physically. Rolling GA carries the Endless Aisle &mdash; digital
            products and extended assortment fans can access without every SKU traveling to every
            city.
          </p>
          <EndlessAisleEquation />
        </MarketingSection>
      </MarketingWorld>

      <MarketingSection headline="Only if you were there.">
        <div className="grid items-center gap-14 md:grid-cols-[0.9fr_1.1fr]">
          <TakeoverPhone />
          <div className="space-y-8">
            <p className="mk-body max-w-md text-lg leading-relaxed text-world-muted">
              Gate merchandise and experiences around verified attendance. City exclusives, encore
              and flash drops, anniversary drops, and returning-fan access are live product
              capabilities.
            </p>
            <ExclusivityList />
            <p className="mk-body text-sm text-world-muted">
              The 48-hour attendee drop on the phone is a{" "}
              <ClaimLabel kind="framing" className="align-middle" /> &mdash; timed and flash drops
              exist; 48 hours is not a named feature.
            </p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection headline="Buy tonight. Deliver tomorrow.">
        <p className="mk-body mb-12 max-w-2xl text-lg leading-relaxed text-world-muted">
          Designed for expedited direct-to-fan fulfillment. We do not claim guaranteed nationwide
          next-day delivery or a fixed carrier rate.
        </p>
        <FulfillmentSteps />
        <ExperienceDegensForm
          className="mt-16"
          secondary={{ href: "/pilot", label: "Talk to us about a tour leg" }}
        />
      </MarketingSection>
    </>
  );
}
