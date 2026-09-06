import { PILOT_STAKEHOLDERS } from "@/components/marketing/pilot/marketing-pilot-page-fixtures";
import { MktDisplayHeading, MktEyebrow, MktSectionShell } from "@/components/marketing/site";
import { cn } from "@/lib/utils";

const CARD_ACCENTS = [
  "mkt-partners-stakeholder-card--accent-left",
  "mkt-partners-stakeholder-card--accent-top",
  "mkt-partners-stakeholder-card--accent-left",
  "mkt-partners-stakeholder-card--accent-top",
] as const;

export function PilotStakeholders() {
  return (
    <MktSectionShell tone="dark" className="overflow-x-clip py-16 md:py-20 lg:py-24">
      <div className="grid gap-5 md:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-end lg:gap-16">
        <div className="max-w-xl">
          <MktEyebrow>Design partners</MktEyebrow>
          <MktDisplayHeading as="h2" className="mt-3 md:mt-4 text-[clamp(1.875rem,5vw,3.25rem)]">
            Built with the people
            <span className="block text-mkt-purple">who run the show.</span>
          </MktDisplayHeading>
        </div>
        <p className="max-w-md text-base leading-relaxed text-mkt-muted lg:pb-2 lg:text-right lg:text-lg">
          The strongest pilot will bring together the people who already own pieces of the
          live-merch experience.
        </p>
      </div>

      <ul className="mt-8 max-md:divide-y max-md:divide-white/10 max-md:border-y max-md:border-white/10 md:mt-12 md:grid md:grid-cols-2 md:gap-4 lg:mt-16 lg:gap-4">
        {PILOT_STAKEHOLDERS.map(({ title, body }, index) => (
          <li
            key={title}
            className={cn(
              "max-md:grid max-md:grid-cols-[auto_minmax(0,1fr)] max-md:gap-x-2.5 max-md:gap-y-1 max-md:py-3.5",
              "md:mkt-partners-stakeholder-card",
              CARD_ACCENTS[index],
            )}
          >
            <span className="max-md:row-span-2 max-md:pt-0.5 shrink-0 font-mono text-[0.625rem] font-semibold tracking-[0.2em] text-mkt-purple">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="max-md:col-start-2 max-md:text-[0.8125rem] max-md:leading-snug md:mt-2 md:text-sm font-semibold uppercase tracking-[0.1em] text-mkt-fg">
              {title}
            </h3>
            <p className="max-md:col-start-2 max-md:text-[0.8125rem] max-md:leading-snug md:mt-2.5 md:text-sm md:leading-relaxed text-mkt-muted md:mt-3">
              {body}
            </p>
          </li>
        ))}
      </ul>
    </MktSectionShell>
  );
}
