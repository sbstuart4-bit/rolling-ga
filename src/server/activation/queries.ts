import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { audienceSegments, drops, events, orderItems, orders, venues } from "@/db/schema";
import {
  computeActivationResults,
  type ActivationOrderLine,
  type ActivationResultsMetrics,
} from "@/lib/activation/revenue";
import {
  formatShowCohortAudienceLabel,
  isFanInAudienceSnapshot,
  isShowCohortParams,
  SHOW_COHORT_RULE_KIND,
  snapshotUserIdsFromParams,
} from "@/lib/activation/audience";
import type { AudienceRuleParams } from "@/lib/types";
import type { CohortFunnelStage } from "@/lib/relationship-intelligence/types";
import { fanMatchesStage } from "@/lib/relationship-intelligence/types";
import { analyzeShowCohort } from "@/server/studio/show-cohort-analysis";
import { getEventById } from "@/server/events/queries";
import { demoNow } from "@/server/demo/clock";

export interface ActivationAudiencePreview {
  originEventId: string;
  cohortStage: CohortFunnelStage;
  audienceLabel: string;
  eligibleFanCount: number;
  venueCity: string;
  tourName: string | null;
  artistName: string;
}

export interface ActivationDropSummary {
  dropId: string;
  title: string;
  status: string;
  startsAt: Date;
  endsAt: Date | null;
  audienceLabel: string;
  cohortStage: CohortFunnelStage;
  originEventId: string;
  eligibleFans: number;
  purchasingFans: number;
  activatedRevenueCents: number;
  isLive: boolean;
}

export async function resolveCohortMemberUserIds(
  artistId: string,
  originEventId: string,
  cohortStage: CohortFunnelStage,
): Promise<string[]> {
  const event = await getEventById(originEventId);
  if (!event || event.artistId !== artistId) return [];

  const analysis = await analyzeShowCohort(event, false);
  return analysis.memberships
    .filter((m) => fanMatchesStage(m, cohortStage))
    .map((m) => m.userId);
}

export async function buildActivationAudiencePreview(
  artistId: string,
  originEventId: string,
  cohortStage: CohortFunnelStage,
): Promise<ActivationAudiencePreview | null> {
  const event = await getEventById(originEventId);
  if (!event || event.artistId !== artistId) return null;

  const memberIds = await resolveCohortMemberUserIds(artistId, originEventId, cohortStage);

  return {
    originEventId,
    cohortStage,
    audienceLabel: formatShowCohortAudienceLabel(
      { originEventId, cohortStage },
      event.venueCity,
    ),
    eligibleFanCount: memberIds.length,
    venueCity: event.venueCity,
    tourName: event.tourName ?? null,
    artistName: event.artistName,
  };
}

export async function loadAudienceSegment(segmentId: string) {
  const [row] = await db
    .select()
    .from(audienceSegments)
    .where(eq(audienceSegments.id, segmentId))
    .limit(1);
  return row ?? null;
}

export async function isFanEligibleForDropAudience(
  userId: string | null | undefined,
  audienceSegmentId: string | null,
): Promise<{ eligible: boolean; reason?: string }> {
  if (!audienceSegmentId) return { eligible: true };
  if (!userId) {
    return { eligible: false, reason: "Sign in to access this drop." };
  }

  const segment = await loadAudienceSegment(audienceSegmentId);
  if (!segment) return { eligible: true };

  if (segment.ruleKind === SHOW_COHORT_RULE_KIND) {
    const params = segment.params as AudienceRuleParams | null;
    if (!isShowCohortParams(params)) {
      return { eligible: false, reason: "This drop audience is not available." };
    }
    if (!isFanInAudienceSnapshot(userId, params)) {
      return { eligible: false, reason: "This drop is for a specific show audience." };
    }
    return { eligible: true };
  }

  return { eligible: true };
}

export async function loadActivationDropIdsForEvent(
  artistId: string,
  originEventId: string,
): Promise<Set<string>> {
  const rows = await db
    .select({ dropId: drops.id, params: audienceSegments.params, ruleKind: audienceSegments.ruleKind })
    .from(drops)
    .innerJoin(audienceSegments, eq(audienceSegments.id, drops.audienceSegmentId))
    .where(
      and(
        eq(drops.artistId, artistId),
        eq(audienceSegments.ruleKind, SHOW_COHORT_RULE_KIND),
      ),
    );

  const ids = new Set<string>();
  for (const row of rows) {
    const params = row.params as AudienceRuleParams | null;
    if (params?.originEventId === originEventId) {
      ids.add(row.dropId);
    }
  }
  return ids;
}

async function loadPaidActivationLines(dropId: string): Promise<ActivationOrderLine[]> {
  const rows = await db
    .select({
      dropId: orderItems.dropId,
      lineTotalCents: orderItems.totalCents,
      placedAt: orders.placedAt,
      userId: orders.userId,
      orderId: orders.id,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(
      and(
        eq(orderItems.dropId, dropId),
        inArray(orders.status, ["paid", "allocated", "picking", "packed", "ready_to_ship", "shipped", "delivered"]),
      ),
    );

  return rows.map((r) => ({
    dropId: r.dropId,
    lineTotalCents: r.lineTotalCents,
    placedAt: r.placedAt,
    userId: r.userId,
    orderId: r.orderId,
  }));
}

export async function loadActivationResults(
  artistId: string,
  dropId: string,
): Promise<ActivationResultsMetrics | null> {
  const [drop] = await db
    .select({
      id: drops.id,
      artistId: drops.artistId,
      audienceSegmentId: drops.audienceSegmentId,
    })
    .from(drops)
    .where(eq(drops.id, dropId))
    .limit(1);

  if (!drop || drop.artistId !== artistId || !drop.audienceSegmentId) return null;

  const segment = await loadAudienceSegment(drop.audienceSegmentId);
  if (!segment || segment.ruleKind !== SHOW_COHORT_RULE_KIND) return null;

  const params = segment.params as AudienceRuleParams;
  const eligibleFans =
    params.eligibleCountAtPublish ?? snapshotUserIdsFromParams(params).length;

  const lines = await loadPaidActivationLines(dropId);
  const metrics = computeActivationResults(eligibleFans, lines);
  return { ...metrics, dropId };
}

export async function listActivationsForEvent(
  artistId: string,
  originEventId: string,
): Promise<ActivationDropSummary[]> {
  const rows = await db
    .select({
      drop: drops,
      segment: audienceSegments,
      venueCity: venues.city,
    })
    .from(drops)
    .innerJoin(audienceSegments, eq(audienceSegments.id, drops.audienceSegmentId))
    .leftJoin(events, eq(events.id, drops.eventId))
    .leftJoin(venues, eq(venues.id, events.venueId))
    .where(
      and(
        eq(drops.artistId, artistId),
        eq(audienceSegments.ruleKind, SHOW_COHORT_RULE_KIND),
      ),
    )
    .orderBy(drops.startsAt);

  const now = demoNow();
  const summaries: ActivationDropSummary[] = [];

  for (const row of rows) {
    const params = row.segment.params as AudienceRuleParams;
    if (params.originEventId !== originEventId) continue;

    const results = await loadActivationResults(artistId, row.drop.id);
    const eligibleFans =
      params.eligibleCountAtPublish ?? snapshotUserIdsFromParams(params).length;
    const isLive =
      row.drop.status === "live" &&
      row.drop.startsAt <= now &&
      (row.drop.endsAt === null || row.drop.endsAt > now);

    summaries.push({
      dropId: row.drop.id,
      title: row.drop.title,
      status: row.drop.status,
      startsAt: row.drop.startsAt,
      endsAt: row.drop.endsAt,
      audienceLabel: formatShowCohortAudienceLabel(params, row.venueCity),
      cohortStage: params.cohortStage as CohortFunnelStage,
      originEventId,
      eligibleFans,
      purchasingFans: results?.purchasingFans ?? 0,
      activatedRevenueCents: results?.activatedRevenueCents ?? 0,
      isLive,
    });
  }

  return summaries.sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());
}

export async function createShowCohortAudienceSegment(input: {
  artistId: string;
  originEventId: string;
  cohortStage: CohortFunnelStage;
  snapshotUserIds: string[];
  venueCity: string;
  segmentId?: string;
}) {
  const now = demoNow();
  const [segment] = await db
    .insert(audienceSegments)
    .values({
      id: input.segmentId,
      artistId: input.artistId,
      name: `${input.venueCity} ${input.cohortStage} activation`,
      description: `Frozen audience snapshot for show cohort activation.`,
      ruleKind: SHOW_COHORT_RULE_KIND,
      params: {
        originEventId: input.originEventId,
        cohortStage: input.cohortStage,
        snapshotUserIds: input.snapshotUserIds,
        snapshotAt: now.toISOString(),
        eligibleCountAtPublish: input.snapshotUserIds.length,
      },
      isDemo: true,
    })
    .returning({ id: audienceSegments.id });

  return segment.id;
}
