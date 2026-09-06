import {
  HOME_HERO_BENEFITS,
  NOVA_KESTREL_SHOP_SCREENSHOT,
} from "@/components/marketing/home/marketing-home-fixtures";
import { ExperienceNovaForm } from "@/components/marketing/experience-nova-form";
import {
  MktBenefitRow,
  MktDisplayHeading,
  MktEyebrow,
  MktPhoneFrame,
} from "@/components/marketing/site";

/**
 * Approved homepage hero — docs/website-reference/homepage-approved.png
 *
 * Hero concert photography: no approved asset in repo yet — dark gradient only
 * (see P2 visual completion report for exact photography requirement).
 */
export function HomeHero() {
  return (
    <section className="relative isolate overflow-x-clip bg-mkt-bg">
      <div className="absolute inset-0 bg-mkt-bg" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-[#120818] via-mkt-bg to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_25%,rgba(123,60,255,0.28),transparent_50%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-mkt-bg via-black/40 to-black/20" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-8 md:pb-20 md:pt-14 lg:px-10 lg:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 xl:gap-16">
          <div className="max-w-xl lg:max-w-none">
            <MktEyebrow className="text-[0.6875rem] sm:text-xs">Live music lives on</MktEyebrow>

            <MktDisplayHeading
              as="h1"
              className="mt-5 text-[clamp(2.125rem,9vw,4.75rem)] leading-[0.9] sm:text-[clamp(2.5rem,7vw,4.75rem)]"
              purple="The merch line."
            >
              Merch without
            </MktDisplayHeading>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-mkt-muted sm:text-lg">
              Fans shop from their phones at the show. Artists can offer more without relying on the
              physical merch table. The experience continues after the encore.
            </p>

            <ExperienceNovaForm
              size="large"
              demoLabel="Experience the Nova Kestrel Demo"
              secondary={{ href: "/pilot#conversation", label: "Pilot with us", outline: true }}
              className="mt-10"
            />

            <MktBenefitRow items={HOME_HERO_BENEFITS} className="mt-14 border-t border-white/10 pt-12" />
          </div>

          <div className="relative mx-auto w-full max-w-[320px] sm:max-w-[360px] lg:mx-0 lg:ml-auto lg:max-w-[400px]">
            <p
              className="pointer-events-none absolute -right-2 top-8 z-10 hidden max-w-[9rem] rotate-[-6deg] font-serif text-2xl leading-tight text-white/90 xl:block"
              aria-hidden
            >
              See it. Shop it. Keep it.
            </p>
            <MktPhoneFrame
              loading="eager"
              screenshot={NOVA_KESTREL_SHOP_SCREENSHOT}
              screenshotAlt="Nova Kestrel attendee shop in the Rolling GA app — unlocked show-night merchandise"
              className="max-w-none lg:max-w-[340px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
