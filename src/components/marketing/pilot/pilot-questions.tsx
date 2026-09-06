import { PILOT_QUESTIONS } from "@/components/marketing/pilot/marketing-pilot-page-fixtures";
import { MktDisplayHeading, MktEyebrow, MktSectionShell } from "@/components/marketing/site";

export function PilotQuestions() {
  return (
    <MktSectionShell tone="light" className="overflow-x-clip py-16 md:py-20 lg:py-24">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
        <div className="max-w-xl">
          <MktEyebrow className="text-mkt-purple">The questions</MktEyebrow>
          <MktDisplayHeading
            as="h2"
            className="mt-4 text-[clamp(1.875rem,5vw,3.25rem)] text-[#0a0a0a]"
          >
            What should we learn
            <span className="block text-mkt-purple">from the night?</span>
          </MktDisplayHeading>
        </div>
        <p className="max-w-md text-base leading-relaxed text-[#52525b] lg:pb-2 lg:text-right lg:text-lg">
          The pilot should produce evidence — not just a demo.
        </p>
      </div>

      <ol className="mt-12 grid gap-6 md:mt-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {PILOT_QUESTIONS.map(({ title, body }, index) => (
          <li
            key={title}
            className="rounded-2xl border border-black/10 bg-white p-6 sm:p-7"
          >
            <span className="font-mono text-xs font-semibold tracking-[0.2em] text-mkt-purple">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-4 font-display text-base uppercase tracking-[0.04em] text-[#0a0a0a] sm:text-lg">
              {title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#52525b] sm:text-base">{body}</p>
          </li>
        ))}
      </ol>
    </MktSectionShell>
  );
}
