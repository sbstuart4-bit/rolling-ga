import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { EventRow } from "@/server/events/queries";
import type { ResolvedTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/**
 * Sticky shop masthead aligned with the Figma Event Shop / Tonight's Drop frame.
 * Assumes ArtistTakeover tokens are active on ancestors.
 */
export function EventShopHeader({
  event,
  theme,
  title,
  subtitle,
  backHref,
  backLabel = "← Back to the show",
  trailing,
  className,
}: {
  event: Pick<EventRow, "artistName" | "venueCity" | "tourName">;
  theme: ResolvedTheme;
  title: string;
  subtitle?: ReactNode;
  backHref: string;
  backLabel?: string;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 border-b border-artist-border bg-artist-bg/95 backdrop-blur-lg",
        className,
      )}
    >
      {theme.cityArtworkUrl && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <Image
            src={theme.cityArtworkUrl}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-[0.12]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-artist-bg/40 via-artist-bg/85 to-artist-bg" />
        </div>
      )}

      <div className="relative mx-auto max-w-lg space-y-2 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Link
              href={backHref}
              className="inline-block text-sm text-artist-muted transition-colors hover:text-artist-fg"
            >
              {backLabel}
            </Link>

            <div className="flex items-center gap-3">
              {theme.logoUrl && (
                <div className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-artist-border bg-artist-surface">
                  <Image src={theme.logoUrl} alt="" fill sizes="40px" className="object-contain p-1" />
                </div>
              )}
              <div className="min-w-0">
                <p className="eyebrow text-artist-muted">
                  {event.artistName} · {event.venueCity}
                </p>
                <h1 className="font-artist text-2xl leading-tight tracking-wide text-artist-fg md:text-[1.75rem]">
                  {title}
                </h1>
              </div>
            </div>

            {subtitle && (
              <div className="text-sm text-artist-muted text-balance">{subtitle}</div>
            )}
          </div>

          {trailing && <div className="shrink-0 pt-6">{trailing}</div>}
        </div>
      </div>
    </header>
  );
}
