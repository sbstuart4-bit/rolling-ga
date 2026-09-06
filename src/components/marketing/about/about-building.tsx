import { ABOUT_CAPABILITIES } from "@/components/marketing/about/marketing-about-fixtures";
import { MktDisplayHeading, MktEyebrow, MktSectionShell } from "@/components/marketing/site";

export function AboutBuilding() {
  return (
    <MktSectionShell tone="dark" className="overflow-x-clip py-16 md:py-20 lg:py-24">
      <div className="max-w-3xl">
        <MktEyebrow>Rolling GA</MktEyebrow>
        <MktDisplayHeading as="h2" className="mt-4 text-[clamp(1.875rem,5vw,3.25rem)]">
          A relationship layer
          <span className="block text-mkt-purple">for live music.</span>
        </MktDisplayHeading>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-mkt-muted sm:text-lg">
          Rolling GA is being built to connect the fan-facing experience around a show — from
          discovery and show-night commerce to attendance history and continued artist connection.
        </p>
      </div>

      <dl className="mt-12 grid gap-x-10 gap-y-10 md:mt-16 md:grid-cols-2">
        {ABOUT_CAPABILITIES.map(({ title, body }, index) => (
          <div key={title} className="border-t border-white/10 pt-6">
            <dt className="flex items-baseline gap-3">
              <span className="font-mono text-xs font-semibold tracking-[0.2em] text-mkt-purple">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="font-display text-lg uppercase tracking-[0.04em] text-mkt-fg sm:text-xl">
                {title}
              </span>
            </dt>
            <dd className="mt-3 max-w-md text-sm leading-relaxed text-mkt-muted sm:text-base">
              {body}
            </dd>
          </div>
        ))}
      </dl>
    </MktSectionShell>
  );
}
