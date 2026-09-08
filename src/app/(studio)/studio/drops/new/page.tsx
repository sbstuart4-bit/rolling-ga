import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ArtistGuidedDemoHighlight } from "@/components/demo/artist-guided-demo-highlight";
import { Button } from "@/components/ui/button";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { CreateFlashDropForm } from "@/components/studio/create-flash-drop-form";
import { MARISOL_BROOKLYN_EVENT_ID } from "@/lib/demo-user-ids";
import { isActivatableCohortStage } from "@/lib/activation/audience";
import type { CohortFunnelStage } from "@/lib/relationship-intelligence/types";
import { listEventsForArtist } from "@/server/events/queries";
import { listProductsForArtist } from "@/server/catalog/queries";
import { buildActivationAudiencePreview } from "@/server/activation/queries";

export const metadata: Metadata = { title: "Create Flash Drop — Artist Studio" };

function resolveDropDefaults(searchParams: {
  event?: string;
  prefill?: string;
  cohort?: string;
}) {
  const eventId = searchParams.event ?? MARISOL_BROOKLYN_EVENT_ID;
  const cohortStage =
    searchParams.cohort && isActivatableCohortStage(searchParams.cohort)
      ? searchParams.cohort
      : searchParams.prefill === "brooklyn-encore"
        ? ("connected" as CohortFunnelStage)
        : undefined;

  if (!cohortStage && searchParams.prefill !== "brooklyn-encore") return undefined;

  return {
    title: "Brooklyn Encore Drop",
    description: "For fans connected at Marisol Reyes · A Tender Night · Brooklyn.",
    eventId,
    durationMinutes: "2880",
    productIds: ["prd_mr_print"],
    cohortStage,
  };
}

export default async function CreateFlashDropPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; prefill?: string; cohort?: string }>;
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
  const audiencePreview =
    defaults?.cohortStage && defaults.eventId
      ? await buildActivationAudiencePreview(artistId, defaults.eventId, defaults.cohortStage)
      : null;

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
          {defaults?.cohortStage
            ? "Activate a show relationship cohort with a timed drop — preview audience and eligibility before publishing."
            : "A flash drop goes live immediately for verified attendees at a selected show. It expires on the window you set."}
        </p>
      </div>

      <CreateFlashDropForm
        artistId={artistId}
        events={events}
        products={products}
        defaults={defaults}
        audienceContext={
          audiencePreview
            ? {
                cohortStage: audiencePreview.cohortStage,
                audienceLabel: audiencePreview.audienceLabel,
                eligibleFanCount: audiencePreview.eligibleFanCount,
                originShowLabel: `${audiencePreview.tourName ?? "Show"} · ${audiencePreview.venueCity}`,
                artistName: audiencePreview.artistName,
              }
            : undefined
        }
      />
    </div>
  );
}
