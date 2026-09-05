import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Timer } from "lucide-react";
import { EditorialDropProducts, type EditorialProduct } from "@/components/fan/editorial-drop-products";
import { FlashDropCountdown } from "@/components/fan/flash-drop-countdown";
import { PostShowStoreCountdown } from "@/components/fan/post-show-store-countdown";
import { EventShopProductCard } from "@/components/fan/event-shop/event-shop-product-card";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatEventDateStamp, formatMoney } from "@/lib/format";
import { eventShopProductTag } from "@/lib/event-shop-present";
import type { DropExclusivityType } from "@/lib/types";

type ShopProduct = {
  dropProductId?: string;
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  images?: string[] | null;
  priceCents: number;
  accessType?: string | null;
  category?: string | null;
  eligibility: { eligible: boolean; reason?: string };
};

export function EventShopUnlockBanner() {
  return (
    <section className="rounded-2xl border border-artist-border bg-artist-surface px-4 py-3">
      <p className="eyebrow text-artist-accent">Unlocked tonight</p>
      <p className="mt-1 font-artist text-lg text-artist-fg">Attendee exclusives are live</p>
      <p className="text-sm text-artist-muted">Everything in this shop was made for people in the room.</p>
    </section>
  );
}

export function EventShopPostShowBanner({ closesAt }: { closesAt: string }) {
  return (
    <section className="rounded-2xl border border-artist-accent/30 bg-artist-accent/10 px-4 py-3 text-center">
      <p className="text-sm text-artist-muted">
        Your attendee-exclusive store remains open for{" "}
        <PostShowStoreCountdown closesAt={closesAt} />
      </p>
    </section>
  );
}

export function EventShopFlashBanner({ endsAt }: { endsAt: string }) {
  return (
    <section className="rounded-2xl border border-artist-accent/30 bg-artist-accent/10 px-4 py-3 text-center">
      <p className="eyebrow mb-1 text-artist-accent">Flash drop ends in</p>
      <p className="font-artist text-2xl tracking-wide text-artist-accent">
        <FlashDropCountdown endsAt={endsAt} />
      </p>
    </section>
  );
}

export function EventShopClosedBanner() {
  return (
    <section className="rounded-2xl border border-artist-border bg-artist-surface px-4 py-3 text-sm text-artist-muted">
      The attendee store for this show has closed. Separately scheduled drops may still appear if
      the artist extends them.
    </section>
  );
}

export function EventShopEmptyState({ eventSlug, artistName }: { eventSlug: string; artistName: string }) {
  return (
    <div className="rounded-2xl border border-artist-border bg-artist-surface px-6 py-16 text-center">
      <p className="font-artist text-lg text-artist-fg">Nothing live yet</p>
      <p className="mt-2 text-sm text-artist-muted">
        {artistName} hasn&apos;t opened the shop for this show. Check back closer to doors.
      </p>
      <Button
        asChild
        variant="ghost"
        className="mt-6 text-artist-muted hover:bg-artist-accent/10 hover:text-artist-fg"
      >
        <Link href={`/event/${eventSlug}`}>Back to the show</Link>
      </Button>
    </div>
  );
}

export function EventShopDropSection({
  eventSlug,
  artistId,
  drop,
  products,
  expired,
  isFlash,
  notStarted,
  storeOpen,
  timezone,
  dropExclusivity,
  venueCity,
  eventStartsAt,
}: {
  eventSlug: string;
  artistId: string;
  drop: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    artworkUrl: string | null;
    endsAt: Date | null;
    startsAt: Date;
  };
  products: ShopProduct[];
  expired: boolean;
  isFlash: boolean;
  notStarted: boolean;
  storeOpen: boolean;
  timezone: string;
  dropExclusivity?: DropExclusivityType | null;
  venueCity?: string;
  eventStartsAt?: Date;
}) {
  const metadataLabel =
    venueCity && eventStartsAt
      ? `${venueCity.toUpperCase()} / ${formatEventDateStamp(eventStartsAt, timezone)}`
      : undefined;

  const editorialProducts: EditorialProduct[] = products.map((item) => {
    const individuallyOpen = drop.endsAt !== null && !expired && !notStarted;
    const purchaseDisabled = expired || notStarted || (!storeOpen && !individuallyOpen);
    const locked = !item.eligibility.eligible || purchaseDisabled;
    const productHref = `/product/${item.slug}?a=${artistId}&e=${eventSlug}`;
    const href = locked && !purchaseDisabled ? `/event/${eventSlug}/verify` : productHref;

    return {
      id: item.dropProductId ?? item.id,
      slug: item.slug,
      name: item.name,
      tagline: item.tagline,
      images: item.images,
      priceCents: item.priceCents,
      accessType: item.accessType as EditorialProduct["accessType"],
      category: item.category as EditorialProduct["category"],
      href,
      locked,
      metadataLabel,
    };
  });

  return (
    <section className="space-y-5">
      <div className="space-y-3">
        {drop.artworkUrl && (
          <Link
            href={`/drop/${drop.slug}?artistId=${artistId}&e=${eventSlug}`}
            className="relative block aspect-[4/5] overflow-hidden rounded-2xl border border-artist-border"
          >
            <Image
              src={drop.artworkUrl}
              alt=""
              fill
              sizes="(min-width: 768px) 672px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-artist-bg/80 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 space-y-1 p-4">
              {isFlash && !expired && !notStarted && drop.endsAt && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-artist-accent/40 bg-artist-bg/70 px-2.5 py-1 text-xs font-medium text-artist-accent backdrop-blur-sm">
                  <Timer className="size-3" aria-hidden />
                  <FlashDropCountdown endsAt={drop.endsAt.toISOString()} />
                </span>
              )}
              <h2 className="font-artist text-2xl text-artist-fg">{drop.title}</h2>
            </div>
          </Link>
        )}

        {!drop.artworkUrl && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {isFlash && !expired && !notStarted && drop.endsAt && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-artist-accent/40 bg-artist-accent/10 px-2.5 py-1 text-xs font-medium text-artist-accent">
                  <Timer className="size-3" aria-hidden />
                  <FlashDropCountdown endsAt={drop.endsAt.toISOString()} />
                </span>
              )}
              {notStarted && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-artist-border bg-artist-surface px-2.5 py-1 text-xs text-artist-muted">
                  Opens {formatDateTime(drop.startsAt, timezone)}
                </span>
              )}
              {expired && (
                <span className="rounded-full border border-artist-border px-2.5 py-1 text-xs text-artist-muted">
                  Ended
                </span>
              )}
            </div>
            <h2 className="font-artist text-2xl text-artist-fg">{drop.title}</h2>
          </div>
        )}

        {drop.description && (
          <p className="text-sm leading-relaxed text-artist-muted">{drop.description}</p>
        )}
      </div>

      {products.length > 0 ? (
        <>
          <EditorialDropProducts
            products={editorialProducts}
            dropExclusivity={dropExclusivity}
            scoped
          />

          <Button
            asChild
            variant="ghost"
            className="h-auto px-0 text-sm text-artist-accent hover:bg-transparent hover:text-artist-accent/80"
          >
            <Link href={`/drop/${drop.slug}?artistId=${artistId}&e=${eventSlug}`}>
              View full drop
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </>
      ) : (
        <Button
          asChild
          variant="outline"
          className="w-full border-artist-border bg-transparent text-artist-fg hover:bg-artist-accent/10"
        >
          <Link href={`/drop/${drop.slug}?artistId=${artistId}&e=${eventSlug}`}>
            View drop
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      )}
    </section>
  );
}

export function EventShopStandaloneSection({
  eventSlug,
  products,
  storeOpen,
}: {
  eventSlug: string;
  products: Array<{
    product: ShopProduct & { artistId: string };
    eligibility: { eligible: boolean; reason?: string };
  }>;
  storeOpen: boolean;
}) {
  return (
    <section className="space-y-4">
      <h2 className="eyebrow text-artist-muted">From this show</h2>
      <ul className="grid grid-cols-2 gap-3">
        {products.map(({ product, eligibility }) => {
          const purchaseDisabled = !storeOpen;
          const locked = !eligibility.eligible || purchaseDisabled;
          const productHref = `/product/${product.slug}?a=${product.artistId}&e=${eventSlug}`;
          const href = locked && !purchaseDisabled ? `/event/${eventSlug}/verify` : productHref;

          return (
            <li key={product.id}>
              <EventShopProductCard
                href={href}
                name={product.name}
                tagline={product.tagline}
                image={product.images?.[0]}
                priceCents={product.priceCents}
                tag={eventShopProductTag({
                  accessType: product.accessType as never,
                  category: product.category as never,
                })}
                locked={locked}
                lockLabel={
                  locked
                    ? purchaseDisabled
                      ? "Not available yet"
                      : eligibility.reason
                    : undefined
                }
                actionLabel={locked ? (purchaseDisabled ? "Preview" : "Unlock") : "View"}
                disabled={purchaseDisabled}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function EventShopBundleSection({
  eventSlug,
  artistId,
  bundle,
  items,
  savingsCents,
}: {
  eventSlug: string;
  artistId: string;
  bundle: {
    slug: string;
    name: string;
    description: string | null;
    bundlePriceCents: number;
  };
  items: Array<{
    productSlug: string;
    productName: string;
    productImages: string[] | null;
    basePriceCents: number;
  }>;
  savingsCents: number;
}) {
  return (
    <section id="bundle" className="space-y-4">
      <div className="space-y-1">
        <h2 className="eyebrow text-artist-accent">Complete your drop</h2>
        <p className="font-artist text-2xl text-artist-fg">{bundle.name}</p>
        {bundle.description && (
          <p className="text-sm text-artist-muted">{bundle.description}</p>
        )}
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.productSlug}>
            <Link
              href={`/product/${item.productSlug}?a=${artistId}&e=${eventSlug}`}
              className="flex items-center gap-3 rounded-xl border border-artist-border bg-artist-surface p-3 transition-colors hover:bg-artist-accent/5"
            >
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-artist-bg">
                {item.productImages?.[0] ? (
                  <Image src={item.productImages[0]} alt="" fill sizes="48px" className="object-cover" />
                ) : null}
              </div>
              <p className="flex-1 text-sm font-medium text-artist-fg">{item.productName}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between rounded-xl border border-artist-border bg-artist-surface px-4 py-3 text-sm">
        <span className="text-artist-muted">
          {items.length} pieces ·{" "}
          <span className="font-semibold text-artist-fg">{formatMoney(bundle.bundlePriceCents)}</span>
        </span>
        {savingsCents > 0 && (
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            Save {formatMoney(savingsCents)}
          </span>
        )}
      </div>
    </section>
  );
}
