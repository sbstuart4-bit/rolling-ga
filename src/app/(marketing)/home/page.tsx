import type { Metadata } from "next";
import { HomePage } from "@/components/marketing/home-page";
import { MarketingStickyCta } from "@/components/marketing/marketing-sticky-cta";

export const metadata: Metadata = {
  title: "The show ends. The connection doesn't.",
  description:
    "Rolling GA turns concert attendance into a verified fan relationship — unlocking exclusive merch, show-specific experiences and new commerce long after the encore.",
  alternates: { canonical: "/" },
};

export default function MarketingHomePage() {
  return (
    <div className="pb-20 md:pb-0">
      <HomePage />
      <MarketingStickyCta />
    </div>
  );
}
