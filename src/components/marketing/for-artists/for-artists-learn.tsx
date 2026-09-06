import { FOR_ARTISTS_LEARN_QUESTIONS } from "@/components/marketing/for-artists/marketing-for-artists-fixtures";
import { MktDisplayHeading, MktEyebrow, MktSectionShell } from "@/components/marketing/site";

/**
 * Section 4 — editorial pilot-learning frame. No fabricated Studio dashboard.
 */
export function ForArtistsLearn() {
  return (
    <MktSectionShell tone="light" className="overflow-x-clip py-16 md:py-20 lg:py-24">
      <div className="max-w-3xl">
        <MktEyebrow className="text-mkt-purple">Built to learn</MktEyebrow>
        <MktDisplayHeading
          as="h2"
          className="mt-4 text-[clamp(1.875rem,5vw,3.25rem)] text-[#0a0a0a]"
        >
          One show can tell
          <span className="block text-mkt-purple">you more.</span>
        </MktDisplayHeading>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-[#52525b] sm:text-lg">
          A Rolling GA pilot is designed to investigate — not to claim results that haven&rsquo;t
          been demonstrated yet.
        </p>
      </div>

      <ol className="mt-12 grid gap-6 md:mt-16 lg:grid-cols-2 lg:gap-8">
        {FOR_ARTISTS_LEARN_QUESTIONS.map(({ title, body }, index) => (
          <li
            key={title}
            className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8"
          >
            <span className="font-mono text-xs font-semibold tracking-[0.2em] text-mkt-purple">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-4 font-display text-lg uppercase tracking-[0.04em] text-[#0a0a0a] sm:text-xl">
              {title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#52525b] sm:text-base">{body}</p>
          </li>
        ))}
      </ol>
    </MktSectionShell>
  );
}
