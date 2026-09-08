import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArtistGuidedDemoHighlight } from "@/components/demo/artist-guided-demo-highlight";
import { ActivationResultsDashboard } from "@/components/studio/activation-results-dashboard";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { db } from "@/db";
import { audienceSegments, dropProducts, drops, events, products, tours, venues } from "@/db/schema";
import {
  buildActivationAudiencePreview,
  loadActivationResults,
} from "@/server/activation/queries";
import { isShowCohortParams, SHOW_COHORT_RULE_KIND } from "@/lib/activation/audience";
import type { AudienceRuleParams } from "@/lib/types";

export const metadata: Metadata = { title: "Drop — Artist Studio" };

export default async function StudioDropDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], `/studio/drops/${id}`);
  const artistId = defaultArtistId(ctx);
  if (!artistId) return null;

  const [drop] = await db.select().from(drops).where(eq(drops.id, id)).limit(1);
  if (!drop || drop.artistId !== artistId) notFound();

  const [segment, productRows, eventRow] = await Promise.all([
    drop.audienceSegmentId
      ? db
          .select()
          .from(audienceSegments)
          .where(eq(audienceSegments.id, drop.audienceSegmentId))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : Promise.resolve(null),
    db
      .select({ name: products.name })
      .from(dropProducts)
      .innerJoin(products, eq(products.id, dropProducts.productId))
      .where(eq(dropProducts.dropId, drop.id)),
    drop.eventId
      ? db
          .select({
            venueCity: venues.city,
            tourName: tours.name,
          })
          .from(events)
          .innerJoin(tours, eq(tours.id, events.tourId))
          .innerJoin(venues, eq(venues.id, events.venueId))
          .where(and(eq(events.id, drop.eventId), eq(events.artistId, artistId)))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : Promise.resolve(null),
  ]);

  const params_ = segment?.params as AudienceRuleParams | null;
  const audience =
    segment?.ruleKind === SHOW_COHORT_RULE_KIND &&
    isShowCohortParams(params_) &&
    drop.eventId
      ? await buildActivationAudiencePreview(artistId, params_.originEventId, params_.cohortStage)
      : null;

  const results = await loadActivationResults(artistId, drop.id);
  const originShowLabel = eventRow
    ? `${eventRow.tourName ?? "Show"} · ${eventRow.venueCity}`
    : "—";

  const eligibleFans =
    params_?.eligibleCountAtPublish ?? params_?.snapshotUserIds?.length ?? 0;

  const metrics = results ?? {
    dropId: drop.id,
    eligibleFans,
    purchasingFans: 0,
    orderCount: 0,
    conversionRate: null,
    activatedRevenueCents: 0,
    averageOrderValueCents: null,
    repeatPurchasers: 0,
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <ArtistGuidedDemoHighlight />
      <ActivationResultsDashboard
        drop={{
          id: drop.id,
          title: drop.title,
          description: drop.description,
          status: drop.status,
          startsAt: drop.startsAt,
          endsAt: drop.endsAt,
          productNames: productRows.map((p) => p.name),
        }}
        audience={audience}
        results={metrics}
        originShowLabel={originShowLabel}
      />
    </div>
  );
}
