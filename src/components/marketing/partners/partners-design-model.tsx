import { PARTNERS_DESIGN_QUESTIONS } from "@/components/marketing/partners/marketing-partners-fixtures";
import { MktDisplayHeading, MktEyebrow, MktSectionShell } from "@/components/marketing/site";

export function PartnersDesignModel() {
  return (
    <MktSectionShell tone="dark" className="overflow-x-clip py-16 md:py-20 lg:py-24">
      <div className="max-w-3xl">
        <MktEyebrow>Design the model together</MktEyebrow>
        <MktDisplayHeading as="h2" className="mt-4 text-[clamp(1.875rem,5vw,3.25rem)]">
          The details matter.
        </MktDisplayHeading>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-mkt-muted sm:text-lg">
          A real pilot should help establish how the operating and economic model works for everyone
          involved — framed as design questions, not unsolved weaknesses.
        </p>
      </div>

      <ol className="mt-12 grid gap-6 md:mt-16 lg:grid-cols-2 lg:gap-8">
        {PARTNERS_DESIGN_QUESTIONS.map(({ title, body }, index) => (
          <li
            key={title}
            className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-6 sm:p-8"
          >
            <span className="font-mono text-xs font-semibold tracking-[0.2em] text-mkt-purple">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.1em] text-mkt-fg sm:text-base">
              {title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-mkt-muted sm:text-base">{body}</p>
          </li>
        ))}
      </ol>

      <p className="mt-12 max-w-2xl text-base leading-relaxed text-mkt-muted sm:text-lg">
        A pilot should do more than prove the interface works. It should prove the operating and
        economic model works for everyone involved.
      </p>
    </MktSectionShell>
  );
}
