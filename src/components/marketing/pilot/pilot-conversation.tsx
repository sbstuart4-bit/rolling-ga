import { PilotInquiryForm } from "@/components/marketing/pilot/pilot-inquiry-form";
import { ExperienceNovaButton } from "@/components/marketing/experience-nova-cta";
import { MARKETING_DEMO_CTA_LABEL } from "@/components/marketing/home/marketing-home-fixtures";
import { experienceArtistStudioAction } from "@/server/marketing/demo-entry";
import { MktDisplayHeading, MktEyebrow, MktSectionShell } from "@/components/marketing/site";

export function PilotConversation() {
  return (
    <MktSectionShell
      id="conversation"
      tone="light"
      className="overflow-x-clip scroll-mt-24 py-16 md:py-20 lg:py-24"
    >
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16 lg:items-start">
        <div className="max-w-xl">
          <MktEyebrow className="text-mkt-purple">Let&rsquo;s talk</MktEyebrow>
          <MktDisplayHeading
            as="h2"
            className="mt-4 text-[clamp(1.875rem,5vw,3.25rem)] text-[#0a0a0a]"
          >
            Have a show
            <span className="block text-mkt-purple">in mind?</span>
          </MktDisplayHeading>
          <p className="mt-5 text-base leading-relaxed text-[#52525b] sm:text-lg">
            Tell us a little about the artist, show, or organization. We can start with the
            opportunity and determine together whether it makes sense for a Rolling GA pilot.
          </p>

          <div className="mt-12 hidden border-t border-black/10 pt-10 lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#71717a]">
              Not ready for a pilot?
            </p>
            <p className="mt-2 text-base text-[#52525b]">See the experience first.</p>
            <form action={experienceArtistStudioAction} className="mt-5">
              <ExperienceNovaButton
                label={MARKETING_DEMO_CTA_LABEL}
                className="border border-black/15 bg-transparent text-[#0a0a0a] hover:bg-black/[0.03]"
              />
            </form>
            <p className="mt-3 text-xs leading-relaxed text-[#71717a]">
              Marisol Reyes is a fictional demo artist used to explore the Rolling GA experience.
            </p>
          </div>
        </div>

        <PilotInquiryForm />
      </div>

      <div className="mt-12 border-t border-black/10 pt-10 lg:hidden">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#71717a]">
          Not ready for a pilot?
        </p>
        <p className="mt-2 text-base text-[#52525b]">See the experience first.</p>
        <form action={experienceArtistStudioAction} className="mt-5">
          <ExperienceNovaButton
            label={MARKETING_DEMO_CTA_LABEL}
            className="w-full border border-black/15 bg-transparent text-[#0a0a0a] hover:bg-black/[0.03] sm:w-auto"
          />
        </form>
        <p className="mt-3 text-xs leading-relaxed text-[#71717a]">
          Marisol Reyes is a fictional demo artist used to explore the Rolling GA experience.
        </p>
      </div>
    </MktSectionShell>
  );
}
