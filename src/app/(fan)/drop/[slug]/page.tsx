import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Lock, Timer } from "lucide-react";
import {
  EventScopedTakeover,
} from "@/components/fan/event-scoped-takeover";
import { EventCommerceBody } from "@/components/fan/event-commerce-chrome";
import { cn } from "@/lib/utils";
import { requireAuth } from "@/server/auth/request";
import { listAttendedArtistIds, listAttendedEventIds, listAttendedTourIds } from "@/server/attendance/queries";
import { getDropBySlug, getDropBySlugOnly, listDropProducts, isEligibleForProduct, listVariantsWithInventory, availableUnits } from "@/server/catalog/queries";
import {
  isEventScopedJourney,
  resolveCartEventId,
  resolveEventTakeoverContext,
} from "@/server/events/takeover";
import { getSavedApparelSize } from "@/server/fans/preferences";
import { FlashDropCountdown } from "@/components/fan/flash-drop-countdown";
import { FlashDropLanding } from "@/components/fan/flash-drop-landing";
import { EditorialDropProducts, type EditorialProduct } from "@/components/fan/editorial-drop-products";
import { AddToCartButton } from "@/components/fan/add-to-cart-button";
import { formatEventDateStamp } from "@/lib/format";
import { resolveDropArtwork } from "@/lib/demo-drop-artwork";
import { resolveProductImages } from "@/lib/demo-product-images";
import { demoNow } from "@/server/demo/clock";

export async function generateMetadata(props: PageProps<"/drop/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const { artistId } = await props.searchParams;
  const drop =
    typeof artistId === "string"
      ? await getDropBySlug(artistId, slug)
      : await getDropBySlugOnly(slug);
  return drop ? { title: drop.title } : { title: "Drop not found" };
}

export default async function DropPage(props: PageProps<"/drop/[slug]">) {
  const { slug } = await props.params;
  const { artistId: artistIdParam, e: eventSlug } = await props.searchParams;
  const ctx = await requireAuth(`/drop/${slug}`);

  const drop =
    typeof artistIdParam === "string"
      ? await getDropBySlug(artistIdParam, slug)
      : await getDropBySlugOnly(slug);
  if (!drop) notFound();
  const artistId = drop.artistId;

  const eventPage = await resolveEventTakeoverContext(
    typeof eventSlug === "string" ? eventSlug : undefined,
    ctx.userId,
  );
  const scoped = isEventScopedJourney(eventPage);

  const [dropItems, attendedEventIds, attendedTourIds, attendedArtistIds, savedApparelSize] =
    await Promise.all([
    listDropProducts(drop.id),
    listAttendedEventIds(ctx.userId),
    listAttendedTourIds(ctx.userId),
    listAttendedArtistIds(ctx.userId),
    getSavedApparelSize(ctx.userId),
  ]);

  const now = demoNow();
  const isFlash = drop.endsAt !== null;
  const expired = drop.endsAt && drop.endsAt < now;
  const showFlashLanding = isFlash && !expired && drop.endsAt;
  const attendance = { attendedEventIds, attendedTourIds, attendedArtistIds };
  const verifyEventSlug = scoped ? eventPage.event.slug : undefined;

  const items = await Promise.all(
    dropItems.map(async (item) => {
      const variants = await listVariantsWithInventory(item.id);
      const hasVariantsWithSize = variants.some((variant) => variant.size !== null);
      return {
        item,
        variants: hasVariantsWithSize
          ? variants.map((variant) => ({
              id: variant.id,
              size: variant.size,
              available: availableUnits(variant),
            }))
          : undefined,
        eligibility: await isEligibleForProduct(
          {
            accessType: item.accessType,
            eventId: item.eventId,
            tourId: item.tourId,
            availableFrom: item.availableFrom,
            availableUntil: item.availableUntil,
          },
          attendance,
          now,
        ),
      };
    }),
  );

  const metadataLabel =
    scoped && eventPage
      ? `${eventPage.event.venueCity.toUpperCase()} / ${formatEventDateStamp(eventPage.event.startsAt, eventPage.event.timezone)}`
      : undefined;

  const editorialProducts: EditorialProduct[] = items.map(({ item, eligibility }) => {
    const price = item.dropPriceCents ?? item.basePriceCents;
    const productHref = `/product/${item.slug}?a=${artistId}${scoped ? `&e=${eventPage!.event.slug}` : ""}`;
    const href =
      !eligibility.eligible && verifyEventSlug
        ? `/event/${verifyEventSlug}/verify`
        : productHref;

    return {
      id: item.dropProductId,
      slug: item.slug,
      name: item.name,
      tagline: item.tagline,
      images: resolveProductImages(item.id, item.images),
      priceCents: price,
      accessType: item.accessType,
      category: item.category,
      href,
      locked: !eligibility.eligible,
      metadataLabel,
    };
  });

  const heroProduct = dropItems[0];
  const dropArtwork = resolveDropArtwork({
    dropSlug: drop.slug,
    storedArtworkUrl: drop.artworkUrl,
    fallbackProductId: heroProduct?.id,
    fallbackProductImages: heroProduct?.images,
  });
  const showStandaloneArtwork =
    Boolean(dropArtwork && !showFlashLanding && !(scoped && editorialProducts.length > 0));

  return (
    <EventScopedTakeover
      eventPage={eventPage}
      title={scoped && !showFlashLanding ? drop.title : undefined}
      subtitle={scoped && !showFlashLanding ? drop.description : undefined}
    >
      <EventCommerceBody className={cn(!scoped && "pt-6")}>
        {!scoped && (
          <header className="mb-7 space-y-3">
            {showFlashLanding && (
              <FlashDropLanding
                dropTitle={drop.title}
                heroProductName={items[0]?.item.name}
                endsAt={drop.endsAt!.toISOString()}
                scoped={false}
              />
            )}

            {!showFlashLanding && isFlash && !expired && drop.endsAt && (
              <div className="flex items-center gap-2 rounded-full border border-warning/40 bg-warning/10 px-3 py-1.5 text-sm font-medium text-warning w-fit">
                <Timer className="size-3.5" aria-hidden />
                <FlashDropCountdown endsAt={drop.endsAt.toISOString()} />
              </div>
            )}

            {showStandaloneArtwork && dropArtwork && (
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
                <Image src={dropArtwork} alt="" fill sizes="(min-width: 768px) 672px, 100vw" className="object-cover" />
              </div>
            )}

            {!showFlashLanding && (
              <div className="space-y-1.5">
                <p className="eyebrow text-muted-foreground">{drop.artistName}</p>
                <h1 className="text-3xl font-semibold tracking-tight">{drop.title}</h1>
                {drop.description && <p className="text-muted-foreground">{drop.description}</p>}
              </div>
            )}

            {showFlashLanding && drop.description && (
              <p className="text-muted-foreground">{drop.description}</p>
            )}

            {expired && (
              <div className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                This drop has ended.
              </div>
            )}
          </header>
        )}

        {scoped && (
          <div className="mb-7 space-y-4">
            {showFlashLanding && (
              <FlashDropLanding
                dropTitle={drop.title}
                heroProductName={items[0]?.item.name}
                endsAt={drop.endsAt!.toISOString()}
                scoped
              />
            )}

            {!showFlashLanding && isFlash && !expired && drop.endsAt && (
              <div className="flex items-center gap-2 rounded-full border border-artist-accent/40 bg-artist-accent/10 px-3 py-1.5 text-sm font-medium text-artist-accent w-fit">
                <Timer className="size-3.5" aria-hidden />
                <FlashDropCountdown endsAt={drop.endsAt.toISOString()} />
              </div>
            )}

            {showStandaloneArtwork && dropArtwork && (
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-artist-border">
                <Image src={dropArtwork} alt="" fill sizes="(min-width: 768px) 672px, 100vw" className="object-cover" />
              </div>
            )}

            {expired && (
              <div className="rounded-xl border border-artist-border bg-artist-surface px-4 py-3 text-sm text-artist-muted">
                This drop has ended.
              </div>
            )}
          </div>
        )}

        {editorialProducts.length > 0 && (
          <div className="mb-8">
            <EditorialDropProducts
              products={editorialProducts}
              dropExclusivity={drop.exclusivityType}
              scoped={scoped}
            />
          </div>
        )}

        {!expired && editorialProducts.length === 0 && (
          <section className="space-y-4">
            <h2 className={cn("eyebrow", scoped ? "text-artist-muted" : "text-muted-foreground")}>
              Add to {scoped ? "my drop" : "cart"}
            </h2>
            <ul className="space-y-4">
              {items.map(({ item, variants, eligibility }) => {
                if (!eligibility.eligible) return null;

                return (
                  <li
                    key={item.dropProductId}
                    className={cn(
                      "rounded-2xl border p-5",
                      scoped ? "border-artist-border bg-artist-surface" : "border-border bg-card",
                    )}
                  >
                    <p className={cn("mb-3 font-medium", scoped && "text-artist-fg")}>{item.name}</p>
                    <AddToCartButton
                      productId={item.id}
                      productName={item.name}
                      productSlug={item.slug}
                      artistId={artistId}
                      eventId={resolveCartEventId(eventPage, drop.eventId ?? item.eventId)}
                      eventSlug={scoped ? eventPage.event.slug : undefined}
                      dropId={drop.id}
                      branded={scoped}
                      savedApparelSize={savedApparelSize}
                      variants={variants}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {items.some(({ eligibility }) => !eligibility.eligible) && (
          <ul className="mt-4 space-y-3">
            {items
              .filter(({ eligibility }) => !eligibility.eligible)
              .map(({ item, eligibility }) => (
                <li
                  key={item.dropProductId}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm",
                    scoped
                      ? "border-artist-border bg-artist-bg text-artist-muted"
                      : "border-border bg-muted/50 text-muted-foreground",
                  )}
                >
                  <Lock className="size-4 shrink-0" aria-hidden />
                  <span>
                    {item.name}: {eligibility.reason}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </EventCommerceBody>
    </EventScopedTakeover>
  );
}
