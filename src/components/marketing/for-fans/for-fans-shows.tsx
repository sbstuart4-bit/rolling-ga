import { FOR_FANS_SHOW_SCREENS } from "@/components/marketing/for-fans/marketing-for-fans-fixtures";
import {
  MktDisplayHeading,
  MktEyebrow,
  MktPhoneFrame,
  MktSectionShell,
} from "@/components/marketing/site";

export function ForFansShows() {
  return (
    <MktSectionShell tone="light" className="overflow-x-clip py-16 md:py-20 lg:py-24">
      <div className="max-w-3xl">
        <MktEyebrow className="text-mkt-purple">More than merch</MktEyebrow>
        <MktDisplayHeading
          as="h2"
          className="text-[clamp(1.875rem,5vw,3.25rem)] text-[#0a0a0a]"
        >
          Your shows.
          <span className="block text-mkt-purple">Your history.</span>
        </MktDisplayHeading>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-[#52525b] sm:text-lg">
          The things you buy matter. The nights you were there can matter even more. Rolling GA is
          designed to give fans a place to keep the shows they&rsquo;ve been part of.
        </p>
      </div>

      <ol className="mt-12 grid grid-cols-1 gap-16 md:mt-16 md:grid-cols-2 md:gap-x-10 md:gap-y-0 lg:mt-20">
        {FOR_FANS_SHOW_SCREENS.map((screen, index) => (
          <li
            key={screen.label}
            className="flex w-full min-w-0 flex-col border-b border-black/10 pb-16 last:border-b-0 last:pb-0 md:border-b-0 md:pb-0"
          >
            <p className="mkt-eyebrow text-mkt-purple">{screen.label}</p>
            <MktPhoneFrame
              align="start"
              loading="eager"
              screenshot={screen.screenshot}
              screenshotAlt={screen.alt}
              className="mkt-how-it-works-phone mt-8 md:mt-10"
            />

            {index < FOR_FANS_SHOW_SCREENS.length - 1 ? (
              <span
                className="mt-8 block text-center text-[#0a0a0a]/25 md:hidden"
                aria-hidden
              >
                ↓
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </MktSectionShell>
  );
}
