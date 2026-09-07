import { MKT_PHOTOS } from "@/components/marketing/home/marketing-home-fixtures";
import { MktDisplayHeading, MktEyebrow, MktOutlineButton, MktPhoto, MktSectionShell } from "@/components/marketing/site";

/**
 * Pilot CTA — real venue merch table photography.
 */
export function HomePilotCta() {
  return (
    <MktSectionShell tone="dark" contained={false} className="overflow-x-clip py-0">
      <div className="relative isolate">
        <div className="absolute inset-0 bg-mkt-bg" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a28] via-mkt-bg to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,rgba(123,60,255,0.25),transparent_55%)]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 md:py-24 lg:grid-cols-2 lg:gap-16 lg:px-10">
          <div>
            <MktEyebrow>For artists</MktEyebrow>
            <MktDisplayHeading as="h2" className="mt-4 text-[clamp(1.75rem,5.5vw,3.25rem)]">
              Try it at
              <span className="block text-mkt-purple">a real show.</span>
            </MktDisplayHeading>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-mkt-muted sm:text-lg">
              Run Rolling GA alongside your existing merch operation and learn what changes.
            </p>

            <MktOutlineButton href="/pilot#conversation" className="mt-10">
              Run a pilot <span aria-hidden>&rarr;</span>
            </MktOutlineButton>

            <p className="mt-14 font-display text-sm uppercase tracking-[0.2em] text-mkt-purple">
              Live music lives on
            </p>
          </div>

          <MktPhoto
            src={MKT_PHOTOS.pilotVenue}
            alt="Merchandise table at a real live music venue during a show"
            aspect="video"
            className="w-full rounded-2xl"
          />
        </div>
      </div>
    </MktSectionShell>
  );
}
