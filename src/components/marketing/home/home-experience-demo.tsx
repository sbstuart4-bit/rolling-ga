import {
  MARKETING_FAN_DEMO_CTA_LABEL,
  MKT_PHOTOS,
} from "@/components/marketing/home/marketing-home-fixtures";
import { ExperienceNovaForm } from "@/components/marketing/experience-nova-form";
import {
  MktDisplayHeading,
  MktEyebrow,
  MktPhoto,
  MktSectionShell,
} from "@/components/marketing/site";
import { experienceMarisolReyesFanAction } from "@/server/marketing/demo-entry";

/**
 * Primary demo CTA — enters the Marisol Reyes guided journey with no signup wall.
 */
export function HomeExperienceDemo() {
  return (
    <MktSectionShell tone="dark" className="overflow-x-clip py-16 md:py-20 lg:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-16">
        <div>
          <MktEyebrow>See it as a fan</MktEyebrow>
          <MktDisplayHeading as="h2" className="mt-4 text-[clamp(1.875rem,5vw,3.25rem)]">
            Experience
            <span className="block text-mkt-purple">Marisol&apos;s show.</span>
          </MktDisplayHeading>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-mkt-muted sm:text-lg">
            Follow a real Rolling GA show journey from discovery through post-show — no account
            required.
          </p>

          <ExperienceNovaForm
            size="large"
            demoLabel={MARKETING_FAN_DEMO_CTA_LABEL}
            action={experienceMarisolReyesFanAction}
            className="mt-10"
          />

          <blockquote className="mt-12 max-w-md font-serif text-lg italic leading-relaxed text-white/80">
            &ldquo;It felt like the band kept the night going.&rdquo;
            <footer className="mt-2 text-xs not-italic uppercase tracking-[0.12em] text-mkt-muted">
              — Fan (Demo)
            </footer>
          </blockquote>
        </div>

        <MktPhoto
          src={MKT_PHOTOS.frontRowCrowd}
          alt="Fans at the front row of a concert, focused on the performance"
          aspect="portrait"
          className="w-full max-w-md rounded-2xl lg:ml-auto"
          objectPosition="center 35%"
        />
      </div>
    </MktSectionShell>
  );
}
