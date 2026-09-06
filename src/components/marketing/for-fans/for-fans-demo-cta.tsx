import { FOR_FANS_JOURNEY_STEPS } from "@/components/marketing/for-fans/marketing-for-fans-fixtures";
import { ExperienceNovaForm } from "@/components/marketing/experience-nova-form";
import { MktDisplayHeading, MktEyebrow, MktSectionShell } from "@/components/marketing/site";

export function ForFansDemoCta() {
  return (
    <MktSectionShell tone="dark" contained={false} className="overflow-x-clip py-0">
      <div className="relative isolate">
        <div className="absolute inset-0 bg-mkt-bg" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a28] via-mkt-bg to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,rgba(123,60,255,0.35),transparent_55%)]" />
        </div>

        <div className="relative mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 md:py-28 lg:py-32">
          <MktEyebrow className="text-center">Experience it</MktEyebrow>

          <MktDisplayHeading as="h2" className="mt-4 text-[clamp(1.75rem,5.5vw,3.25rem)]">
            The show is
            <span className="block text-mkt-purple">just the beginning.</span>
          </MktDisplayHeading>

          <ol className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-2 gap-y-2 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-mkt-muted sm:text-[0.6875rem]">
            {FOR_FANS_JOURNEY_STEPS.map((step, index) => (
              <li key={step} className="flex items-center gap-2">
                <span className="text-mkt-purple">{step}</span>
                {index < FOR_FANS_JOURNEY_STEPS.length - 1 ? (
                  <span aria-hidden className="text-white/25">
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-mkt-muted sm:text-lg">
            Walk through the Nova Kestrel demo — a fictional artist experience — and see what the
            fan journey feels like from discover to reconnect.
          </p>

          <ExperienceNovaForm
            size="large"
            demoLabel="Experience the Nova Kestrel Demo"
            secondary={{ href: "/how-it-works", label: "See how it works", outline: true }}
            className="mt-10 justify-center"
          />
        </div>
      </div>
    </MktSectionShell>
  );
}
