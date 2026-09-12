import { ExperienceNovaButton } from "@/components/marketing/experience-nova-cta";
import { StudioDesktopFrame } from "@/components/marketing/studio-desktop-frame";
import { MktEyebrow, MktSectionShell } from "@/components/marketing/site";
import { experienceMarisolArtistStudioAction } from "@/server/marketing/demo-entry";

/**
 * Homepage Artist Studio — Marisol Reyes tour overview mockup.
 */
export function HomeArtistStudio() {
  return (
    <MktSectionShell tone="dark" className="overflow-x-clip py-16 md:py-20 lg:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
        <div>
          <MktEyebrow className="text-mkt-purple">Your Artist Studio</MktEyebrow>

          <h2 className="mt-4 font-display text-[clamp(1.875rem,5vw,3rem)] uppercase leading-[0.95] tracking-[0.02em] text-white">
            Insights that actually matter.
          </h2>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-mkt-muted sm:text-lg">
            See who your fans are, which shows drive the most engagement, what they buy, and how
            to keep the conversation going after the show.
          </p>

          <form action={experienceMarisolArtistStudioAction} className="mt-10">
            <ExperienceNovaButton label="Explore the Artist Studio" />
          </form>
        </div>

        <StudioDesktopFrame className="w-full min-w-0 lg:min-w-[38rem]" />
      </div>
    </MktSectionShell>
  );
}
