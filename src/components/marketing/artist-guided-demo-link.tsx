import Link from "next/link";
import { cn } from "@/lib/utils";
import { buildArtistMarketingEnterGuidedHref } from "@/server/marketing/demo-entry-hrefs";

export function ArtistGuidedDemoLink({
  size = "default",
  label = "Experience the Demo",
  className,
}: {
  size?: "default" | "large";
  label?: string;
  className?: string;
}) {
  const href = buildArtistMarketingEnterGuidedHref();

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-full bg-mkt-purple font-semibold uppercase tracking-[0.12em] text-mkt-purple-fg transition-opacity hover:opacity-90",
        size === "large" ? "px-8 py-4 text-sm" : "px-7 py-3.5 text-xs",
        className,
      )}
    >
      {label}
      <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
        &rarr;
      </span>
    </Link>
  );
}
