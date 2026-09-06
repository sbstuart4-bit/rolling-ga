import { AboutBelief } from "@/components/marketing/about/about-belief";
import { AboutBuilding } from "@/components/marketing/about/about-building";
import { AboutClosing } from "@/components/marketing/about/about-closing";
import { AboutHero } from "@/components/marketing/about/about-hero";
import { AboutProblem } from "@/components/marketing/about/about-problem";
import { AboutWhereWeAre } from "@/components/marketing/about/about-where-we-are";
import { AboutWhyMerch } from "@/components/marketing/about/about-why-merch";

/** Company story and thesis — /about */
export function AboutPage() {
  return (
    <>
      <AboutHero />
      <AboutProblem />
      <AboutBelief />
      <AboutWhyMerch />
      <AboutBuilding />
      <AboutWhereWeAre />
      <AboutClosing />
    </>
  );
}
