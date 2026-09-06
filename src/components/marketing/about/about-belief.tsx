import { ABOUT_THESIS_STEPS } from "@/components/marketing/about/marketing-about-fixtures";
import { MktDisplayHeading, MktEyebrow, MktSectionShell } from "@/components/marketing/site";

export function AboutBelief() {
  return (
    <MktSectionShell tone="dark" className="overflow-x-clip py-16 md:py-20 lg:py-24">
      <div className="max-w-3xl">
        <MktEyebrow>What we believe</MktEyebrow>
        <MktDisplayHeading as="h2" className="mt-4 text-[clamp(1.875rem,5vw,3.5rem)]">
          Being there should
          <span className="block text-mkt-purple">mean something.</span>
        </MktDisplayHeading>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-mkt-muted sm:text-lg">
          Rolling GA starts with a simple idea: the live moment can create context that makes the
          artist-fan relationship more meaningful afterward.
        </p>
      </div>

      <ol className="mkt-about-thesis-grid mt-12 md:mt-16">
        {ABOUT_THESIS_STEPS.map((item, index) => (
          <li key={item.step} className="mkt-about-thesis-step">
            <span className="font-mono text-xs font-semibold tracking-[0.2em] text-mkt-purple">
              {item.step}
            </span>
            <h3 className="mt-3 font-display text-lg uppercase tracking-[0.06em] text-mkt-fg sm:text-xl">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-mkt-muted sm:text-base">{item.body}</p>
            {index < ABOUT_THESIS_STEPS.length - 1 ? (
              <span className="mkt-about-thesis-separator" aria-hidden>
                ↓
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </MktSectionShell>
  );
}
