import { PartnersDesignModel } from "@/components/marketing/partners/partners-design-model";
import { PartnersHero } from "@/components/marketing/partners/partners-hero";
import { PartnersPilotCta } from "@/components/marketing/partners/partners-pilot-cta";
import { PartnersPilotQuestions } from "@/components/marketing/partners/partners-pilot-questions";
import { PartnersRollingGaRole } from "@/components/marketing/partners/partners-rolling-ga-role";
import { PartnersStakeholders } from "@/components/marketing/partners/partners-stakeholders";

/** Customer-facing /partners — ecosystem pilot invitation. */
export function PartnersPage() {
  return (
    <>
      <PartnersHero />
      <PartnersStakeholders />
      <PartnersPilotQuestions />
      <PartnersDesignModel />
      <PartnersRollingGaRole />
      <PartnersPilotCta />
    </>
  );
}
