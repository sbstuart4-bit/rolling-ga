import type { Metadata } from "next";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingSection } from "@/components/marketing/marketing-section";
import { PilotForm } from "@/components/marketing/pilot-form";
import { PilotVisual } from "@/components/marketing/pilot-visual";

export const metadata: Metadata = {
  title: "Pilot",
  description:
    "Start with one artist, five shows, and one controlled test. Measure GMV, verification, Endless Aisle, and connected fan rate.",
};

export default function PilotPage() {
  return (
    <>
      <MarketingSection eyebrow="Pilot" headline="Start with five shows.">
        <p className="mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          One artist. Five shows. One controlled test. Measure what the verified room is
          actually worth — without promising a revenue uplift.
        </p>
        <PilotVisual />
      </MarketingSection>

      <MarketingSection className="bg-[#0e0e10]" headline="Tell us about the tour.">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr]">
          <PilotForm />
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              This form does not create a CRM ticket. If an inbox is configured, your device
              can open a message so you can send the inquiry yourself.
            </p>
            <MarketingCta
              primaryHref="/product"
              primaryLabel="See the product"
              secondaryHref="/how-it-works"
              secondaryLabel="How it works"
            />
          </div>
        </div>
      </MarketingSection>
    </>
  );
}
