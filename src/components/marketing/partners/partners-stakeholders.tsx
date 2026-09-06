import { PARTNERS_STAKEHOLDER_CATEGORIES } from "@/components/marketing/partners/marketing-partners-fixtures";
import { MktDisplayHeading, MktEyebrow, MktSectionShell } from "@/components/marketing/site";
import { cn } from "@/lib/utils";

const CARD_ACCENTS = [
  "mkt-partners-stakeholder-card--accent-left",
  "mkt-partners-stakeholder-card--accent-top",
  "mkt-partners-stakeholder-card--accent-left",
  "mkt-partners-stakeholder-card--accent-top",
  "mkt-partners-stakeholder-card--accent-left",
] as const;

export function PartnersStakeholders() {
  return (
    <MktSectionShell tone="dark" className="overflow-x-clip py-10 md:py-20 lg:py-24">
      <div className="grid gap-5 md:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-end lg:gap-16">
        <div className="max-w-xl">
          <MktEyebrow>Built to work together</MktEyebrow>
          <MktDisplayHeading as="h2" className="mt-3 md:mt-4 text-[clamp(1.875rem,5vw,3.25rem)]">
            Different roles.
            <span className="block text-mkt-purple">One better fan experience.</span>
          </MktDisplayHeading>
        </div>
        <p className="max-w-md text-base leading-relaxed text-mkt-muted lg:pb-2 lg:text-right lg:text-lg">
          Where a partner could fit — and what we want to test together. These are pilot
          relationships to explore, not existing commercial partnerships.
        </p>
      </div>

      <ul className="mkt-partners-stakeholder-grid mt-8 md:mt-12 lg:mt-16">
        {PARTNERS_STAKEHOLDER_CATEGORIES.map(({ icon: Icon, title, body }, index) => (
          <li
            key={title}
            className={cn("mkt-partners-stakeholder-card", CARD_ACCENTS[index])}
          >
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-mkt-purple/35 bg-mkt-purple/10 text-mkt-fg md:size-10">
                <Icon className="size-4" strokeWidth={1.5} aria-hidden />
              </span>
              <div className="min-w-0 pt-0.5">
                <span className="font-mono text-[0.625rem] font-semibold tracking-[0.2em] text-mkt-purple">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-1 text-sm font-semibold uppercase leading-snug tracking-[0.1em] text-mkt-fg">
                  {title}
                </h3>
              </div>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-mkt-muted md:mt-3">{body}</p>
          </li>
        ))}
      </ul>
    </MktSectionShell>
  );
}
