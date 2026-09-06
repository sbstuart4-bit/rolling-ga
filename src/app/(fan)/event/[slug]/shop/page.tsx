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
import {
  canPreviewShop,
  canPurchaseShowExclusives,
  eventShopSubtitle,
  eventShopTitle,
} from "@/lib/event-shop-access";
import { requireAuth } from "@/server/auth/request";
import { demoNow } from "@/server/demo/clock";
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

export default async function EventShopPage(props: PageProps<"/event/[slug]/shop">) {
  const { slug } = await props.params;
  const ctx = await requireAuth(`/event/${slug}/shop`);
  const page = await loadEventPage(slug, ctx.userId);

  if (!page) notFound();

  const { event, timing, theme, fanExperience } = page;
  const now = demoNow();
  const previewShop = canPreviewShop(fanExperience.access);
  const purchaseOpen = canPurchaseShowExclusives(fanExperience.access);

  const [{ dropSections, standaloneProducts }, cartCount, bundleSections] = await Promise.all([
    loadEventShopCatalog(event, ctx.userId),
    countCartItems(ctx.userId),
    listActiveBundlesForEvent(event.id, event.artistId),
  ]);

  const visibleDropSections = dropSections.filter(
    (section) => timing.state !== "upcoming" || !section.notStarted,
  );
  const visibleStandaloneProducts = previewShop ? standaloneProducts : [];

  const hasCatalog =
    visibleDropSections.length > 0 ||
    visibleStandaloneProducts.length > 0 ||
    bundleSections.length > 0;
  const activeFlash = visibleDropSections.find(
    (section) => section.isFlash && !section.expired && !section.notStarted && section.drop.endsAt,
  );

  const storeOpen = isAttendeeStoreOpen(timing.state);

  const shopTitle = eventShopTitle(timing.state, event.startsAt, now);
  const shopSubtitle = eventShopSubtitle(timing.state, fanExperience, storeOpen);
  const shopUnlocked = purchaseOpen && storeOpen;
  const shopLockedEarly = fanExperience.access === "discover_only" && timing.state === "upcoming";

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
        {shopUnlocked && hasCatalog && <EventShopUnlockBanner />}

        {timing.state === "recently_ended" &&
          purchaseOpen &&
          timing.postShowClosesAt &&
          storeOpen && <EventShopPostShowBanner closesAt={timing.postShowClosesAt.toISOString()} />}

        {!storeOpen && purchaseOpen && timing.state === "archived" && (
          <EventShopClosedBanner />
        )}

        {activeFlash?.drop.endsAt && (
          <EventShopFlashBanner endsAt={activeFlash.drop.endsAt.toISOString()} />
        )}

        {!hasCatalog || shopLockedEarly ? (
          <EventShopEmptyState
            eventSlug={slug}
            artistName={event.artistName}
            message={
              shopLockedEarly
                ? "Show-exclusive preview opens closer to show day. Browse Gold Hour tour merch on Drops."
                : undefined
            }
          />
        ) : (
          <>
            {visibleDropSections.map(({ drop, products, expired, isFlash, notStarted }) => (
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
                eventId={event.id}
                bundle={bundle}
                items={items}
                savingsCents={savingsCents}
                canPurchase={shopUnlocked}
              />
            ))}

            {visibleStandaloneProducts.length > 0 && (
              <EventShopStandaloneSection
                eventSlug={slug}
                storeOpen={storeOpen}
                products={visibleStandaloneProducts.map(({ product, eligibility }) => ({
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
