import { ABOUT_WHY_MERCH_IDEAS } from "@/components/marketing/about/marketing-about-fixtures";
import { MktDisplayHeading, MktEyebrow, MktSectionShell } from "@/components/marketing/site";

export function AboutWhyMerch() {
  return (
    <MktSectionShell tone="light" className="overflow-x-clip py-16 md:py-20 lg:py-24">
      <div className="max-w-3xl">
        <MktEyebrow className="text-mkt-purple">Why start with merch?</MktEyebrow>
        <MktDisplayHeading
          as="h2"
          className="mt-4 text-[clamp(1.875rem,5vw,3.25rem)] text-[#0a0a0a]"
        >
          Because fans already want
          <span className="block text-mkt-purple">something from the night.</span>
        </MktDisplayHeading>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#52525b] sm:text-lg">
          Merch is one of the most natural expressions of the connection between a fan, an artist, and
          a show. It gives Rolling GA a practical place to begin — solving an immediate fan
          experience while creating the foundation for something longer.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#52525b]/90 sm:text-base">
          Merch is the wedge into the relationship — not the final business model.
        </p>
      </div>

      <ol className="mt-12 space-y-10 md:mt-16 lg:grid lg:grid-cols-3 lg:gap-10 lg:space-y-0">
        {ABOUT_WHY_MERCH_IDEAS.map(({ title, body }, index) => (
          <li key={title}>
            <span className="font-mono text-xs font-semibold tracking-[0.2em] text-mkt-purple">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-3 font-display text-lg uppercase tracking-[0.04em] text-[#0a0a0a]">
              {title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#52525b] sm:text-base">{body}</p>
          </li>
        ))}
      </ol>
    </MktSectionShell>
  );
}
