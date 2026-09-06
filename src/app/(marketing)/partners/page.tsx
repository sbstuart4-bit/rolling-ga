import type { Metadata } from "next";
import { PartnersPage } from "@/components/marketing/partners/partners-page";

export const metadata: Metadata = {
  title: "Partners — Rolling GA",
  description:
    "Rolling GA is looking for artists, venues, promoters, merch companies, and live-music operators to pilot a digital-first show-night merch experience together.",
};

export default function PartnersRoute() {
  return <PartnersPage />;
}
