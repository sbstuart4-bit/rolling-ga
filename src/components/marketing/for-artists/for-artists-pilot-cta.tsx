import Link from "next/link";
import { ExperienceNovaButton } from "@/components/marketing/experience-nova-cta";
import { experienceArtistStudioAction } from "@/server/marketing/demo-entry";
import { MktDisplayHeading, MktEyebrow, MktSectionShell } from "@/components/marketing/site";
import { cn } from "@/lib/utils";

export function ForArtistsPilotCta() {
  return (
    <MktSectionShell tone="dark" contained={false} className="overflow-x-clip py-0">
      <div className="relative isolate">
        <div className="absolute inset-0 bg-mkt-bg" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a28] via-mkt-bg to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,rgba(123,60,255,0.35),transparent_55%)]" />
        </div>

        <div className="relative mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 md:py-28 lg:py-32">
          <MktEyebrow className="text-center">Pilot with us</MktEyebrow>

          <MktDisplayHeading as="h2" className="mt-4 text-[clamp(1.75rem,5.5vw,3.25rem)]">
            Let&rsquo;s test it
            <span className="block text-mkt-purple">at a real show.</span>
          </MktDisplayHeading>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-mkt-muted sm:text-lg">
            We&rsquo;re looking for artists, managers, and labels interested in testing a different
            approach to show-night merch and the fan relationship that can follow.
          </p>

          <div className="mt-10 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center sm:justify-center">
            <Link
              href="/pilot#conversation"
              className={cn(
                "inline-flex w-full items-center justify-center gap-2 rounded-full bg-mkt-purple px-8 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-mkt-purple-fg transition-opacity hover:opacity-90 sm:w-auto",
              )}
            >
              Start a Pilot Conversation <span aria-hidden>&rarr;</span>
            </Link>
            <form action={experienceArtistStudioAction} className="w-full sm:w-auto">
              <ExperienceNovaButton
                label="Experience the Demo"
                className="w-full border border-white/80 bg-transparent text-mkt-fg hover:bg-white/5 sm:w-auto"
              />
            </form>
          </div>
        </div>
      </div>
    </MktSectionShell>
  );
}
