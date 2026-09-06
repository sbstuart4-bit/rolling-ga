import { HowItWorksArtists } from "@/components/marketing/how-it-works/how-it-works-artists";
import { HowItWorksCommerceJourney } from "@/components/marketing/how-it-works/how-it-works-commerce-journey";
import { HowItWorksDifference } from "@/components/marketing/how-it-works/how-it-works-difference";
import { HowItWorksHero } from "@/components/marketing/how-it-works/how-it-works-hero";
import { HowItWorksPilotCta } from "@/components/marketing/how-it-works/how-it-works-pilot-cta";

/** Customer-facing /how-it-works — complete Rolling GA journey. */
export function HowItWorksPage() {
  return (
    <>
      <HowItWorksHero />
      <HowItWorksCommerceJourney />
      <HowItWorksDifference />
      <HowItWorksArtists />
      <HowItWorksPilotCta />
    </>
  );
}
