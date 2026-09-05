import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventCommerceBody } from "@/components/fan/event-commerce-chrome";
import { EventShopDock } from "@/components/fan/event-shop/event-shop-dock";
import { EventShopHeader } from "@/components/fan/event-shop/event-shop-header";
import {
  EventShopBundleSection,
  EventShopClosedBanner,
  EventShopDropSection,
  EventShopEmptyState,
  EventShopFlashBanner,
  EventShopPostShowBanner,
  EventShopStandaloneSection,
  EventShopUnlockBanner,
} from "@/components/fan/event-shop/event-shop-sections";
import { isAttendeeStoreOpen } from "@/lib/post-show-commerce";
import { requireAuth } from "@/server/auth/request";
import { countCartItems } from "@/server/commerce/cart";
import { loadEventPage } from "@/server/events/context";
import { loadEventShopCatalog } from "@/server/events/shop";
import { listActiveBundlesForEvent } from "@/server/catalog/queries";

export async function generateMetadata(
  props: PageProps<"/event/[slug]/shop">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const ctx = await requireAuth();
  const page = await loadEventPage(slug, ctx.userId);
  if (!page) return { title: "Shop not found" };

  return {
    title: `Shop · ${page.event.artistName} · ${page.event.venueCity}`,
  };
}

/**
 * Event-scoped commerce hub. Lives inside the artist takeover so the fan never leaves
 * the show's visual world between verification and purchase.
 */
export default async function EventShopPage(props: PageProps<"/event/[slug]/shop">) {
  const { slug } = await props.params;
  const ctx = await requireAuth(`/event/${slug}/shop`);
  const page = await loadEventPage(slug, ctx.userId);

  if (!page) notFound();

  const { event, timing, isVerifiedAttendee, theme } = page;
  const [{ dropSections, standaloneProducts }, cartCount, bundleSections] = await Promise.all([
    loadEventShopCatalog(event, ctx.userId),
    countCartItems(ctx.userId),
    listActiveBundlesForEvent(event.id, event.artistId),
  ]);

  const hasCatalog =
    dropSections.length > 0 || standaloneProducts.length > 0 || bundleSections.length > 0;
  const activeFlash = dropSections.find(
    (section) => section.isFlash && !section.expired && !section.notStarted && section.drop.endsAt,
  );

  const storeOpen = isAttendeeStoreOpen(timing.state);

  const shopTitle =
    timing.state === "upcoming"
      ? "What's coming tonight"
      : timing.state === "recently_ended"
        ? "Complete your collection"
        : timing.state === "archived"
          ? "From this show"
          : "Tonight's Drop";

  const shopSubtitle = !isVerifiedAttendee
    ? timing.state === "upcoming"
      ? "Preview what's waiting. Attendee-only pieces unlock when you're verified inside."
      : "Verify at the venue to unlock pieces made for this room."
    : storeOpen
      ? "Attendee-exclusive pieces and post-show drops are unlocked for you."
      : "The attendee store has closed. Your credential and past purchases remain in My Shows.";

  return (
    <div className="pb-safe-tabs">
      <EventShopHeader
        event={event}
        theme={theme}
        title={shopTitle}
        subtitle={shopSubtitle}
        backHref={`/event/${slug}`}
        backLabel="← Back to the show"
      />

      <EventCommerceBody className="space-y-8 pt-6">
        {isVerifiedAttendee && storeOpen && hasCatalog && <EventShopUnlockBanner />}

        {timing.state === "recently_ended" &&
          isVerifiedAttendee &&
          timing.postShowClosesAt &&
          storeOpen && <EventShopPostShowBanner closesAt={timing.postShowClosesAt.toISOString()} />}

        {!storeOpen && isVerifiedAttendee && timing.state === "archived" && <EventShopClosedBanner />}

        {activeFlash?.drop.endsAt && (
          <EventShopFlashBanner endsAt={activeFlash.drop.endsAt.toISOString()} />
        )}

        {!hasCatalog ? (
          <EventShopEmptyState eventSlug={slug} artistName={event.artistName} />
        ) : (
          <>
            {dropSections.map(({ drop, products, expired, isFlash, notStarted }) => (
              <EventShopDropSection
                key={drop.id}
                eventSlug={slug}
                artistId={drop.artistId}
                drop={drop}
                products={products}
                expired={expired}
                isFlash={isFlash}
                notStarted={notStarted}
                storeOpen={storeOpen}
                timezone={event.timezone}
                dropExclusivity={drop.exclusivityType}
                venueCity={event.venueCity}
                eventStartsAt={event.startsAt}
              />
            ))}

            {bundleSections.map(({ bundle, items, savingsCents }) => (
              <EventShopBundleSection
                key={bundle.id}
                eventSlug={slug}
                artistId={event.artistId}
                bundle={bundle}
                items={items}
                savingsCents={savingsCents}
              />
            ))}

            {standaloneProducts.length > 0 && (
              <EventShopStandaloneSection
                eventSlug={slug}
                storeOpen={storeOpen}
                products={standaloneProducts.map(({ product, eligibility }) => ({
                  product: {
                    id: product.id,
                    slug: product.slug,
                    name: product.name,
                    tagline: product.tagline,
                    images: product.images,
                    priceCents: product.basePriceCents,
                    accessType: product.accessType,
                    category: product.category,
                    artistId: product.artistId,
                    eligibility,
                  },
                  eligibility,
                }))}
              />
            )}
          </>
        )}
      </EventCommerceBody>

      <EventShopDock cartCount={cartCount} visible={cartCount > 0 || hasCatalog} />
    </div>
  );
}
