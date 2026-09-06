import Image from "next/image";
import Link from "next/link";
import { Lock } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export function EventShopProductCard({
  href,
  name,
  tagline,
  image,
  priceCents,
  tag,
  locked,
  lockLabel,
  actionLabel,
  disabled = false,
}: {
  href: string;
  name: string;
  tagline?: string | null;
  image?: string;
  priceCents: number;
  tag?: string | null;
  locked: boolean;
  lockLabel?: string;
  actionLabel: string;
  disabled?: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-artist-border bg-artist-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <Link href={href} className="group block" aria-label={locked ? `${name}, locked` : name}>
        <div className="relative aspect-[3/4] max-h-44 bg-artist-bg">
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              sizes="(min-width: 768px) 320px, 45vw"
              className={cn(
                "object-contain p-2 transition-transform duration-500 group-hover:scale-[1.02]",
                locked && "opacity-80 saturate-[0.65]",
              )}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-artist-muted">—</div>
          )}

          {tag && (
            <span className="absolute left-2 top-2 rounded-full border border-artist-border/80 bg-artist-bg/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-artist-fg backdrop-blur-sm">
              {tag}
            </span>
          )}

          {locked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-artist-bg/70 px-3 text-center">
              <span className="flex size-9 items-center justify-center rounded-full border border-artist-border bg-artist-surface/90">
                <Lock className="size-4 text-artist-muted" aria-hidden />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-artist-muted">
                {disabled ? "Not available" : "Locked"}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2 p-3">
          <div className="space-y-0.5">
            <p className="line-clamp-2 text-sm font-medium leading-snug text-artist-fg">{name}</p>
            {tagline && (
              <p className="line-clamp-1 text-xs italic text-artist-muted">{tagline}</p>
            )}
          </div>

          <p className="tabular text-base font-semibold text-artist-accent">{formatMoney(priceCents)}</p>

          {lockLabel && (
            <p className="text-[11px] leading-snug text-artist-muted">{lockLabel}</p>
          )}

          <span
            className={cn(
              "flex h-9 w-full items-center justify-center rounded-lg text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors",
              locked
                ? "border border-artist-border bg-transparent text-artist-muted group-hover:bg-artist-accent/10"
                : "bg-artist-accent text-artist-accent-fg group-hover:bg-artist-accent/90",
            )}
          >
            {actionLabel}
          </span>
        </div>
      </Link>
    </article>
  );
}
