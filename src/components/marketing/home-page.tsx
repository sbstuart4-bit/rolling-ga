import Image from "next/image";
import Link from "next/link";
import { RollingGaLogo } from "@/components/brand/rolling-ga-mark";
import { DemoBoardTeaser } from "@/components/marketing/demo-board-teaser";
import { EndlessAisleEquation } from "@/components/marketing/endless-aisle-equation";
import { FanPhoneHero } from "@/components/marketing/fan-phone-hero";
import { FulfillmentSteps } from "@/components/marketing/fulfillment-steps";
import { JourneyRail } from "@/components/marketing/journey-rail";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingSection } from "@/components/marketing/marketing-section";
import { ObservedValueBlock } from "@/components/marketing/observed-value-block";
import { PermissionPrinciples } from "@/components/marketing/permission-principles";
import { PilotVisual } from "@/components/marketing/pilot-visual";
import { ProblemVanish } from "@/components/marketing/problem-vanish";
import { ProductCardGrid } from "@/components/marketing/product-card-grid";
import { RelationshipTimeline } from "@/components/marketing/relationship-timeline";
import { StudioDesktopFrame } from "@/components/marketing/studio-desktop-frame";
import { ExclusivityList, TakeoverPhone } from "@/components/marketing/takeover-phone";
import { MarketingGlow } from "@/components/marketing/visual/marketing-glow";
import { PosterCollage } from "@/components/marketing/visual/poster-collage";
import { ScrollReveal } from "@/components/marketing/visual/scroll-reveal";
import { THE_DEGENS_DEMO_ASSETS } from "@/lib/the-degens-demo-assets";
import { Button } from "@/components/ui/button";

export function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/5">
        <Image
          src={THE_DEGENS_DEMO_ASSETS.tourHero}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-30"
        />
        <MarketingGlow variant="primary" />
        <div className="credential-grain pointer-events-none absolute inset-0" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-[#121212]/60 via-[#121212]/85 to-[#121212]" aria-hidden />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <ScrollReveal className="order-2 space-y-8 md:order-1">
            <p className="eyebrow text-primary">Rolling GA</p>
            <h1 className="display-xl text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
              The show ends.
              <br />
              The connection doesn&rsquo;t.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Rolling GA turns concert attendance into a verified fan relationship — unlocking
              exclusive merch, show-specific experiences and new commerce opportunities long after
              the encore.
            </p>
            <MarketingCta
              primaryHref="/how-it-works"
              primaryLabel="See how it works"
              secondaryHref="/pilot"
              secondaryLabel="Run a pilot"
              tertiaryHref="/demo"
              tertiaryLabel="Explore the demo →"
            />
          </ScrollReveal>
          <ScrollReveal delay={100} className="order-1 md:order-2">
            <div className="relative">
              <PosterCollage
                className="pointer-events-none absolute -right-4 -top-8 hidden h-48 w-48 opacity-60 md:block"
                layers={[
                  { src: THE_DEGENS_DEMO_ASSETS.products.prd_av_detroit_tee, className: "inset-0 rotate-6" },
                ]}
              />
              <FanPhoneHero />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <MarketingSection id="problem" headline="A sold-out room disappears every night.">
        <ProblemVanish />
      </MarketingSection>

      <MarketingSection
        id="how-it-works"
        className="bg-[#0e0e10]"
        eyebrow="The loop"
        headline="From attendee to verified fan."
      >
        <JourneyRail />
        <div className="mt-10">
          <Button asChild variant="outline" className="h-11 rounded-xl px-5 text-xs font-semibold uppercase tracking-[0.16em]">
            <Link href="/how-it-works">See the full journey</Link>
          </Button>
        </div>
      </MarketingSection>

      <MarketingSection id="commerce" headline="The merch table without the walls.">
        <p className="mb-10 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Traditional tours carry limited physical inventory, limited sizes, limited SKUs,
          stockouts, and stock that has to move city to city. Rolling GA lets you carry the
          greatest hits physically — and make the full catalog available digitally.
        </p>
        <EndlessAisleEquation />
        <div className="mt-12">
          <ProductCardGrid />
        </div>
      </MarketingSection>

      <MarketingSection
        id="exclusivity"
        className="bg-[#08080a]"
        headline="Only if you were there."
      >
        <div className="grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
          <TakeoverPhone />
          <div className="space-y-6">
            <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
              Rolling GA can gate merchandise and experiences around verified attendance — the
              people who were actually in the room.
            </p>
            <ExclusivityList />
          </div>
        </div>
      </MarketingSection>

      <MarketingSection id="fulfillment" headline="Buy tonight. Deliver tomorrow.">
        <p className="mb-10 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Designed for expedited direct-to-fan fulfillment. Fans don&rsquo;t carry merchandise
          through the show. Artists don&rsquo;t need to carry their entire assortment city to city.
        </p>
        <FulfillmentSteps />
      </MarketingSection>

      <MarketingSection id="bigger-idea" className="bg-[#0a0a0c]">
        <RelationshipTimeline />
        <p className="mt-12 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Rolling GA gives artists a way to continue creating value from a permissioned audience
          that actually attended the show.
        </p>
      </MarketingSection>

      <MarketingSection id="observed-value" headline="See what the relationship becomes worth.">
        <ObservedValueBlock />
      </MarketingSection>

      <MarketingSection
        id="studio"
        className="bg-[#0e0e10]"
        headline="The audience doesn't disappear after load-out."
      >
        <p className="mb-10 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Artist Studio lets managers work shows, merch, drops, fans, and insights — Live and Tour
          for the night and the route, then activate the people who were actually there.
        </p>
        <StudioDesktopFrame />
      </MarketingSection>

      <MarketingSection id="permission" headline="A relationship built with permission.">
        <PermissionPrinciples />
      </MarketingSection>

      <MarketingSection id="pilot" className="bg-[#0e0e10]" headline="Start with five shows.">
        <PilotVisual />
        <MarketingCta
          className="mt-10"
          primaryHref="/pilot"
          primaryLabel="Run a Rolling GA pilot"
          secondaryHref="/product"
          secondaryLabel="See the product"
          tertiaryHref="/demo"
          tertiaryLabel="Explore the demo →"
        />
      </MarketingSection>

      <DemoBoardTeaser />

      <section className="relative overflow-hidden border-t border-white/5 py-28 text-center">
        <MarketingGlow variant="warm" />
        <div className="credential-grain pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-5 sm:px-8">
          <h2 className="display-xl text-5xl sm:text-6xl md:text-7xl">
            The show ends.
            <br />
            The relationship doesn&rsquo;t have to.
          </h2>
          <MarketingCta
            className="mt-10"
            align="center"
            primaryHref="/pilot"
            primaryLabel="Run a pilot"
            tertiaryHref="/demo"
            tertiaryLabel="Explore the demo →"
          />
          <div className="mt-16 flex flex-col items-center gap-4">
            <RollingGaLogo size="hero" />
            <p className="eyebrow text-primary">I was there</p>
          </div>
        </div>
      </section>
    </>
  );
}
