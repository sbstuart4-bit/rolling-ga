import { ABOUT_PILOT_STATES } from "@/components/marketing/about/marketing-about-fixtures";
import { MktDisplayHeading, MktEyebrow, MktSectionShell } from "@/components/marketing/site";

export function AboutWhereWeAre() {
  return (
    <MktSectionShell tone="light" className="overflow-x-clip py-16 md:py-20 lg:py-24">
      <div className="max-w-3xl">
        <MktEyebrow className="text-mkt-purple">Where we are</MktEyebrow>
        <MktDisplayHeading
          as="h2"
          className="mt-4 text-[clamp(1.875rem,5vw,3.25rem)] text-[#0a0a0a]"
        >
          Built to test.
          <span className="block text-mkt-purple">Ready to pilot.</span>
        </MktDisplayHeading>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#52525b] sm:text-lg">
          Rolling GA has built a working product experience and a complete demo journey to explore
          the model. The next step is testing it in real live-music environments with artists and
          industry partners.
        </p>
      </div>

      <ol className="mt-12 space-y-0 border-t border-black/10 md:mt-16">
        {ABOUT_PILOT_STATES.map(({ title, body }, index) => (
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
