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
              <span className="mb-4 block font-mono text-sm font-semibold tracking-[0.2em] text-mkt-purple md:text-base">
                {stage.step}
              </span>
              <span className="mb-5 flex size-14 items-center justify-center rounded-full border-2 border-white/20 text-mkt-fg md:size-16">
                <stage.icon className="size-6 md:size-7" strokeWidth={1.5} aria-hidden />
              </span>
              <h3 className="font-display text-base uppercase tracking-[0.1em] text-mkt-fg md:text-lg lg:text-xl">
                {stage.title}
              </h3>
              <p className="mt-3 max-w-[20rem] text-base leading-relaxed text-mkt-muted md:max-w-none md:text-lg">
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
