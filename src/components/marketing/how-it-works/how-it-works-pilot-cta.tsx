import { ExperienceNovaForm } from "@/components/marketing/experience-nova-form";
import { MktDisplayHeading, MktEyebrow, MktOutlineButton, MktSectionShell } from "@/components/marketing/site";

export function HowItWorksPilotCta() {
  return (
    <MktSectionShell tone="dark" contained={false} className="overflow-x-clip py-0">
      <div className="relative isolate">
        <div className="absolute inset-0 bg-mkt-bg" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a28] via-mkt-bg to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,rgba(123,60,255,0.35),transparent_55%)]" />
        </div>

        <div className="relative mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 md:py-28 lg:py-32">
          <MktEyebrow className="text-center">Pilot with us</MktEyebrow>

          <MktDisplayHeading as="h2" className="mt-4 text-[clamp(1.75rem,5.5vw,3.25rem)]">
            Let&rsquo;s test it
            <span className="block text-mkt-purple">at a real show.</span>
          </MktDisplayHeading>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-mkt-muted sm:text-lg">
            We&rsquo;re looking for artists and live-music partners to pilot Rolling GA and help
            shape what comes next.
          </p>

          <div className="mt-10 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center sm:justify-center">
            <MktOutlineButton href="/pilot#conversation" className="w-full justify-center sm:w-auto">
              Pilot With Us <span aria-hidden>&rarr;</span>
            </MktOutlineButton>
            <ExperienceNovaForm demoLabel="Experience the Demo" className="justify-center" />
          </div>
        </div>
      </div>
    </MktSectionShell>
  );
}
