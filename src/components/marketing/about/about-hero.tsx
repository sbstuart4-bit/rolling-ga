import Link from "next/link";
import { ABOUT_HERO_CHAIN } from "@/components/marketing/about/marketing-about-fixtures";
import { ExperienceNovaButton } from "@/components/marketing/experience-nova-cta";
import { experienceNovaKestrelAction } from "@/server/marketing/demo-entry";
import { MktDisplayHeading, MktEyebrow } from "@/components/marketing/site";
import { cn } from "@/lib/utils";

export function AboutHero() {
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
            <MktEyebrow>About Rolling GA</MktEyebrow>

            <MktDisplayHeading
              as="h1"
              className="mt-5 text-[clamp(2.25rem,9vw,5rem)] leading-[0.88] sm:text-[clamp(2.75rem,7vw,5rem)]"
            >
              The show is
              <span className="block text-mkt-purple">the beginning.</span>
            </MktDisplayHeading>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-mkt-muted sm:text-lg md:text-xl">
              Live music creates some of the strongest connections in culture. Rolling GA is being
              built to help artists and fans carry that connection beyond the night itself.
            </p>

            <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-5">
              <form action={experienceNovaKestrelAction} className="w-full sm:w-auto">
                <ExperienceNovaButton
                  size="large"
                  label="Experience the Demo"
                  className="w-full sm:w-auto"
                />
              </form>
              <Link
                href="/pilot#conversation"
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/80 bg-transparent px-8 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-mkt-fg transition-colors hover:bg-white/5 sm:w-auto",
                )}
              >
                Pilot With Us <span aria-hidden>&rarr;</span>
              </Link>
            </div>
          </div>

          <div className="border-l border-mkt-purple/30 pl-6 lg:pl-8" aria-hidden>
            <p className="mkt-eyebrow mb-6">The connection</p>
            <ol className="space-y-4">
              {ABOUT_HERO_CHAIN.map((label, index) => (
                <li key={label}>
                  <p className="font-display text-[clamp(1.5rem,4vw,2.25rem)] uppercase leading-none tracking-[0.04em] text-mkt-fg">
                    {label}
                  </p>
                  {index < ABOUT_HERO_CHAIN.length - 1 ? (
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
