import type { Metadata } from "next";
import { AboutPage } from "@/components/marketing/about/about-page";

export const metadata: Metadata = {
  title: "About — Rolling GA",
  description:
    "The show is the beginning. Rolling GA is being built to help artists and fans carry live-music connection beyond the night itself.",
};

export default function AboutRoute() {
  return <AboutPage />;
}
