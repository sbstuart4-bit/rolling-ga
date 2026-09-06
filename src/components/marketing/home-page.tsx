import { HomeArtistValue } from "@/components/marketing/home/home-artist-value";
import { HomeFanRelationship } from "@/components/marketing/home/home-fan-relationship";
import { HomeHero } from "@/components/marketing/home/home-hero";
import { HomeHowItWorks } from "@/components/marketing/home/home-how-it-works";
import { HomePilotCta } from "@/components/marketing/home/home-pilot-cta";
import { HomeProblem } from "@/components/marketing/home/home-problem";

/**
 * Approved marketing homepage — docs/website-reference/homepage-approved.png
 *
 * Legacy six-beat Degens homepage components remain in `beats/` but are not rendered.
 */
export function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeProblem />
      <HomeHowItWorks />
      <HomeArtistValue />
      <HomeFanRelationship />
      <HomePilotCta />
    </>
  );
}
