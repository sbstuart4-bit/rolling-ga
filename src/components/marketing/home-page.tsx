import { HomeArtistStudio } from "@/components/marketing/home/home-artist-studio";
import { HomeArtistValue } from "@/components/marketing/home/home-artist-value";
import { HomeExperienceDemo } from "@/components/marketing/home/home-experience-demo";
import { HomeFanRelationship } from "@/components/marketing/home/home-fan-relationship";
import { HomeHero } from "@/components/marketing/home/home-hero";
import { HomeHowItWorks } from "@/components/marketing/home/home-how-it-works";
import { HomePilotCta } from "@/components/marketing/home/home-pilot-cta";
import { HomeProblem } from "@/components/marketing/home/home-problem";

/**
 * Approved marketing homepage — Marisol Reyes demo artist, Rolling GA brand story.
 */
export function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeProblem />
      <HomeHowItWorks />
      <HomeExperienceDemo />
      <HomeFanRelationship />
      <HomeArtistValue />
      <HomeArtistStudio />
      <HomePilotCta />
    </>
  );
}
