import type { Metadata } from "next";
import { HowItWorksPage } from "@/components/marketing/how-it-works/how-it-works-page";

export const metadata: Metadata = {
  title: "How it works — Rolling GA",
  description:
    "The show is the beginning. Discover, unlock, shop, and receive — then keep the relationship going with the artist.",
};

export default function HowItWorksRoute() {
  return <HowItWorksPage />;
}
