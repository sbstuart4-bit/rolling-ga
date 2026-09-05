import type { Metadata } from "next";
import { DemoBoardTeaser } from "@/components/marketing/demo-board-teaser";
import { JourneyRail } from "@/components/marketing/journey-rail";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingSection } from "@/components/marketing/marketing-section";
import { MarketingGlow } from "@/components/marketing/visual/marketing-glow";
import { ScrollReveal } from "@/components/marketing/visual/scroll-reveal";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "From attendee to verified fan: attend, verify, unlock, buy, connect, return, and buy again.",
};

export default function HowItWorksPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/5">
        <MarketingGlow variant="primary" />
        <MarketingSection
          eyebrow="How it works"
          headline="From attendee to verified fan."
        >
          <ScrollReveal>
            <p className="mb-12 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Rolling GA is not a QR company or a generic storefront. It is a loop that turns
              being in the room into a permissioned relationship the artist can keep creating
              with — tonight and afterward.
            </p>
          </ScrollReveal>
          <JourneyRail expanded />
          <MarketingCta
            className="mt-14"
            primaryHref="/pilot"
            primaryLabel="Run a pilot"
            secondaryHref="/product"
            secondaryLabel="See the product"
            tertiaryHref="/demo"
            tertiaryLabel="Explore the demo →"
          />
        </MarketingSection>
      </section>

      <DemoBoardTeaser />
    </>
  );
}
