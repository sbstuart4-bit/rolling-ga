import {
  FOR_FANS_HERO_CREDENTIAL,
  FOR_FANS_HERO_UNLOCK,
} from "@/components/marketing/for-fans/marketing-for-fans-fixtures";
import { ExperienceNovaForm } from "@/components/marketing/experience-nova-form";
import { MktDisplayHeading, MktEyebrow, MktPhoneFrame } from "@/components/marketing/site";

export function ForFansHero() {
  return (
    <section className="relative isolate overflow-x-clip bg-mkt-bg">
      <div className="absolute inset-0 bg-mkt-bg" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-[#120818] via-mkt-bg to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_25%,rgba(123,60,255,0.32),transparent_52%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-mkt-bg via-black/45 to-black/20" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-8 md:pb-20 md:pt-14 lg:px-10 lg:pb-24">
        <div className="grid items-center gap-10 md:gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 xl:gap-16">
          <div className="max-w-xl lg:max-w-none">
            <MktEyebrow>For fans</MktEyebrow>

            <MktDisplayHeading
              as="h1"
              className="mt-5 text-[clamp(2.125rem,9vw,4.75rem)] leading-[0.9] sm:text-[clamp(2.5rem,7vw,4.75rem)]"
            >
              The show
              <span className="block text-mkt-purple">stays with you.</span>
            </MktDisplayHeading>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-mkt-muted sm:text-lg">
              Rolling GA gives fans a better way to discover show merch, unlock what&rsquo;s available
              when they&rsquo;re there, buy without missing the show, and keep a record of the nights
              they were part of.
            </p>

            <ExperienceNovaForm
              size="large"
              demoLabel="Experience the Nova Kestrel Demo"
              secondary={{ href: "/how-it-works", label: "See how it works", outline: true }}
              className="mt-10"
            />
          </div>

          <div className="relative mx-auto w-full max-w-[min(100%,380px)] md:max-w-[400px] lg:mx-0 lg:ml-auto lg:max-w-[420px]">
            <MktPhoneFrame
              screenshot={FOR_FANS_HERO_UNLOCK}
              screenshotAlt="Nova Kestrel in Rolling GA — venue arrival unlocks show-night exclusives"
              className="absolute left-0 top-6 hidden w-[78%] max-w-[280px] opacity-90 lg:block"
            />
            <MktPhoneFrame
              screenshot={FOR_FANS_HERO_CREDENTIAL}
              screenshotAlt="Nova Kestrel I Was There digital credential in Rolling GA"
              className="relative z-10 mx-auto max-w-none lg:ml-auto lg:max-w-[320px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
