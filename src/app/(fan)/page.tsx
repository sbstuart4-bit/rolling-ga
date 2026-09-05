import type { Metadata } from "next";
import { ArtistTakeover } from "@/components/artist/artist-takeover";
import { requireAuth } from "@/server/auth/request";
import { buildHomeFeed, loadNewDropsForArtist } from "@/server/home/feed";
import { listDropProducts } from "@/server/catalog/queries";
import { loadEventPage } from "@/server/events/context";
import { heroImageFor } from "@/lib/theme";
import { resolveDropArtwork } from "@/lib/demo-drop-artwork";
import {
  isDropVisibleInDemoScenario,
  shouldShowDropCountdown,
} from "@/lib/merch-experience/drop-presentation";
import { demoNow } from "@/server/demo/clock";
import { getActiveDemoScenarioContext } from "@/server/demo/scenario-state";
import { getFanShowContextSlug } from "@/server/fans/show-context";
import {
  HomeDropsSection,
  HomeFeaturedShow,
  HomeMyShowsPreview,
  HomeUpcomingSection,
} from "@/components/fan/home/home-sections";

export const metadata: Metadata = { title: "Live — Rolling GA" };

export default async function HomePage() {
  const ctx = await requireAuth("/");
  const now = demoNow();

  const [demoScenario, fanShowSlug, feed] = await Promise.all([
    getActiveDemoScenarioContext(),
    getFanShowContextSlug(),
    buildHomeFeed(ctx.userId, now),
  ]);

  const scopeSlug = demoScenario?.show.slug ?? fanShowSlug;
  const eventPage = scopeSlug ? await loadEventPage(scopeSlug, ctx.userId) : null;
  const scopeArtistId = eventPage?.event.artistId ?? demoScenario?.show.artistId;
  const scoped = Boolean(eventPage);

  const liveEvents = scopeArtistId
    ? feed.liveEvents.filter((event) => event.artistId === scopeArtistId)
    : feed.liveEvents;
  const upcomingEvents = scopeArtistId
    ? feed.upcomingEvents.filter((event) => event.artistId === scopeArtistId)
    : feed.upcomingEvents;

  const featuredFromFeed = liveEvents[0] ?? upcomingEvents[0] ?? null;
  const featured = eventPage
    ? {
        id: eventPage.event.id,
        slug: eventPage.event.slug,
        artistName: eventPage.event.artistName,
        artistSlug: eventPage.event.artistSlug,
        venueCity: eventPage.event.venueCity,
        venueName: eventPage.event.venueName,
        startsAt: eventPage.event.startsAt,
        endsAt: eventPage.event.endsAt,
        timezone: eventPage.event.timezone,
        tourName: eventPage.event.tourName,
      }
    : featuredFromFeed;

  const featuredHero = eventPage ? heroImageFor(eventPage.theme) : null;

  let dropFeed: Array<{
    slug: string;
    title: string;
    artworkUrl: string | null;
    endsAt: Date | null;
    artistId: string;
    artistName: string;
    showCountdown: boolean;
  }> = [];

  if (scopeArtistId) {
    const artistDrops = await loadNewDropsForArtist(scopeArtistId, now);
    const visibleDrops = demoScenario
      ? artistDrops.filter((drop) => isDropVisibleInDemoScenario(drop, demoScenario.show.eventId))
      : artistDrops.filter(
          (drop) => drop.eventId === null || drop.eventId === eventPage?.event.id,
        );

    dropFeed = await Promise.all(
      visibleDrops.map(async (drop) => {
        const products = await listDropProducts(drop.id);
        const hero = products[0];
        return {
          slug: drop.slug,
          title: drop.title,
          artworkUrl: resolveDropArtwork({
            dropSlug: drop.slug,
            storedArtworkUrl: drop.artworkUrl,
            fallbackProductId: hero?.id,
            fallbackProductImages: hero?.images,
          }),
          endsAt: drop.endsAt,
          artistId: drop.artistId,
          artistName: drop.artistName,
          showCountdown: demoScenario
            ? shouldShowDropCountdown(drop, demoScenario.show.eventId, now)
            : drop.exclusivityType === "flash" || drop.exclusivityType === "post_show",
        };
      }),
    );
  } else {
    dropFeed = await Promise.all(
      feed.newDrops.map(async (drop) => {
        const products = await listDropProducts(drop.id);
        const hero = products[0];
        return {
          slug: drop.slug,
          title: drop.title,
          artworkUrl: resolveDropArtwork({
            dropSlug: drop.slug,
            storedArtworkUrl: drop.artworkUrl,
            fallbackProductId: hero?.id,
            fallbackProductImages: hero?.images,
          }),
          endsAt: drop.endsAt,
          artistId: drop.artistId,
          artistName: drop.artistName,
          showCountdown: drop.exclusivityType === "flash" || drop.exclusivityType === "post_show",
        };
      }),
    );
  }

  const hasFeatured = Boolean(featured && (eventPage || featuredFromFeed));
  const isLive = eventPage
    ? eventPage.timing.state === "live"
    : liveEvents.length > 0;

  const content = (
    <div className="mx-auto max-w-lg space-y-8 px-5 pb-10 pt-6">
      {hasFeatured && featured ? (
        <HomeFeaturedShow
          event={featured}
          hero={featuredHero}
          isVerified={eventPage?.isVerifiedAttendee ?? false}
          verificationOpen={eventPage?.verification.open ?? false}
          slug={featured.slug}
          isLive={isLive}
          scoped={scoped}
        />
      ) : (
        <div className="py-16 text-center">
          <p className="font-display text-xl">Nothing live right now</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Shows and drops appear here when they go live.
          </p>
        </div>
      )}

      <HomeUpcomingSection
        events={upcomingEvents}
        excludeSlug={featured?.slug}
        scoped={scoped}
      />

      <HomeDropsSection drops={dropFeed} eventSlug={featured?.slug} scoped={scoped} />

      {!scoped && <HomeMyShowsPreview shows={feed.recentShows} />}
    </div>
  );

  if (eventPage) {
    return <ArtistTakeover theme={eventPage.theme}>{content}</ArtistTakeover>;
  }

  return content;
}
