import type { Metadata } from "next";
import { ForArtistsPage } from "@/components/marketing/for-artists/for-artists-page";

export const metadata: Metadata = {
  title: "For artists — Rolling GA",
  description:
    "The merch table shouldn't be the limit. Pilot Rolling GA to test show-night commerce and a longer relationship with the fans who were actually there.",
};

export default function ForArtistsRoute() {
  return <ForArtistsPage />;
}
