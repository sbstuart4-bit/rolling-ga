import { PILOT_PARTNER_NEEDS } from "@/components/marketing/pilot/marketing-pilot-page-fixtures";
import { MktDisplayHeading, MktEyebrow, MktSectionShell } from "@/components/marketing/site";

export function PilotNeeds() {
  return (
    <MktSectionShell tone="light" className="overflow-x-clip py-16 max-md:pt-20 md:py-20 lg:py-24">
      <div className="max-w-3xl">
        <MktEyebrow className="text-mkt-purple">From you</MktEyebrow>
        <MktDisplayHeading
          as="h2"
          className="mt-4 text-[clamp(1.875rem,5vw,3.25rem)] text-[#0a0a0a]"
        >
          A real show
          <span className="block text-mkt-purple">and a willing team.</span>
        </MktDisplayHeading>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-[#52525b] sm:text-lg">
          We can start with one show.
        </p>
      </div>

      <ol className="mt-12 space-y-0 border-t border-black/10 md:mt-16">
        {PILOT_PARTNER_NEEDS.map(({ title, body }, index) => (
          <li
            key={title}
            className="border-b border-black/10 py-8 last:border-b-0 md:py-10"
          >
            <span className="font-mono text-xs font-semibold tracking-[0.2em] text-mkt-purple">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-3 font-display text-xl uppercase tracking-[0.04em] text-[#0a0a0a] sm:text-2xl">
              {title}
            </h3>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#52525b]">{body}</p>
          </li>
        ))}
      </ol>
    </MktSectionShell>
  );
}
