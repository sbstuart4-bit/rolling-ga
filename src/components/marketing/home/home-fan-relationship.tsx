import {
  HOME_FAN_RELATIONSHIP_BENEFITS,
  NOVA_KESTREL_MY_SHOWS_SCREENSHOT,
} from "@/components/marketing/home/marketing-home-fixtures";
import {
  MktBenefitRow,
  MktDisplayHeading,
  MktEyebrow,
  MktPhoneFrame,
  MktPhotoPlaceholder,
  MktSectionShell,
} from "@/components/marketing/site";

/**
 * Approved homepage fan-relationship band — docs/website-reference/homepage-approved.png
 *
 * My Shows screen is a real Nova guided-demo capture (step 10).
 */
export function HomeFanRelationship() {
  return (
    <MktSectionShell tone="dark" className="overflow-x-clip py-16 md:py-20 lg:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
        <div className="order-2 lg:order-1">
          <MktEyebrow>For fans</MktEyebrow>
          <MktDisplayHeading as="h2" className="mt-4 text-[clamp(1.875rem,5vw,3.25rem)]">
            Your show.
            <span className="block text-mkt-purple">Your merch. Your story.</span>
          </MktDisplayHeading>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-mkt-muted sm:text-lg">
            Shop show-night exclusives from your phone. Get pieces delivered after the encore. Keep
            a permanent &ldquo;I Was There&rdquo; credential — and build an ongoing, permissioned
            relationship with the artists you see live.
          </p>

          <MktBenefitRow items={HOME_FAN_RELATIONSHIP_BENEFITS} className="mt-10" />
        </div>

        <div className="order-1 flex flex-col items-center gap-8 sm:flex-row sm:justify-center lg:order-2 lg:flex-col lg:items-end">
          <MktPhotoPlaceholder
            label="Approved photography: fan at a concert holding a phone showing their show credential"
            aspect="portrait"
            className="hidden w-full max-w-[240px] rounded-2xl lg:block xl:max-w-[260px]"
          />
          <MktPhoneFrame
            loading="eager"
            screenshot={NOVA_KESTREL_MY_SHOWS_SCREENSHOT}
            screenshotAlt="My Shows in Rolling GA — Nova Kestrel Nashville credential and show history for returning fans"
            label="My Shows"
            className="max-w-[280px] sm:max-w-[260px] lg:max-w-[300px]"
          />
        </div>
      </div>
    </MktSectionShell>
  );
}
