import type { Metadata } from "next";
import { ArtistTakeover } from "@/components/artist/artist-takeover";
import { requireAuth } from "@/server/auth/request";
import { buildHomeFeed } from "@/server/home/feed";
import { loadEventPage } from "@/server/events/context";
import { heroImageFor } from "@/lib/theme";
import { demoNow } from "@/server/demo/clock";
import { getActiveDemoScenarioContext } from "@/server/demo/scenario-state";
import { getFanShowContextSlug } from "@/server/fans/show-context";
import { HomeFeaturedShow, HomeMyShowsPreview } from "@/components/fan/home/home-sections";

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
  const scoped = Boolean(eventPage);

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
    : null;

  const featuredHero = eventPage ? heroImageFor(eventPage.theme) : null;

  const content = (
    <div className="mx-auto max-w-lg space-y-8 px-5 pb-10 pt-6">
      {featured && eventPage ? (
        <HomeFeaturedShow
          event={featured}
          hero={featuredHero}
          fanExperience={eventPage.fanExperience}
          slug={featured.slug}
          timingState={eventPage.timing.state}
          scoped={scoped}
          postShowClosesAt={eventPage.timing.postShowClosesAt}
          artistSlug={featured.artistSlug}
        />
      ) : (
        <div className="py-16 text-center">
          <p className="font-display text-xl">Nothing live right now</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Shows appear here when they go live.
          </p>
        </div>
      )}

      {!scoped && <HomeMyShowsPreview shows={feed.recentShows} />}
    </div>
  );

  if (eventPage) {
    return <ArtistTakeover theme={eventPage.theme}>{content}</ArtistTakeover>;
  }

  return content;
}
