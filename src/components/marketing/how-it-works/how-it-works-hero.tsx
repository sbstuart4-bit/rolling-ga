import {
  MARISOL_REYES_UNLOCK_SCREENSHOT,
  MARKETING_DEMO_CTA_LABEL,
} from "@/components/marketing/home/marketing-home-fixtures";
import { ExperienceNovaForm } from "@/components/marketing/experience-nova-form";
import { MktDisplayHeading, MktEyebrow, MktPhoneFrame } from "@/components/marketing/site";
import { experienceArtistStudioAction } from "@/server/marketing/demo-entry";

export function HowItWorksHero() {
  return (
    <section className="relative isolate overflow-x-clip bg-mkt-bg">
      <div className="absolute inset-0 bg-mkt-bg" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-[#120818] via-mkt-bg to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(123,60,255,0.26),transparent_52%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-mkt-bg via-black/40 to-black/20" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-8 md:pb-20 md:pt-14 lg:px-10 lg:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 xl:gap-16">
          <div className="max-w-xl lg:max-w-none">
            <MktEyebrow>How it works</MktEyebrow>

            <MktDisplayHeading
              as="h1"
              className="mt-5 text-[clamp(2.125rem,9vw,4.75rem)] leading-[0.9] sm:text-[clamp(2.5rem,7vw,4.75rem)]"
              purple="The beginning."
            >
              The show is
            </MktDisplayHeading>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-mkt-muted sm:text-lg">
              Rolling GA connects the live moment to what comes next — giving fans a better way to
              shop and artists a way to keep the relationship going after the encore.
            </p>

            <ExperienceNovaForm
              size="large"
              demoLabel={MARKETING_DEMO_CTA_LABEL}
              action={experienceArtistStudioAction}
              className="mt-10"
            />
          </div>

          <div className="mx-auto w-full max-w-[320px] sm:max-w-[360px] lg:mx-0 lg:ml-auto lg:max-w-[400px]">
            <MktPhoneFrame
              screenshot={MARISOL_REYES_UNLOCK_SCREENSHOT}
              screenshotAlt="Marisol Reyes in Rolling GA — venue arrival unlocks show-night exclusives"
              className="max-w-none lg:max-w-[340px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
