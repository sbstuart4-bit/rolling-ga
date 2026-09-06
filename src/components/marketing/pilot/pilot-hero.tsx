import Link from "next/link";
import { PILOT_HERO_CONDITIONS } from "@/components/marketing/pilot/marketing-pilot-page-fixtures";
import { ExperienceNovaButton } from "@/components/marketing/experience-nova-cta";
import { MktDisplayHeading, MktEyebrow } from "@/components/marketing/site";
import { experienceNovaKestrelAction } from "@/server/marketing/demo-entry";
import { cn } from "@/lib/utils";

export function PilotHero() {
  return (
    <section className="relative isolate overflow-x-clip bg-mkt-bg">
      <div className="absolute inset-0 bg-mkt-bg" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0e0818] via-mkt-bg to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(123,60,255,0.22),transparent_50%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-mkt-bg via-black/50 to-black/20" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-8 md:pb-24 md:pt-16 lg:px-10 lg:pb-28">
        <div className="grid items-end gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16 xl:gap-20">
          <div className="max-w-2xl">
            <MktEyebrow>Pilot with Rolling GA</MktEyebrow>

            <MktDisplayHeading
              as="h1"
              className="mt-5 text-[clamp(2.25rem,9vw,5rem)] leading-[0.88] sm:text-[clamp(2.75rem,7vw,5rem)]"
            >
              Run one show
              <span className="block text-mkt-purple">with us.</span>
            </MktDisplayHeading>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-mkt-muted sm:text-lg md:text-xl">
              Rolling GA is looking for artists and live-music partners to test a different merch
              experience at a real show — from fan discovery and show-night commerce to fulfillment
              and the relationship that follows.
            </p>

            <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-5">
              <Link
                href="#conversation"
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-mkt-purple px-8 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-mkt-purple-fg transition-opacity hover:opacity-90 sm:w-auto",
                )}
              >
                Start a pilot conversation <span aria-hidden>&rarr;</span>
              </Link>
              <form action={experienceNovaKestrelAction} className="w-full sm:w-auto">
                <ExperienceNovaButton
                  size="large"
                  label="Experience the Demo"
                  className="w-full border border-white/20 bg-transparent text-mkt-fg hover:bg-white/5 sm:w-auto"
                />
              </form>
            </div>
          </div>

          <div className="border-l border-mkt-purple/30 pl-6 lg:pl-8" aria-hidden>
            <p className="mkt-eyebrow mb-6">Pilot conditions</p>
            <ol className="space-y-4">
              {PILOT_HERO_CONDITIONS.map((label, index) => (
                <li key={label}>
                  <p className="font-display text-[clamp(1.5rem,4vw,2.25rem)] uppercase leading-none tracking-[0.04em] text-mkt-fg">
                    {label}
                  </p>
                  {index < PILOT_HERO_CONDITIONS.length - 1 ? (
                    <span className="mt-3 block text-mkt-purple/50">↓</span>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
