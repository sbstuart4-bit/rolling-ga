import type { Metadata } from "next";
import { ForFansPage } from "@/components/marketing/for-fans/for-fans-page";

export const metadata: Metadata = {
  title: "For fans — Rolling GA",
  description:
    "The show stays with you. Discover show merch, unlock what's available when you're there, and keep a record of the nights you were part of.",
};

export default function ForFansRoute() {
  return <ForFansPage />;
}
