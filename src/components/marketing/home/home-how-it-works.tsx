import { Fragment } from "react";
import {
  HOME_SOLUTION_RAIL,
  MARISOL_REYES_SHOP_SCREENSHOT,
} from "@/components/marketing/home/marketing-home-fixtures";
import { MktEyebrow, MktPhoneFrame } from "@/components/marketing/site";

/**
 * Homepage section 3 — merch without the line; Marisol shop screenshot + solution rail.
 */
export function HomeHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative isolate overflow-x-clip bg-[#08050c] py-16 md:py-20 lg:py-24"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#1a0a28] via-[#0c0612] to-black"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_78%_32%,rgba(123,60,255,0.28),transparent_58%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8 xl:gap-12">
          <div className="max-w-xl lg:max-w-none lg:pt-4">
            <MktEyebrow>The better way</MktEyebrow>

            <h2 className="mt-4 font-display text-[clamp(2.125rem,6.5vw,4rem)] uppercase leading-[0.92] tracking-[0.02em] text-white">
              Merch without
              <span className="block text-mkt-purple">the merch line.</span>
            </h2>

            <p className="mt-5 max-w-md text-base leading-relaxed text-white/80 sm:text-lg">
              See it. Buy it from your phone. Keep watching the show.
            </p>
          </div>

          <div className="flex justify-center lg:justify-end lg:pr-4 xl:pr-8">
            <div className="rotate-[7deg] drop-shadow-[0_28px_70px_rgba(123,60,255,0.35)] transition-transform lg:rotate-[8deg]">
              <MktPhoneFrame
                loading="eager"
                screenshot={MARISOL_REYES_SHOP_SCREENSHOT}
                screenshotAlt="Marisol Reyes attendee shop in Rolling GA — A Tender Night tour merchandise"
                className="max-w-[min(100%,300px)] sm:max-w-[320px] lg:max-w-[340px] xl:max-w-[360px]"
              />
            </div>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 sm:mt-16 sm:flex sm:flex-wrap sm:items-end sm:justify-center sm:gap-x-4 sm:gap-y-8 lg:mt-20 lg:gap-x-6">
          {HOME_SOLUTION_RAIL.map((step, index) => (
            <Fragment key={step.label}>
              {index > 0 ? (
                <span
                  aria-hidden
                  className="hidden pb-10 text-2xl text-mkt-purple sm:inline lg:pb-11 lg:text-3xl"
                >
                  →
                </span>
              ) : null}
              <div className="flex flex-col items-center text-center sm:w-[9.5rem] lg:w-[10.5rem]">
                <span className="flex size-16 items-center justify-center rounded-full border-2 border-white/22 text-white sm:size-[4.75rem] lg:size-20">
                  <step.icon className="size-7 sm:size-7 lg:size-8" strokeWidth={1.5} aria-hidden />
                </span>
                <p className="mt-4 text-sm font-semibold uppercase leading-snug tracking-[0.14em] text-white sm:text-base">
                  {step.label}
                </p>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
