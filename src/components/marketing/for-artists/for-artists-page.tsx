import { ForArtistsHero } from "@/components/marketing/for-artists/for-artists-hero";
import { ForArtistsLearn } from "@/components/marketing/for-artists/for-artists-learn";
import { ForArtistsMerchOpportunity } from "@/components/marketing/for-artists/for-artists-merch-opportunity";
import { ForArtistsPilotCta } from "@/components/marketing/for-artists/for-artists-pilot-cta";
import { ForArtistsRelationship } from "@/components/marketing/for-artists/for-artists-relationship";

/** Customer-facing /for-artists — why pilot Rolling GA. */
export function ForArtistsPage() {
  return (
    <>
      <ForArtistsHero />
      <ForArtistsMerchOpportunity />
      <ForArtistsRelationship />
      <ForArtistsLearn />
      <ForArtistsPilotCta />
    </>
  );
}
