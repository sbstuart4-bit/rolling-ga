import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, Package } from "lucide-react";
import { AddToCartButton } from "@/components/fan/add-to-cart-button";
import {
  EventScopedTakeover,
} from "@/components/fan/event-scoped-takeover";
import { EventCommerceBody } from "@/components/fan/event-commerce-chrome";
import { ProductMetadataStrip } from "@/components/fan/product-metadata-strip";
import { formatEventDateStamp, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requireAuth } from "@/server/auth/request";
import {
  listAttendedArtistIds,
  listAttendedEventIds,
  listAttendedTourIds,
} from "@/server/attendance/queries";
import {
  getProductBySlug,
  getProductBySlugOnly,
  isEligibleForProduct,
  listVariantsWithInventory,
  availableUnits,
} from "@/server/catalog/queries";
import {
  isEventScopedJourney,
  resolveCartEventId,
  resolveEventTakeoverContext,
} from "@/server/events/takeover";
import { getDemoAwareProductEligibility } from "@/server/demo/scenario-eligibility";
import { productAccessLabelForExperience } from "@/lib/fan-experience/now-next";
import { getSavedApparelSize } from "@/server/fans/preferences";

export async function generateMetadata(props: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const { a: artistId } = await props.searchParams;
  const product =
    typeof artistId === "string"
      ? await getProductBySlug(artistId, slug)
      : await getProductBySlugOnly(slug);
  return product ? { title: product.name } : { title: "Product not found" };
}

/**
 * Premium editorial product page.
 *
 * The page presents the piece as an artefact first — large imagery, the story, scarcity
 * — and commerce second. Access gating happens entirely server-side: the add-to-cart
 * form is only rendered when the fan is eligible, and every add-to-cart action re-checks
 * eligibility regardless of what the client sends.
 *
 * When `?e=` carries a valid event slug, the page inherits the same artist takeover as
 * the show shop so the fan never falls out of the branded world before cart/checkout.
 */
export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const { slug } = await props.params;
  const { a: artistIdParam, e: eventSlug } = await props.searchParams;
  const ctx = await requireAuth(`/product/${slug}`);

  const product =
    typeof artistIdParam === "string"
      ? await getProductBySlug(artistIdParam, slug)
      : await getProductBySlugOnly(slug);
  if (!product) notFound();
  const artistId = product.artistId;

  const eventPage = await resolveEventTakeoverContext(
    typeof eventSlug === "string" ? eventSlug : undefined,
    ctx.userId,
  );
  const scoped = isEventScopedJourney(eventPage);
  const cartEventId = resolveCartEventId(eventPage, product.eventId);

  const [variants, attendedEventIds, attendedTourIds, attendedArtistIds, savedApparelSize] =
    await Promise.all([
    listVariantsWithInventory(product.id),
    listAttendedEventIds(ctx.userId),
    listAttendedTourIds(ctx.userId),
    listAttendedArtistIds(ctx.userId),
    getSavedApparelSize(ctx.userId),
  ]);

  const eligibility = eventPage
    ? await getDemoAwareProductEligibility(
        product,
        { attendedEventIds, attendedTourIds, attendedArtistIds },
        cartEventId ?? undefined,
      )
    : await isEligibleForProduct(product, {
        attendedEventIds,
        attendedTourIds,
        attendedArtistIds,
      });

  const images = product.images ?? [];
  const hasVariantsWithSize = variants.some((v) => v.size !== null);
  const verifyEventSlug = scoped ? eventPage.event.slug : undefined;

  return (
    <EventScopedTakeover
      eventPage={eventPage}
      title={scoped ? product.name : undefined}
      subtitle={scoped ? product.tagline : undefined}
      headerTrailing={
        scoped ? (
          <span className="tabular text-xl font-semibold text-artist-accent">
            {formatMoney(product.basePriceCents)}
          </span>
        ) : undefined
      }
    >
      <div className={cn(!scoped && "mx-auto max-w-lg")}>
        {!scoped && (
          <>
            {images.length > 0 ? (
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
                <Image
                  src={images[0]}
                  alt={product.name}
                  fill
                  priority
                  sizes="(min-width: 768px) 672px, 100vw"
                  className="object-contain p-4"
                />
              </div>
            ) : (
              <div className="flex aspect-[4/5] w-full items-center justify-center bg-muted">
                <Package className="size-16 text-muted-foreground/30" aria-hidden />
              </div>
            )}
          </>
        )}

        {scoped && images.length > 0 && (
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-artist-surface">
            <Image
              src={images[0]}
              alt={product.name}
              fill
              priority
              sizes="(min-width: 768px) 672px, 100vw"
              className="object-contain p-4"
            />
          </div>
        )}

        {scoped && images.length === 0 && (
          <div className="flex aspect-[4/5] w-full items-center justify-center bg-artist-surface">
            <Package className="size-16 text-artist-muted/30" aria-hidden />
          </div>
        )}

        <EventCommerceBody className="space-y-8 py-7">
          {scoped && (
            <div className="space-y-2">
              <ProductMetadataStrip
                city={eventPage.event.venueCity}
                dateLabel={formatEventDateStamp(eventPage.event.startsAt, eventPage.event.timezone)}
                accessLabel={
                  eventPage.fanExperience
                    ? productAccessLabelForExperience(eventPage.fanExperience)
                    : product.accessType === "verified_attendee" || product.accessType === "event_specific"
                      ? "Verified attendees only"
                      : "Tonight's drop"
                }
              />
              {product.tagline && (
                <p className="text-base italic text-artist-muted">{product.tagline}</p>
              )}
            </div>
          )}

          {!scoped && (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
                <span className="tabular shrink-0 text-xl font-semibold">
                  {formatMoney(product.basePriceCents)}
                </span>
              </div>

              {product.tagline && (
                <p className="text-base italic text-muted-foreground">{product.tagline}</p>
              )}

              {product.producedQuantity && (
                <p className="eyebrow text-muted-foreground">
                  {product.producedQuantity.toLocaleString("en-US")} produced
                </p>
              )}
            </div>
          )}

          {scoped && product.producedQuantity && (
            <p className="eyebrow text-artist-muted">
              {product.producedQuantity.toLocaleString("en-US")} produced
            </p>
          )}

          {!eligibility.eligible ? (
            <LockedState reason={eligibility.reason} eventSlug={verifyEventSlug} scoped={scoped} />
          ) : (
          <AddToCartButton
            productId={product.id}
            productName={product.name}
            productSlug={product.slug}
            artistId={artistId}
            eventId={cartEventId}
            eventSlug={scoped ? eventPage.event.slug : undefined}
            branded={scoped}
            savedApparelSize={savedApparelSize}
            variants={
              hasVariantsWithSize
                ? variants.map((v) => ({
                    id: v.id,
                    size: v.size,
                    available: availableUnits(v),
                  }))
                : undefined
            }
          />
          )}

          {product.story && (
            <section
              className={cn(
                "space-y-3 border-t pt-7",
                scoped ? "border-artist-border" : "border-border",
              )}
            >
              <h2 className={cn("eyebrow", scoped ? "text-artist-muted" : "text-muted-foreground")}>
                About this piece
              </h2>
              <div
                className={cn(
                  "space-y-4 text-sm leading-relaxed",
                  scoped ? "text-artist-muted" : "text-muted-foreground",
                )}
              >
                {product.story.split("\n\n").map((para) => (
                  <p key={para}>{para}</p>
                ))}
              </div>
            </section>
          )}

          {images.length > 1 && (
            <section className="grid grid-cols-2 gap-2">
              {images.slice(1).map((src) => (
                <div
                  key={src}
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-xl",
                    scoped ? "bg-artist-surface" : "bg-muted",
                  )}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 336px, 50vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </section>
          )}
        </EventCommerceBody>
      </div>
    </EventScopedTakeover>
  );
}

function LockedState({
  reason,
  eventSlug,
  scoped,
}: {
  reason?: string;
  eventSlug?: string;
  scoped: boolean;
}) {
  return (
    <div
      className={cn(
        "space-y-4 rounded-2xl border p-6 text-center",
        scoped
          ? "border-artist-border bg-artist-surface"
          : "border-border bg-muted/40",
      )}
    >
      <div
        className={cn(
          "mx-auto flex size-11 items-center justify-center rounded-full",
          scoped ? "bg-artist-bg" : "bg-background",
        )}
      >
        <Lock
          className={cn("size-5", scoped ? "text-artist-muted" : "text-muted-foreground")}
          aria-hidden
        />
      </div>
      <div className="space-y-1.5">
        <h2 className={cn("font-semibold", scoped && "text-artist-fg")}>
          {reason ?? "Unlock at the show"}
        </h2>
        <p className={cn("text-sm", scoped ? "text-artist-muted" : "text-muted-foreground")}>
          This piece unlocks when you&apos;re inside the venue tonight — no post-show credential required.
        </p>
      </div>
      {eventSlug && (
        <Link
          href={`/event/${eventSlug}/verify`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium",
            scoped
              ? "bg-artist-accent text-artist-accent-fg hover:bg-artist-accent/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          Verify your attendance
        </Link>
      )}
    </div>
  );
}
