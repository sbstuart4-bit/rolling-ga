import Link from "next/link";
import { PARTNERS_ECOSYSTEM_LABELS } from "@/components/marketing/partners/marketing-partners-fixtures";
import { ExperienceNovaButton } from "@/components/marketing/experience-nova-cta";
import { experienceNovaKestrelAction } from "@/server/marketing/demo-entry";
import { MktDisplayHeading, MktEyebrow } from "@/components/marketing/site";
import { cn } from "@/lib/utils";

export function PartnersHero() {
  return (
    <section className="relative isolate overflow-x-clip bg-mkt-bg">
      <div className="absolute inset-0 bg-mkt-bg" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0e0818] via-mkt-bg to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_68%_30%,rgba(123,60,255,0.28),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-mkt-bg via-black/50 to-black/25" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-8 md:pb-20 md:pt-14 lg:px-10 lg:pb-24">
        <div className="grid items-center gap-10 md:gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 xl:gap-16">
          <div className="max-w-xl lg:max-w-none">
            <MktEyebrow>For industry partners</MktEyebrow>

            <MktDisplayHeading
              as="h1"
              className="mt-5 text-[clamp(2rem,8.5vw,4.5rem)] leading-[0.9] sm:text-[clamp(2.25rem,6.5vw,4.5rem)]"
            >
              Help us build
              <span className="block">the next model</span>
              <span className="block text-mkt-purple">for live merch.</span>
            </MktDisplayHeading>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-mkt-muted sm:text-lg">
              Rolling GA is looking for artists, managers, venues, promoters, merch companies, and
              live-music operators to pilot a digital-first show-night merch experience together.
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
                  label="Experience the Demo"
                  className="w-full border border-white/80 bg-transparent text-mkt-fg hover:bg-white/5 sm:w-auto"
                />
              </form>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md lg:mx-0 lg:ml-auto lg:max-w-lg">
            <div className="rounded-2xl border border-white/10 bg-[#0c0c0c]/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-sm sm:p-8">
              <p className="mkt-eyebrow">Who we want to pilot with</p>
              <p className="mt-4 text-sm leading-relaxed text-mkt-muted sm:text-base">
                Rolling GA is not trying to replace the people who already make live music work. It
                is building a fan-facing commerce and relationship layer that can work alongside
                existing roles.
              </p>
              <ul className="mt-8 flex flex-wrap gap-2">
                {PARTNERS_ECOSYSTEM_LABELS.map((label) => (
                  <li
                    key={label}
                    className="rounded-full border border-mkt-purple/40 bg-mkt-purple/10 px-4 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-mkt-fg"
                  >
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
