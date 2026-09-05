import type { Metadata } from "next";
import { ClaimLabel } from "@/components/marketing/claim-label";
import { DemoBoardTeaser } from "@/components/marketing/demo-board-teaser";
import { EndlessAisleEquation } from "@/components/marketing/endless-aisle-equation";
import { FulfillmentSteps } from "@/components/marketing/fulfillment-steps";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingSection } from "@/components/marketing/marketing-section";
import { ProductCardGrid } from "@/components/marketing/product-card-grid";
import { ExclusivityList, TakeoverPhone } from "@/components/marketing/takeover-phone";
import { MarketingGlow } from "@/components/marketing/visual/marketing-glow";
import { ScrollReveal } from "@/components/marketing/visual/scroll-reveal";

export const metadata: Metadata = {
  title: "Product",
  description:
    "Endless Aisle, verified-attendance exclusives, and expedited direct-to-fan fulfillment — without claiming the booth is gone.",
};

export default function ProductPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/5 pb-4">
        <MarketingGlow variant="primary" />
        <MarketingSection eyebrow="Product" headline="The merch table without the walls.">
          <ScrollReveal>
            <p className="mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Carry the greatest hits physically. Rolling GA carries the Endless Aisle — digital
              products and extended assortment fans can access without every SKU traveling to
              every city.
            </p>
          </ScrollReveal>
          <EndlessAisleEquation />
          <div className="mt-12">
            <ProductCardGrid />
          </div>
        </MarketingSection>
      </section>

      <MarketingSection className="bg-[#08080a]" headline="Only if you were there.">
        <div className="grid items-center gap-12 md:grid-cols-[0.9fr_1.1fr]">
          <TakeoverPhone />
          <ScrollReveal>
            <div className="space-y-6">
              <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
                Gate merchandise and experiences around verified attendance. City exclusives,
                encore and flash drops, anniversary drops, and returning-fan access are live
                product capabilities.
              </p>
              <ExclusivityList />
              <p className="text-sm text-muted-foreground">
                The 48-hour attendee drop on the phone is a <ClaimLabel kind="framing" className="align-middle" /> —
                timed and flash drops exist; 48 hours is not a named feature.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </MarketingSection>

      <MarketingSection headline="Buy tonight. Deliver tomorrow.">
        <p className="mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Designed for expedited direct-to-fan fulfillment. We do not claim guaranteed
          nationwide next-day delivery or a fixed carrier rate.
        </p>
        <FulfillmentSteps />
        <MarketingCta
          className="mt-12"
          primaryHref="/pilot"
          primaryLabel="Run a pilot"
          secondaryHref="/for-artists"
          secondaryLabel="For artists"
          tertiaryHref="/demo"
          tertiaryLabel="Explore the demo →"
        />
      </MarketingSection>

      <DemoBoardTeaser />
    </>
  );
}
