import Link from "next/link";
import { ExperienceDegensButton } from "@/components/marketing/experience-degens-cta";
import { experienceDegensDetroitAction } from "@/server/marketing/demo-entry";
import { cn } from "@/lib/utils";

/**
 * The site's primary call to action, with an optional quiet link beside it.
 *
 * Progressive enhancement matters here: this is a real form post, so it works
 * without client JavaScript. If the demo gate is not satisfied the action
 * redirects to the demo board, which is why no separate fallback label is
 * rendered — the same button always leads somewhere useful.
 */
export function ExperienceDegensForm({
  size = "default",
  secondary,
  className,
}: {
  size?: "default" | "large";
  secondary?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-7", className)}>
      <form action={experienceDegensDetroitAction}>
        <ExperienceDegensButton size={size} />
      </form>
      {secondary ? (
        <Link
          href={secondary.href}
          className="mk-kicker border-b border-world-rule pb-1 text-world-muted transition-colors hover:border-world-fg hover:text-world-fg"
        >
          {secondary.label}
        </Link>
      ) : null}
    </div>
  );
}
