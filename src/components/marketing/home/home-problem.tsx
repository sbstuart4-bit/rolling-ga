import { HOME_PROBLEM_ITEMS } from "@/components/marketing/home/marketing-home-fixtures";
import { MktDisplayHeading, MktEyebrow, MktPhotoPlaceholder, MktSectionShell } from "@/components/marketing/site";

/**
 * Approved homepage problem band — docs/website-reference/homepage-approved.png
 */
export function HomeProblem() {
  return (
    <MktSectionShell tone="light" className="py-16 md:py-20 lg:py-24">
      <div className="max-w-3xl">
        <MktEyebrow className="text-mkt-purple">The problem</MktEyebrow>
        <MktDisplayHeading
          as="h2"
          className="mt-4 text-[clamp(1.875rem,5vw,3.5rem)] text-[#0a0a0a]"
        >
          Great shows. Terrible merch lines.
        </MktDisplayHeading>
      </div>

      <ul className="mt-12 grid gap-8 md:mt-14 md:grid-cols-3 md:gap-6 lg:gap-8">
        {HOME_PROBLEM_ITEMS.map((item) => (
          <li key={item.title} className="flex flex-col">
            <MktPhotoPlaceholder
              label={item.photoLabel}
              aspect="video"
              className="w-full rounded-2xl"
            />
            <h3 className="mt-5 font-display text-base uppercase tracking-[0.08em] text-[#0a0a0a] sm:text-lg">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#52525b] sm:text-base">{item.body}</p>
          </li>
        ))}
      </ul>
    </MktSectionShell>
  );
}
