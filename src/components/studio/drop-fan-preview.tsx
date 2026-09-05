"use client";

import { ArtistTakeover } from "@/components/artist/artist-takeover";
import { formatMoney } from "@/lib/format";
import type { ResolvedTheme } from "@/lib/theme";
import { heroImageFor } from "@/lib/theme";
import Image from "next/image";

export function DropFanPreview({
  theme,
  city,
  productName,
  priceCents,
  countdownLabel,
  exclusivityLabel = "Verified attendees only",
  heroImage,
  isFlash = true,
}: {
  theme: ResolvedTheme;
  city: string;
  productName: string;
  priceCents: number;
  countdownLabel: string;
  exclusivityLabel?: string;
  heroImage?: string | null;
  isFlash?: boolean;
}) {
  const image = heroImage ?? heroImageFor(theme);
  const badgeLabel = isFlash ? "Encore drop unlocked" : "Drop unlocked";

  return (
    <div className="mx-auto w-[280px] shrink-0">
      <p className="mb-2 text-center text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Fan preview
      </p>
      <div className="overflow-hidden rounded-[2rem] border border-border bg-zinc-950 shadow-2xl ring-1 ring-white/5">
        <ArtistTakeover theme={theme} showFooter={false} className="min-h-[540px]">
          <div className="relative flex min-h-[540px] flex-col">
            {image && (
              <div className="relative h-36 overflow-hidden">
                <Image src={image} alt="" fill sizes="280px" className="object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-artist-bg" aria-hidden />
              </div>
            )}

            <div className="moment-surface flex flex-1 flex-col px-4 pb-5 pt-4">
              <div
                className="pointer-events-none absolute inset-x-0 top-24 h-40 bg-[radial-gradient(circle_at_50%_0%,rgba(255,46,138,0.12),transparent_70%)]"
                aria-hidden
              />

              <div className="relative flex flex-1 flex-col items-center justify-center space-y-4 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--studio-live,#ff2e8a)]/40 bg-[color:var(--studio-live,#ff2e8a)]/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[color:var(--studio-live,#ff2e8a)]">
                  <span className="relative inline-flex size-1.5 rounded-full bg-[color:var(--studio-live,#ff2e8a)] status-dot-pulse" />
                  {badgeLabel}
                </span>

                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-artist-muted">{city}</p>
                  <h3 className="font-artist text-2xl leading-tight tracking-wide text-artist-fg">
                    {productName}
                  </h3>
                </div>

                <p className="font-artist text-4xl leading-none tracking-wide text-artist-fg tabular">
                  {countdownLabel}
                </p>

                <p className="text-[11px] text-artist-muted">{exclusivityLabel}</p>
                <p className="text-lg font-semibold tabular text-artist-accent">{formatMoney(priceCents)}</p>

                <div className="mt-1 w-full rounded-xl bg-artist-accent px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-artist-accent-fg shadow-[0_4px_24px_color-mix(in_srgb,var(--artist-accent)_35%,transparent)]">
                  View drop
                </div>
              </div>
            </div>
          </div>
        </ArtistTakeover>
      </div>
    </div>
  );
}
