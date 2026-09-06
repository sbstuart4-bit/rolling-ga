import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArtistTakeover } from "@/components/artist/artist-takeover";
import { FlashDropCountdown } from "@/components/fan/flash-drop-countdown";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { requireAuth } from "@/server/auth/request";
import { db } from "@/db";
import { artists, drops, dropProducts, products } from "@/db/schema";
import { and, asc, desc, eq, lte } from "drizzle-orm";
import { demoNow } from "@/server/demo/clock";
import { resolveProductImage } from "@/lib/demo-product-images";
import { resolveDropArtwork } from "@/lib/demo-drop-artwork";
import { resolveDropProductPresentation, isDropVisibleInDemoScenario, shouldShowDropCountdown, shouldShowDropsMerch } from "@/lib/merch-experience/drop-presentation";
import { relativeDayLabel } from "@/lib/format";
import { getActiveDemoScenarioContext } from "@/server/demo/scenario-state";
import { loadEventPage } from "@/server/events/context";
import { getFanShowContextSlug } from "@/server/fans/show-context";

export const metadata: Metadata = { title: "Drops — Rolling GA" };

export default async function DropsPage() {
  const ctx = await requireAuth("/drops");
  const now = demoNow();

  const [demoScenario, fanShowSlug] = await Promise.all([
    getActiveDemoScenarioContext(),
    getFanShowContextSlug(),
  ]);

  const scopeSlug = demoScenario?.show.slug ?? fanShowSlug;
  const eventPage = scopeSlug ? await loadEventPage(scopeSlug, ctx.userId) : null;
  const scopeArtistId = eventPage?.event.artistId ?? demoScenario?.show.artistId;

  const dropFilters = [
    eq(drops.status, "live"),
    lte(drops.startsAt, now),
    ...(scopeArtistId ? [eq(drops.artistId, scopeArtistId)] : []),
  ];

  const allDrops = await db
    .select({
      id: drops.id,
      slug: drops.slug,
      title: drops.title,
      description: drops.description,
      artworkUrl: drops.artworkUrl,
      startsAt: drops.startsAt,
      endsAt: drops.endsAt,
      exclusivityType: drops.exclusivityType,
      eventId: drops.eventId,
      artistId: drops.artistId,
      artistName: artists.name,
    })
    .from(drops)
    .innerJoin(artists, eq(artists.id, drops.artistId))
    .where(and(...dropFilters))
    .orderBy(desc(drops.displayPriority), desc(drops.startsAt))
    .limit(40);

  const scopedDrops = demoScenario
    ? allDrops.filter((drop) => isDropVisibleInDemoScenario(drop, demoScenario.show.eventId))
    : allDrops;

  const showMerch =
    !demoScenario || shouldShowDropsMerch(demoScenario.experience);
  const visibleDrops = showMerch ? scopedDrops : [];

  const dropsHeading = eventPage
    ? demoScenario && !showMerch
      ? `${eventPage.event.artistName} · Coming soon`
      : (() => {
          const relative = relativeDayLabel(eventPage.event.startsAt, now);
          if (relative === "Today" || relative === "Tomorrow") {
            return `${eventPage.event.artistName} · Tonight\u2019s Drop`;
          }
          return `${eventPage.event.artistName} · Drops`;
        })()
    : "Tonight\u2019s Drop";

  const featured = visibleDrops[0];
  const featuredCountdown =
    demoScenario && featured
      ? shouldShowDropCountdown(featured, demoScenario.show.eventId, now)
      : Boolean(featured?.endsAt && featured.endsAt > now);

  const content = (
    <div className="mx-auto max-w-lg pb-safe-tabs">
      <header
        className={
          eventPage
            ? "sticky top-0 z-10 border-b border-artist-border bg-artist-bg/95 px-5 py-4 backdrop-blur"
            : "sticky top-0 z-10 border-b border-border bg-[#121212]/95 px-5 py-4 backdrop-blur"
        }
      >
        <h1 className="font-display text-xl tracking-wider">{dropsHeading}</h1>
        {eventPage && (
          <p className="mt-0.5 text-xs text-artist-muted">
            {eventPage.event.venueCity} ·{" "}
            <Link href={`/event/${eventPage.event.slug}`} className="text-artist-accent hover:underline">
              Back to show
            </Link>
          </p>
        )}
      </header>

      {visibleDrops.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 px-5 py-28 text-center">
          <p className="text-4xl">📦</p>
          <p className="font-display text-lg">
            {demoScenario && !showMerch ? "Merch opens soon" : "No active drops"}
          </p>
          <p className="text-sm text-muted-foreground">
            {demoScenario && !showMerch
              ? demoScenario.experience.primaryMessage
              : "Check back when a show is live."}
          </p>
          {eventPage && demoScenario && !showMerch ? (
            <Link
              href={`/event/${eventPage.event.slug}`}
              className="text-sm font-medium text-artist-accent hover:underline"
            >
              Back to the show
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="px-5 pt-5">
          {featuredCountdown && featured?.endsAt && (
            <div
              className={
                eventPage
                  ? "mb-6 rounded-xl border border-artist-accent/30 bg-artist-accent/10 px-4 py-3 text-center"
                  : "mb-6 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-center"
              }
            >
              <p className={eventPage ? "eyebrow mb-1 text-artist-accent" : "eyebrow mb-1 text-primary"}>
                Drop ends in
              </p>
              <p
                className={
                  eventPage
                    ? "font-display text-2xl tracking-wider text-artist-accent"
                    : "font-display text-2xl tracking-wider text-primary"
                }
              >
                <FlashDropCountdown endsAt={featured.endsAt.toISOString()} />
              </p>
            </div>
          )}

          <ul className="space-y-4">
            {visibleDrops.map((drop) => (
              <DropCard
                key={drop.id}
                drop={drop}
                now={now}
                eventSlug={eventPage?.event.slug}
                scoped={Boolean(eventPage)}
                demoScenario={demoScenario}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  if (eventPage) {
    return <ArtistTakeover theme={eventPage.theme}>{content}</ArtistTakeover>;
  }

  return content;
}

async function DropCard({
  drop,
  now,
  eventSlug,
  scoped,
  demoScenario,
}: {
  drop: {
    id: string;
    slug: string;
    title: string;
    artworkUrl: string | null;
    artistId: string;
    artistName: string;
    eventId: string | null;
    endsAt: Date | null;
    exclusivityType: string;
  };
  now: Date;
  eventSlug?: string;
  scoped: boolean;
  demoScenario: Awaited<ReturnType<typeof getActiveDemoScenarioContext>>;
}) {
  const items = await db
    .select({
      productId: products.id,
      productSlug: products.slug,
      name: products.name,
      images: products.images,
      accessType: products.accessType,
      eventId: products.eventId,
      basePriceCents: products.basePriceCents,
      dropPriceCents: dropProducts.dropPriceCents,
    })
    .from(dropProducts)
    .innerJoin(products, eq(products.id, dropProducts.productId))
    .where(eq(dropProducts.dropId, drop.id))
    .orderBy(asc(dropProducts.displayOrder))
    .limit(6);

  const hero = items[0];
  const artwork = resolveDropArtwork({
    dropSlug: drop.slug,
    storedArtworkUrl: drop.artworkUrl,
    fallbackProductId: hero?.productId,
    fallbackProductImages: hero?.images,
  });

  const eventQuery = eventSlug ? `?e=${eventSlug}` : "";
  const productLink = (slug: string) => `/product/${slug}${eventQuery}`;

  return (
    <li
      className={
        scoped
          ? "overflow-hidden rounded-2xl border border-artist-border bg-artist-surface"
          : "overflow-hidden rounded-2xl border border-border bg-card"
      }
    >
      {artwork && (
        <Link href={`/drop/${drop.slug}${eventQuery}`} className="block">
          <div
            className={
              scoped
                ? "relative aspect-[16/9] w-full bg-artist-bg"
                : "relative aspect-[16/9] w-full bg-muted"
            }
          >
            <Image src={artwork} alt="" fill className="object-cover" sizes="(max-width: 512px) 100vw, 512px" />
          </div>
        </Link>
      )}
      <div className={scoped ? "border-b border-artist-border px-4 py-3" : "border-b border-border px-4 py-3"}>
        {!scoped && <p className="eyebrow text-primary">{drop.artistName}</p>}
        <h2 className="font-display text-lg tracking-wide">{drop.title}</h2>
        {drop.exclusivityType === "flash" && (
          <span className="mt-1 inline-block text-xs font-semibold uppercase text-brand-pink">
            Flash drop
          </span>
        )}
      </div>

      <ul className={scoped ? "divide-y divide-artist-border" : "divide-y divide-border"}>
        {items.map((item) => {
          const price = item.dropPriceCents ?? item.basePriceCents;
          const image = resolveProductImage(item.productId, item.images);
          const presentation =
            demoScenario &&
            resolveDropProductPresentation(
              {
                accessType: item.accessType,
                eventId: item.eventId,
                dropEventId: drop.eventId,
              },
              demoScenario.experience,
              demoScenario.show.eventId,
            );
          const href = productLink(item.productSlug);
          return (
            <li key={item.productId} className="flex items-center gap-4 p-4">
              <div
                className={
                  scoped
                    ? "relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-xl bg-artist-bg"
                    : "relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-xl bg-muted"
                }
              >
                {image ? (
                  <Image
                    src={image}
                    alt=""
                    fill
                    className={
                      presentation?.teaser
                        ? "object-contain p-1 opacity-60 saturate-[0.7]"
                        : "object-contain p-1"
                    }
                    sizes="80px"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-2xl">👕</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.name}</p>
                {presentation?.teaser ? (
                  <p
                    className={
                      scoped
                        ? "text-sm font-medium text-artist-muted"
                        : "text-sm font-medium text-muted-foreground"
                    }
                  >
                    {presentation.actionLabel}
                  </p>
                ) : (
                  <p
                    className={
                      scoped
                        ? "tabular text-lg font-semibold text-artist-accent"
                        : "tabular text-lg font-semibold text-primary"
                    }
                  >
                    {formatMoney(price)}
                  </p>
                )}
              </div>
              {presentation && !presentation.canBuy ? (
                <span
                  className={
                    scoped
                      ? "shrink-0 rounded-full border border-artist-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-artist-muted"
                      : "shrink-0 rounded-full border border-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                  }
                >
                  {presentation.actionLabel}
                </span>
              ) : (
                <Button
                  asChild
                  size="sm"
                  className={
                    scoped
                      ? "shrink-0 bg-artist-accent uppercase tracking-wider text-artist-accent-fg hover:bg-artist-accent/90"
                      : "shrink-0 bg-primary uppercase tracking-wider hover:bg-primary/90"
                  }
                >
                  <Link href={href}>{presentation?.actionLabel ?? "Buy now"}</Link>
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {items.length === 0 && (
        <div className="p-4 text-center text-sm text-muted-foreground">
          <Link
            href={`/drop/${drop.slug}${eventQuery}`}
            className={scoped ? "text-artist-accent hover:underline" : "text-primary hover:underline"}
          >
            View drop
          </Link>
        </div>
      )}
    </li>
  );
}
