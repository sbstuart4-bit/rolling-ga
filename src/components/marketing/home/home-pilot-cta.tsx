import { ExperienceNovaForm } from "@/components/marketing/experience-nova-form";
import { MktDisplayHeading, MktSectionShell } from "@/components/marketing/site";

/**
 * Approved homepage pilot CTA — user-specified copy for P3.
 */
export function HomePilotCta() {
  return (
    <MktSectionShell tone="dark" contained={false} className="overflow-x-clip py-0">
      <div className="relative isolate">
        <div className="absolute inset-0 bg-mkt-bg" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a28] via-mkt-bg to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,rgba(123,60,255,0.35),transparent_55%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-mkt-bg via-black/50 to-black/30" />
        </div>

        <div className="relative mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 md:py-28 lg:py-32">
          <MktDisplayHeading as="h2" className="text-[clamp(1.75rem,5.5vw,3.25rem)]">
            Bring Rolling GA
            <span className="block text-mkt-purple">to a real show.</span>
          </MktDisplayHeading>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-mkt-muted sm:text-lg">
            We&rsquo;re looking for artists and industry partners to pilot Rolling GA and measure
            what happens when merch, attendance and the fan relationship become one experience.
          </p>

          <ExperienceNovaForm
            size="large"
            demoLabel="Explore the Demo"
            secondary={{ href: "/pilot#conversation", label: "Pilot With Us", outline: true }}
            className="mt-10 justify-center"
          />
        </div>
      </div>
    </MktSectionShell>
  );
}
