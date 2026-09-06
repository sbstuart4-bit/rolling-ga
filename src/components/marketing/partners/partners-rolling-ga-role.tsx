import { PARTNERS_ROLLING_GA_ROLE } from "@/components/marketing/partners/marketing-partners-fixtures";
import { MktDisplayHeading, MktEyebrow, MktSectionShell } from "@/components/marketing/site";

export function PartnersRollingGaRole() {
  return (
    <MktSectionShell tone="light" className="overflow-x-clip py-16 md:py-20 lg:py-24">
      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
        <div className="max-w-xl">
          <MktEyebrow className="text-mkt-purple">Our role</MktEyebrow>
          <MktDisplayHeading
            as="h2"
            className="mt-4 text-[clamp(1.875rem,5vw,3.25rem)] text-[#0a0a0a]"
          >
            The fan-facing experience.
            <span className="block text-mkt-purple">The connection layer.</span>
          </MktDisplayHeading>
          <p className="mt-5 text-base leading-relaxed text-[#52525b] sm:text-lg">
            Rolling GA connects these pieces around the fan experience. It does not replace venue
            operations, merch manufacturing, logistics providers, promoters, labels, or artist
            management.
          </p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {PARTNERS_ROLLING_GA_ROLE.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-start gap-3 rounded-xl border border-black/10 bg-white p-4 sm:p-5"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-black/15 text-[#0a0a0a]">
                <Icon className="size-4" strokeWidth={1.5} aria-hidden />
              </span>
              <p className="pt-2 text-sm font-semibold uppercase leading-snug tracking-[0.08em] text-[#0a0a0a]">
                {label}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </MktSectionShell>
  );
}
