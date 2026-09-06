import type { Metadata } from "next";
import { HomePage } from "@/components/marketing/home-page";

export const metadata: Metadata = {
  title: "Merch without the merch line.",
  description:
    "Fans shop from their phones at the show. Rolling GA is built and seeking artists and industry partners for pilots.",
  alternates: { canonical: "/" },
};

export default function MarketingHomePage() {
  return <HomePage />;
}
