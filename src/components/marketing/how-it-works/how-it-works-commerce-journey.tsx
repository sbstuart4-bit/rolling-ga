import { HOW_IT_WORKS_COMMERCE_STAGES } from "@/components/marketing/how-it-works/marketing-how-it-works-fixtures";
import {
  MktDisplayHeading,
  MktEyebrow,
  MktPhoneFrame,
  MktSectionShell,
} from "@/components/marketing/site";

/**
 * Section 1 — commerce journey. Reuses approved homepage responsive grid utilities.
 */
export function HowItWorksCommerceJourney() {
  return (
    <MktSectionShell tone="dark" id="at-the-show" className="overflow-x-clip py-16 md:py-20 lg:py-24">
      <div className="max-w-3xl">
        <MktEyebrow>At the show</MktEyebrow>
        <MktDisplayHeading as="h2" className="mt-4 text-[clamp(1.875rem,5vw,3.5rem)]">
          From discovery to delivery.
        </MktDisplayHeading>
      </div>

      <ol className="mkt-how-it-works-grid mt-12 md:mt-16 min-[1440px]:mt-20">
        {HOW_IT_WORKS_COMMERCE_STAGES.map((stage, index) => (
          <li key={stage.title} className="mkt-how-it-works-unit">
            <div className="mkt-how-it-works-copy">
              <span className="mb-4 block font-mono text-xs font-semibold tracking-[0.2em] text-mkt-purple">
                {stage.step}
              </span>
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

            {index < HOW_IT_WORKS_COMMERCE_STAGES.length - 1 ? (
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
