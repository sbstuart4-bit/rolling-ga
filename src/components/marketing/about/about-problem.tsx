import { ABOUT_PROBLEM_IDEAS } from "@/components/marketing/about/marketing-about-fixtures";
import { MktDisplayHeading, MktEyebrow, MktSectionShell } from "@/components/marketing/site";

export function AboutProblem() {
  return (
    <MktSectionShell tone="light" className="overflow-x-clip py-16 md:py-20 lg:py-24">
      <div className="max-w-3xl">
        <MktEyebrow className="text-mkt-purple">What gets lost</MktEyebrow>
        <MktDisplayHeading
          as="h2"
          className="mt-4 text-[clamp(1.875rem,5vw,3.5rem)] text-[#0a0a0a]"
        >
          A great night.
          <span className="block text-mkt-purple">Then almost nothing.</span>
        </MktDisplayHeading>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#52525b] sm:text-lg">
          A fan can spend hours inside an artist&rsquo;s world — seeing the show, buying merch,
          sharing the moment — and still leave with little lasting connection between that night and
          what happens next.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#52525b]/90 sm:text-base">
          This is the opportunity Rolling GA is exploring — not a claim that every existing platform
          has these problems.
        </p>
      </div>

      <ol className="mt-12 space-y-0 border-t border-black/10 md:mt-16">
        {ABOUT_PROBLEM_IDEAS.map(({ title, body }, index) => (
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
