import type { Metadata } from "next";
import { requireAuth } from "@/server/auth/request";
import { buildHomeFeed } from "@/server/home/feed";
import { listActiveDropsForEvent } from "@/server/catalog/queries";
import { loadEventPage } from "@/server/events/context";
import { heroImageFor } from "@/lib/theme";
import { resolveEventTheme } from "@/server/theme/resolve";
import {
  HomeDropsSection,
  HomeFeaturedShow,
  HomeMyShowsPreview,
  HomeUpcomingSection,
} from "@/components/fan/home/home-sections";

export default async function HomePage() {
  const ctx = await requireAuth("/");
  const feed = await buildHomeFeed(ctx.userId);
  const { liveEvents, upcomingEvents, recentShows, newDrops } = feed;

  const featured = liveEvents[0] ?? upcomingEvents[0] ?? null;
  let featuredContext = null;
  let featuredDrops: Awaited<ReturnType<typeof listActiveDropsForEvent>> = [];
  let featuredHero: string | null = null;

  if (featured) {
    featuredContext = await loadEventPage(featured.slug, ctx.userId);
    featuredDrops = await listActiveDropsForEvent(featured.id);
    if (featuredContext) {
      featuredHero = heroImageFor(featuredContext.theme);
    } else {
      const theme = await resolveEventTheme(featured.id);
      featuredHero = heroImageFor(theme);
    }
  }

  const dropFeed =
    featuredDrops.length > 0
      ? featuredDrops.map((drop) => ({
          slug: drop.slug,
          title: drop.title,
          artworkUrl: drop.artworkUrl,
          endsAt: drop.endsAt,
          artistId: drop.artistId,
          artistName: drop.artistName ?? featured!.artistName,
        }))
      : newDrops;

  const hasFeatured = Boolean(featured && featuredContext);

  return (
    <div className="mx-auto max-w-lg space-y-8 px-5 pb-10 pt-6">
      {hasFeatured ? (
        <HomeFeaturedShow
          event={featured!}
          hero={featuredHero}
          isVerified={featuredContext!.isVerifiedAttendee}
          verificationOpen={featuredContext!.verification.open}
          slug={featured!.slug}
          isLive={liveEvents.length > 0}
        />
      ) : (
        <div className="py-16 text-center">
          <p className="font-display text-xl">Nothing live right now</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Shows and drops appear here when they go live.
          </p>
        </div>
      )}

      <HomeUpcomingSection events={upcomingEvents} excludeSlug={featured?.slug} />

      <HomeDropsSection drops={dropFeed} eventSlug={featured?.slug} />

      <HomeMyShowsPreview shows={recentShows} />
    </div>
  );
}
