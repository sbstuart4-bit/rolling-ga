import Link from "next/link";
import {
  FOR_ARTISTS_HERO_BENEFITS,
  FOR_ARTISTS_SHOP_SCREENSHOT,
} from "@/components/marketing/for-artists/marketing-for-artists-fixtures";
import { ExperienceNovaButton } from "@/components/marketing/experience-nova-cta";
import { experienceNovaKestrelAction } from "@/server/marketing/demo-entry";
import {
  MktBenefitRow,
  MktDisplayHeading,
  MktEyebrow,
  MktPhoneFrame,
} from "@/components/marketing/site";
import { cn } from "@/lib/utils";

export function ForArtistsHero() {
  return (
    <section className="relative isolate overflow-x-clip bg-mkt-bg">
      <div className="absolute inset-0 bg-mkt-bg" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-[#120818] via-mkt-bg to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_22%,rgba(123,60,255,0.3),transparent_52%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-mkt-bg via-black/45 to-black/20" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-8 md:pb-20 md:pt-14 lg:px-10 lg:pb-24">
        <div className="grid items-center gap-8 md:gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 xl:gap-16">
          <div className="max-w-xl lg:max-w-none">
            <MktEyebrow>For artists</MktEyebrow>

            <MktDisplayHeading
              as="h1"
              className="mt-5 text-[clamp(2.125rem,9vw,4.75rem)] leading-[0.9] sm:text-[clamp(2.5rem,7vw,4.75rem)]"
              purple="Shouldn't be the limit."
            >
              The merch table
            </MktDisplayHeading>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-mkt-muted sm:text-lg">
              Rolling GA gives fans another way to shop at the show — while giving artists a way to
              test a longer relationship with the people who were actually there.
            </p>

            <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-5">
              <Link
                href="/pilot#conversation"
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-mkt-purple px-8 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-mkt-purple-fg transition-opacity hover:opacity-90 sm:w-auto",
                )}
              >
                Pilot With Us <span aria-hidden>&rarr;</span>
              </Link>
              <form action={experienceNovaKestrelAction} className="w-full sm:w-auto">
                <ExperienceNovaButton
                  size="large"
                  label="Experience the Nova Kestrel Demo"
                  className="w-full border border-white/80 bg-transparent text-mkt-fg hover:bg-white/5 sm:w-auto"
                />
              </form>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[min(100%,380px)] md:max-w-[360px] lg:mx-0 lg:ml-auto lg:max-w-[400px]">
            <MktPhoneFrame
              screenshot={FOR_ARTISTS_SHOP_SCREENSHOT}
              screenshotAlt="Nova Kestrel attendee shop in Rolling GA — show-night merchandise from your phone"
              className="max-w-none lg:max-w-[340px]"
            />
          </div>
        </div>

        <MktBenefitRow
          items={FOR_ARTISTS_HERO_BENEFITS}
          className="mt-14 hidden border-t border-white/10 pt-12 md:grid"
        />
      </div>
    </section>
  );
}
