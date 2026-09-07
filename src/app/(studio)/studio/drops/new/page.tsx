import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ArtistGuidedDemoHighlight } from "@/components/demo/artist-guided-demo-highlight";
import { Button } from "@/components/ui/button";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { CreateFlashDropForm } from "@/components/studio/create-flash-drop-form";
import { MARISOL_BROOKLYN_EVENT_ID } from "@/lib/demo-user-ids";
import { listEventsForArtist } from "@/server/events/queries";
import { listProductsForArtist } from "@/server/catalog/queries";

export const metadata: Metadata = { title: "Create Flash Drop — Artist Studio" };

function resolveDropDefaults(searchParams: {
  event?: string;
  prefill?: string;
}) {
  if (searchParams.prefill !== "brooklyn-encore") return undefined;

  return {
    title: "48-Hour Brooklyn Encore Drop",
    description: "For fans connected at Marisol Reyes · A Tender Night · Brooklyn.",
    eventId: searchParams.event ?? MARISOL_BROOKLYN_EVENT_ID,
    durationMinutes: "2880",
    productIds: ["prd_mr_city_tee"],
  };
}

export default async function CreateFlashDropPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; prefill?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], "/studio/drops/new");
  const artistId = defaultArtistId(ctx);

  if (!artistId) return null;

  const [events, products] = await Promise.all([
    listEventsForArtist(artistId),
    listProductsForArtist(artistId),
  ]);

  const defaults = resolveDropDefaults(params);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <ArtistGuidedDemoHighlight />
      <div className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href="/studio/drops">
            <ArrowLeft className="size-4" aria-hidden />
            Drops
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Create flash drop</h1>
        <p className="text-sm text-muted-foreground">
          A flash drop goes live immediately for verified attendees at a selected show. It expires
          on the window you set.
        </p>
      </div>

      <CreateFlashDropForm
        artistId={artistId}
        events={events}
        products={products}
        defaults={defaults}
      />
    </div>
  );
}
