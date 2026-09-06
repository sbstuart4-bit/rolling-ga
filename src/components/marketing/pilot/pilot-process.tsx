import { PILOT_PROCESS_STEPS } from "@/components/marketing/pilot/marketing-pilot-page-fixtures";
import { MktDisplayHeading, MktEyebrow, MktSectionShell } from "@/components/marketing/site";

export function PilotProcess() {
  return (
    <MktSectionShell tone="dark" className="overflow-x-clip py-16 md:py-20 lg:py-24">
      <div className="max-w-3xl">
        <MktEyebrow>Start small</MktEyebrow>
        <MktDisplayHeading as="h2" className="mt-4 text-[clamp(1.875rem,5vw,3.25rem)]">
          One show.
          <span className="block text-mkt-purple">One controlled test.</span>
        </MktDisplayHeading>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-mkt-muted sm:text-lg">
          A Rolling GA pilot is designed to test the experience in a contained live environment
          before anyone commits to a broader rollout.
        </p>
      </div>

      <ol className="mkt-about-thesis-grid mt-12 md:mt-16">
        {PILOT_PROCESS_STEPS.map(({ step, title, body }, index) => (
          <li key={step} className="mkt-about-thesis-step">
            <span className="font-mono text-xs font-semibold tracking-[0.2em] text-mkt-purple">
              {step}
            </span>
            <h3 className="mt-3 font-display text-xl uppercase tracking-[0.04em] text-mkt-fg sm:text-2xl">
              {title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-mkt-muted sm:text-base">{body}</p>
            {index < PILOT_PROCESS_STEPS.length - 1 ? (
              <span className="mkt-about-thesis-separator" aria-hidden>
                ↓
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </MktSectionShell>
  );
}
