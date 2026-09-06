import { HOW_IT_WORKS_RELATIONSHIP_STAGES } from "@/components/marketing/how-it-works/marketing-how-it-works-fixtures";
import {
  MktDisplayHeading,
  MktPhoneFrame,
  MktSectionShell,
} from "@/components/marketing/site";

/**
 * Section 2 — show → commerce → identity → continuing relationship.
 */
export function HowItWorksDifference() {
  return (
    <MktSectionShell tone="light" className="overflow-x-clip py-16 md:py-20 lg:py-24">
      <div className="max-w-3xl">
        <MktDisplayHeading
          as="h2"
          className="text-[clamp(1.875rem,5vw,3.25rem)] text-[#0a0a0a]"
          purple="The end."
        >
          The purchase isn&rsquo;t
        </MktDisplayHeading>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-[#52525b] sm:text-lg">
          The live moment becomes part of the fan&rsquo;s history with the artist.
        </p>
      </div>

      <ol className="mt-12 grid grid-cols-1 gap-20 md:mt-16 md:grid-cols-2 md:gap-x-10 md:gap-y-16">
        {HOW_IT_WORKS_RELATIONSHIP_STAGES.map((stage, index) => (
          <li
            key={stage.label}
            className="flex w-full min-w-0 flex-col border-b border-black/10 pb-16 last:border-b-0 last:pb-0 md:border-b-0 md:pb-0"
          >
            <div className="md:min-h-[7rem]">
              <p className="mkt-eyebrow text-mkt-purple">{stage.label}</p>
              <p className="mt-3 max-w-sm text-base leading-relaxed text-[#52525b] sm:text-lg">
                {stage.title}
              </p>
            </div>

            <MktPhoneFrame
              align="start"
              loading="eager"
              screenshot={stage.screenshot}
              screenshotAlt={stage.alt}
              className="mkt-how-it-works-phone mt-8 md:mt-10"
            />

            {index < HOW_IT_WORKS_RELATIONSHIP_STAGES.length - 1 ? (
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
