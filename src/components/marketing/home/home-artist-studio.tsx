import { ArtistGuidedDemoLink } from "@/components/marketing/artist-guided-demo-link";
import { StudioDesktopFrame } from "@/components/marketing/studio-desktop-frame";
import { MktEyebrow, MktSectionShell } from "@/components/marketing/site";

/**
 * Homepage Artist Studio — Marisol Reyes tour overview mockup.
 */
export async function HomeArtistStudio() {
  return (
    <MktSectionShell
      id="artist-studio"
      tone="dark"
      className="overflow-x-clip py-16 md:py-20 lg:py-24"
    >
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

          <div className="mt-10">
            <ArtistGuidedDemoLink label="Explore the Artist Studio" />
          </div>
        </div>

        <StudioDesktopFrame className="w-full min-w-0 lg:min-w-[38rem]" />
      </div>
    </MktSectionShell>
  );
}
