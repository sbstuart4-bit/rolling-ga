import Link from "next/link";
import { ArrowRight, BadgeCheck, Lock, ShoppingBag, Sparkles, Timer, Zap } from "lucide-react";
import { FlashDropCountdown } from "@/components/fan/flash-drop-countdown";
import { cn } from "@/lib/utils";

export interface EventHubFlashDrop {
  slug: string;
  title: string;
  endsAt: string;
  artistId: string;
  productLabel?: string;
}

export interface EventHubModuleData {
  tonightItemCount: number;
  exclusiveCount: number;
  merchCount: number;
  contentCount: number;
  flashDrop: EventHubFlashDrop | null;
}

function ModuleTile({
  href,
  icon,
  label,
  sub,
  accent = "default",
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
  accent?: "default" | "flash";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col rounded-2xl border border-artist-border bg-artist-surface p-4 transition-colors",
        "hover:border-artist-accent/40 hover:bg-artist-accent/5",
      )}
    >
      <span
        className={cn(
          "mb-3 flex size-9 items-center justify-center rounded-xl border border-artist-border bg-artist-bg",
          accent === "flash" ? "text-artist-accent" : "text-artist-muted",
        )}
      >
        {icon}
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-artist-fg">
        {label}
      </span>
      <span className="mt-1 text-xs text-artist-muted">{sub}</span>
    </Link>
  );
}

export function EventHubFlashBanner({
  flashDrop,
  eventSlug,
}: {
  flashDrop: EventHubFlashDrop;
  eventSlug: string;
}) {
  return (
    <Link
      href={`/drop/${flashDrop.slug}?artistId=${flashDrop.artistId}&e=${eventSlug}`}
      className="flex items-center gap-3 rounded-2xl border border-artist-accent/30 bg-artist-accent/10 px-4 py-3 transition-colors hover:bg-artist-accent/15"
    >
      <span className="relative flex size-2 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-artist-accent opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-artist-accent" />
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="eyebrow text-artist-accent">Encore drop live</p>
        <p className="truncate text-sm font-medium text-artist-fg">
          {flashDrop.productLabel ?? flashDrop.title}
          {" · "}
          <FlashDropCountdown endsAt={flashDrop.endsAt} />
        </p>
      </div>
      <span className="flex shrink-0 items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-artist-accent">
        Open
        <ArrowRight className="size-3.5" aria-hidden />
      </span>
    </Link>
  );
}

/**
 * Verified live fan entry point — the artist's digital venue as a module grid.
 * Each tile links to an existing route; no new navigation model.
 */
export function EventHubModules({
  slug,
  data,
}: {
  slug: string;
  data: EventHubModuleData;
}) {
  const shopHref = `/event/${slug}/shop`;
  const credentialHref = `/event/${slug}/credential`;
  const flashHref = data.flashDrop
    ? `/drop/${data.flashDrop.slug}?artistId=${data.flashDrop.artistId}&e=${slug}`
    : shopHref;

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <p className="flex items-center gap-1.5 text-sm font-medium text-artist-accent">
          <BadgeCheck className="size-4" aria-hidden />
          Tonight&apos;s experience is unlocked
        </p>
        <p className="text-sm text-artist-muted">
          Everything made for this room lives here.
        </p>
      </div>

      {data.flashDrop && <EventHubFlashBanner flashDrop={data.flashDrop} eventSlug={slug} />}

      <div className="grid grid-cols-2 gap-3">
        <ModuleTile
          href={shopHref}
          icon={<Zap className="size-4" aria-hidden />}
          label="Tonight's drop"
          sub={
            data.tonightItemCount > 0
              ? `${data.tonightItemCount} item${data.tonightItemCount === 1 ? "" : "s"} unlocked`
              : "Browse the shop"
          }
        />
        <ModuleTile
          href={shopHref}
          icon={<Lock className="size-4" aria-hidden />}
          label="Exclusives"
          sub={
            data.exclusiveCount > 0
              ? `${data.exclusiveCount} attendee-only`
              : "Verified access only"
          }
        />
        <ModuleTile
          href={shopHref}
          icon={<ShoppingBag className="size-4" aria-hidden />}
          label="Merch"
          sub={
            data.merchCount > 0
              ? `${data.merchCount} from this show`
              : "Tour collection"
          }
        />
        <ModuleTile
          href={credentialHref}
          icon={<BadgeCheck className="size-4" aria-hidden />}
          label="My show"
          sub="Credential & access"
        />
        {data.contentCount > 0 && (
          <ModuleTile
            href={`#from-the-night`}
            icon={<Sparkles className="size-4" aria-hidden />}
            label="Show info"
            sub={`${data.contentCount} from the night`}
          />
        )}
        {data.flashDrop && (
          <ModuleTile
            href={flashHref}
            icon={<Timer className="size-4" aria-hidden />}
            label="Flash drops"
            sub="Live now"
            accent="flash"
          />
        )}
      </div>
    </section>
  );
}
