import { HOME_HOW_IT_WORKS_STAGES } from "@/components/marketing/home/marketing-home-fixtures";
import {
  MktDisplayHeading,
  MktEyebrow,
  MktPhoneFrame,
  MktSectionShell,
} from "@/components/marketing/site";

/**
 * Approved homepage how-it-works band — docs/website-reference/homepage-approved.png
 *
 * Four independent journey units (Discover → Unlock → Shop → Receive).
 * Mobile: single-column vertical stack. Tablet: 2×2. Desktop (1440+): four columns.
 * Layout rules live in globals.css (.mkt-how-it-works-*) for reliable breakpoints.
 */
export function HomeHowItWorks() {
  return (
    <MktSectionShell tone="dark" id="how-it-works" className="overflow-x-clip py-16 md:py-20 lg:py-24">
      <div className="max-w-3xl">
        <MktEyebrow>How it works</MktEyebrow>
        <MktDisplayHeading as="h2" className="mt-4 text-[clamp(1.875rem,5vw,3.5rem)]">
          A better way to buy concert merch.
        </MktDisplayHeading>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-mkt-muted sm:text-lg">
          The right merch. At the right time. Without the line.
        </p>
      </div>

      <ol className="mkt-how-it-works-grid mt-12 md:mt-16 min-[1440px]:mt-20">
        {HOME_HOW_IT_WORKS_STAGES.map((stage, index) => (
          <li key={stage.title} className="mkt-how-it-works-unit">
            <div className="mkt-how-it-works-copy">
              <span className="mb-4 flex size-12 items-center justify-center rounded-full border border-white/20 text-mkt-fg">
                <stage.icon className="size-5" strokeWidth={1.5} aria-hidden />
              </span>
              <h3 className="font-display text-sm uppercase tracking-[0.1em] text-mkt-fg sm:text-base">
                {stage.title}
              </h3>
              <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-mkt-muted sm:max-w-xs sm:text-base">
                {stage.body}
              </p>
            </div>

            <MktPhoneFrame
              align="start"
              loading="eager"
              screenshot={stage.screenshot}
              screenshotAlt={stage.alt}
              className="mkt-how-it-works-phone"
            />

            {index < HOME_HOW_IT_WORKS_STAGES.length - 1 ? (
              <span className="mkt-how-it-works-separator" aria-hidden>
                ↓
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </MktSectionShell>
  );
}
