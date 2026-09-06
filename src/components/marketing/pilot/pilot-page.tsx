import { PilotCapabilities } from "@/components/marketing/pilot/pilot-capabilities";
import { PilotConversation } from "@/components/marketing/pilot/pilot-conversation";
import { PilotHero } from "@/components/marketing/pilot/pilot-hero";
import { PilotNeeds } from "@/components/marketing/pilot/pilot-needs";
import { PilotProcess } from "@/components/marketing/pilot/pilot-process";
import { PilotQuestions } from "@/components/marketing/pilot/pilot-questions";
import { PilotStakeholders } from "@/components/marketing/pilot/pilot-stakeholders";

/** Pilot conversation page — /pilot */
export function PilotPage() {
  return (
    <>
      <PilotHero />
      <PilotProcess />
      <PilotQuestions />
      <PilotStakeholders />
      <PilotCapabilities />
      <PilotNeeds />
      <PilotConversation />
    </>
  );
}
