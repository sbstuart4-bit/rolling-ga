import type { Metadata } from "next";
import { PilotPage } from "@/components/marketing/pilot/pilot-page";

export const metadata: Metadata = {
  title: "Pilot",
  description:
    "Run one show with Rolling GA. Start a pilot conversation to test show-night merch, fan discovery, and the relationship that follows — in a real live environment.",
};

export default function Page() {
  return <PilotPage />;
}
