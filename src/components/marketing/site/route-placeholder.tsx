import { MktDisplayHeading, MktEyebrow, MktSectionShell } from "@/components/marketing/site";
import { ExperienceNovaForm } from "@/components/marketing/experience-nova-form";

/**
 * Minimal route shell used until P2–P6 page builds land.
 * Shows approved nav/footer with honest pilot-stage copy only.
 */
export function MarketingRoutePlaceholder({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <MktSectionShell tone="dark" className="min-h-[50vh]">
      <MktEyebrow>{eyebrow}</MktEyebrow>
      <MktDisplayHeading as="h1" className="mt-6 max-w-3xl">
        {title}
      </MktDisplayHeading>
      <p className="mkt-body mt-8 max-w-2xl text-base text-mkt-muted">{description}</p>
      <ExperienceNovaForm className="mt-12" secondary={{ href: "/pilot", label: "Talk to us about a pilot" }} />
    </MktSectionShell>
  );
}
