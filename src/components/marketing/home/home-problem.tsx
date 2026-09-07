import Image from "next/image";
import Link from "next/link";
import { Check, Heart } from "lucide-react";
import {
  HOME_BETTER_WAY_BENEFITS,
  HOME_PROBLEM_ITEMS,
  MKT_PHOTOS,
} from "@/components/marketing/home/marketing-home-fixtures";
import { MktDisplayHeading, MktEyebrow } from "@/components/marketing/site";
import { cn } from "@/lib/utils";

/**
 * Homepage section 2 — approved mockup: opportunity + better way over merch-line photography.
 */
export function HomeProblem() {
  return (
    <section className="relative isolate overflow-hidden bg-black">
      <Image
        src={MKT_PHOTOS.opportunityBackdrop}
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover object-[center_42%] grayscale"
      />
      <div className="absolute inset-0 -z-10 bg-black/62" aria-hidden />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/45 to-black/25"
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-transparent to-black/35"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 md:py-20 lg:px-10 lg:py-24">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-10 xl:gap-14">
          <div className="max-w-xl lg:max-w-none">
            <MktEyebrow>The opportunity</MktEyebrow>

            <MktDisplayHeading
              as="h2"
              className="mt-4 text-[clamp(2rem,6vw,3.75rem)] leading-[0.95]"
              purple="Your merch can too."
            >
              Your music moves people.
            </MktDisplayHeading>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">
              Live shows are one of the most powerful revenue opportunities for artists — but
              traditional merch tables limit what you can sell and how many fans you can reach.
            </p>

            <ul className="mt-10 grid gap-6 sm:grid-cols-3 sm:gap-4">
              {HOME_PROBLEM_ITEMS.map((item) => (
                <li key={item.title}>
                  <div className="overflow-hidden rounded-lg border border-white/10 bg-black/30">
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src={item.photo}
                        alt={item.photoAlt}
                        fill
                        sizes="(max-width: 640px) 100vw, 220px"
                        className="object-cover grayscale"
                        style={{ objectPosition: item.objectPosition }}
                      />
                    </div>
                  </div>
                  <h3 className="mt-3 font-display text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-white sm:text-xs">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-snug text-white/65">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative lg:pt-2">
            <div
              className={cn(
                "rounded-2xl border border-white/12 bg-black/45 p-7 backdrop-blur-md sm:p-8 lg:p-9",
                "shadow-[0_24px_80px_rgba(0,0,0,0.45)]",
              )}
            >
              <MktEyebrow>A better way</MktEyebrow>

              <h3 className="mt-4 font-display text-[clamp(1.5rem,4vw,2.125rem)] uppercase leading-[0.95] tracking-[0.04em] text-white">
                More demand.
                <span className="block">Fewer limits.</span>
              </h3>

              <p className="mt-5 text-sm leading-relaxed text-white/75 sm:text-base">
                Rolling GA lets you sell merch digitally at the show, with fulfillment after the
                show — so you can offer a bigger catalog, avoid stockouts, and give fans a better
                experience.
              </p>

              <ul className="mt-8 space-y-4">
                {HOME_BETTER_WAY_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-mkt-purple"
                      aria-hidden
                    >
                      <Check className="size-4 text-white" strokeWidth={2.5} />
                    </span>
                    <span className="text-sm leading-snug text-white/90 sm:text-[0.9375rem]">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/how-it-works"
                className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-full bg-mkt-purple px-8 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-mkt-purple-fg transition-opacity hover:opacity-90 sm:w-auto"
              >
                See how it works <span aria-hidden>&rarr;</span>
              </Link>
            </div>

            <div
              className="pointer-events-none absolute -bottom-2 right-0 hidden max-w-[12rem] text-right lg:block xl:-bottom-6 xl:right-2"
              aria-hidden
            >
              <p className="font-serif text-[1.35rem] italic leading-[1.15] text-white/90 -rotate-6">
                Same Songs
                <br />A Deeper Story
              </p>
              <Heart
                className="ml-auto mr-3 mt-2 size-5 fill-transparent stroke-mkt-purple"
                strokeWidth={1.75}
              />
            </div>
          </div>
        </div>

        <div className="mt-14 flex items-center gap-4 md:mt-16 lg:mt-20">
          <span className="h-px flex-1 bg-white/15" aria-hidden />
          <p className="shrink-0 text-center text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-white/45 sm:text-[0.6875rem]">
            More merch. Bigger moments. Longer relationships.
          </p>
          <span className="h-px flex-1 bg-white/15" aria-hidden />
        </div>
      </div>
    </section>
  );
}
