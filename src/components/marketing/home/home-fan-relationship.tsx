import { Fragment } from "react";
import {
  HOME_RELATIONSHIP_RAIL,
  MARISOL_REYES_CREDENTIAL_SCREENSHOT,
  MARISOL_REYES_MY_SHOWS_SCREENSHOT,
} from "@/components/marketing/home/marketing-home-fixtures";
import { MktEyebrow, MktPhoneFrame, MktSectionShell } from "@/components/marketing/site";

/**
 * Homepage section 5 — after the show; Marisol credential + My Shows with relationship rail.
 */
export function HomeFanRelationship() {
  return (
    <MktSectionShell
      tone="light"
      className="overflow-x-clip bg-[#f3f3f4] py-16 md:py-20 lg:py-24"
    >
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 xl:gap-16">
        <div className="max-w-xl lg:max-w-none">
          <MktEyebrow className="text-mkt-purple">After the show</MktEyebrow>

          <h2 className="mt-4 font-display text-[clamp(2rem,5.5vw,3.75rem)] uppercase leading-[0.92] tracking-[0.02em] text-[#0a0a0a]">
            The purchase isn&apos;t the end.
            <span className="block">It&apos;s the beginning.</span>
          </h2>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-[#52525b] sm:text-lg">
            The show creates the connection. Rolling GA carries it forward.
          </p>
        </div>

        <div className="relative mx-auto flex min-h-[22rem] w-full max-w-[22rem] items-center justify-center sm:max-w-[26rem] lg:mx-0 lg:ml-auto lg:max-w-none lg:justify-end">
          <MktPhoneFrame
            loading="eager"
            screenshot={MARISOL_REYES_CREDENTIAL_SCREENSHOT}
            screenshotAlt="Marisol Reyes I Was There digital credential in Rolling GA"
            className="absolute left-0 top-6 z-10 max-w-[58%] -rotate-6 sm:top-4 lg:left-4 lg:max-w-[240px]"
          />
          <MktPhoneFrame
            loading="eager"
            screenshot={MARISOL_REYES_MY_SHOWS_SCREENSHOT}
            screenshotAlt="My Shows in Rolling GA — Marisol Reyes Brooklyn credential and show history"
            className="relative z-20 ml-auto max-w-[62%] rotate-3 drop-shadow-[0_24px_60px_rgba(0,0,0,0.18)] sm:max-w-[68%] lg:max-w-[280px]"
          />
        </div>
      </div>

      <div className="mt-16 grid grid-cols-2 gap-x-3 gap-y-10 sm:mt-20 sm:flex sm:flex-wrap sm:items-end sm:justify-center sm:gap-x-3 sm:gap-y-8 lg:gap-x-5">
        {HOME_RELATIONSHIP_RAIL.map((step, index) => (
          <Fragment key={step.label}>
            {index > 0 ? (
              <span
                aria-hidden
                className="hidden pb-10 text-2xl text-mkt-purple sm:inline lg:pb-11 lg:text-3xl"
              >
                →
              </span>
            ) : null}
            <div className="flex flex-col items-center text-center sm:w-[9rem] lg:w-[10rem]">
              <span className="flex size-16 items-center justify-center rounded-full border-2 border-[#0a0a0a]/15 text-[#0a0a0a] sm:size-[4.75rem] lg:size-20">
                <step.icon className="size-7 lg:size-8" strokeWidth={1.5} aria-hidden />
              </span>
              <p className="mt-4 text-sm font-semibold uppercase leading-snug tracking-[0.14em] text-[#0a0a0a] sm:text-base">
                {step.label}
              </p>
            </div>
          </Fragment>
        ))}
      </div>
    </MktSectionShell>
  );
}
