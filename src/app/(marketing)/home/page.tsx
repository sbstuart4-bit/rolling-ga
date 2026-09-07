import type { Metadata } from "next";
import { HomePage } from "@/components/marketing/home-page";

export const metadata: Metadata = {
  title: "More merch. Bigger moments. Longer relationships.",
  description:
    "Turn every show into more revenue and a lasting connection with your fans. Rolling GA is built and seeking artists and industry partners for pilots.",
  alternates: { canonical: "/" },
};

export default function MarketingHomePage() {
  return <HomePage />;
}
