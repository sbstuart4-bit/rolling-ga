import { ExperienceNovaButton } from "@/components/marketing/experience-nova-cta";
import { experienceNovaKestrelAction } from "@/server/marketing/demo-entry";
import { MktOutlineButton } from "@/components/marketing/site";
import { cn } from "@/lib/utils";

export function ExperienceNovaForm({
  size = "default",
  demoLabel,
  secondary,
  className,
}: {
  size?: "default" | "large";
  demoLabel?: string;
  secondary?: { href: string; label: string; outline?: boolean };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-5", className)}>
      <form action={experienceNovaKestrelAction} className="w-full sm:w-auto">
        <ExperienceNovaButton size={size} label={demoLabel} className="w-full sm:w-auto" />
      </form>
      {secondary ? (
        secondary.outline ? (
          <MktOutlineButton href={secondary.href} className="w-full justify-center sm:w-auto">
            {secondary.label} <span aria-hidden>&rarr;</span>
          </MktOutlineButton>
        ) : (
          <a
            href={secondary.href}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-mkt-muted underline-offset-4 hover:text-mkt-fg hover:underline"
          >
            {secondary.label}
          </a>
        )
      ) : null}
    </div>
  );
}
