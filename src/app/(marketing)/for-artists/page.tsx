import type { Metadata } from "next";
import { DemoBoardTeaser } from "@/components/marketing/demo-board-teaser";
import { EndlessAisleEquation } from "@/components/marketing/endless-aisle-equation";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingSection } from "@/components/marketing/marketing-section";
import { ObservedValueBlock } from "@/components/marketing/observed-value-block";
import { PermissionPrinciples } from "@/components/marketing/permission-principles";
import { StudioDesktopFrame } from "@/components/marketing/studio-desktop-frame";
import { MarketingGlow } from "@/components/marketing/visual/marketing-glow";
import { PosterCollage } from "@/components/marketing/visual/poster-collage";
import { ScrollReveal } from "@/components/marketing/visual/scroll-reveal";
import { THE_DEGENS_DEMO_ASSETS } from "@/lib/the-degens-demo-assets";

export const metadata: Metadata = {
  title: "For artists",
  description:
    "Artist Studio for shows, merch, drops, permissioned fans, and observed fan value — not a generic CRM.",
};

export default function ForArtistsPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/5">
        <MarketingGlow variant="accent" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:py-20">
          <ScrollReveal>
            <p className="eyebrow text-primary">For artists</p>
            <h1 className="display-xl mt-4 text-4xl sm:text-5xl md:text-6xl">
              The audience doesn&rsquo;t disappear after load-out.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Managers work Live and Tour for the night and the route, then Merch, Drops, Fans,
              and Insights. The point is a verified audience the artist still owns — with permission.
            </p>
            <MarketingCta
              className="mt-8"
              primaryHref="/pilot"
              primaryLabel="Run a pilot"
              secondaryHref="/demo"
              secondaryLabel="Explore the demo"
            />
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className="relative mx-auto aspect-square max-w-md">
              <PosterCollage
                className="size-full"
                layers={[
                  { src: "/demo/poster-atlas-void-brand.svg", className: "inset-[5%] rotate-[-3deg]" },
                  {
                    src: THE_DEGENS_DEMO_ASSETS.products.prd_av_tour_tee,
                    className: "inset-[25%_8%_8%_25%] rotate-[5deg]",
                  },
                ]}
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <MarketingSection headline="Artist Studio">
        <StudioDesktopFrame />
      </MarketingSection>

      <MarketingSection className="bg-[#0e0e10]" headline="See what the relationship becomes worth.">
        <ObservedValueBlock />
      </MarketingSection>

      <MarketingSection headline="A relationship built with permission.">
        <PermissionPrinciples />
        <MarketingCta
          className="mt-12"
          primaryHref="/pilot"
          primaryLabel="Run a pilot"
          secondaryHref="/how-it-works"
          secondaryLabel="See how it works"
          tertiaryHref="/demo"
          tertiaryLabel="Explore the demo →"
        />
      </MarketingSection>

      <DemoBoardTeaser />
    </>
  );
}
