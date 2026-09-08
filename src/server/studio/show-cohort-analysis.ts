import "server-only";

import { and, count, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { artistConsents, events, tours, users, verifiedAttendance } from "@/db/schema";
import {
  attributeOrderToEvent,
  postShowGmvWithinWindow,
  sumAttributedGmv,
} from "@/lib/fan-attribution";
import {
  aggregateFunnelCounts,
  buildCohortTimeline,
  buildPostShowWindows,
  classifyFanCohortMembership,
} from "@/lib/relationship-intelligence/metrics";
import type {
  CohortFanRow,
  CohortFunnelCounts,
  CohortTimelinePhase,
  FanCohortMembership,
  PostShowWindowMetrics,
  RelationshipOrigin,
} from "@/lib/relationship-intelligence/types";
import {
  fanMatchesStage,
  type CohortFunnelStage,
} from "@/lib/relationship-intelligence/types";
import type { getEventById } from "@/server/events/queries";
import {
  buildEventWindow,
  groupOrdersByUser,
  loadOrderLinesForArtist,
  loadVerifiedEventsByUser,
} from "./fan-relationship-queries-internals";

export interface ShowCohortAnalysis {
  event: NonNullable<Awaited<ReturnType<typeof getEventById>>>;
  isDemoData: boolean;
  funnel: CohortFunnelCounts;
  connectedAfterShow: number;
  showNightGmvCents: number;
  postShowGmv30DaysCents: number;
  postShowGmv90DaysCents: number;
  totalObservedGmvCents: number;
  repeatPurchaseRate: number | null;
  observedGmvPerVerifiedFanCents: number | null;
  memberships: FanCohortMembership[];
  postShowWindows: PostShowWindowMetrics[];
  timeline: CohortTimelinePhase[];
  connectedUserIds: Set<string>;
  ordersByUser: Map<string, import("@/lib/fan-attribution").OrderAttributionInput[]>;
  originsByUser: Map<string, RelationshipOrigin>;
}

async function loadConnectedFanIdsForEvent(eventId: string, artistId: string): Promise<Set<string>> {
  const rows = await db
    .select({ userId: artistConsents.userId })
    .from(artistConsents)
    .innerJoin(verifiedAttendance, eq(verifiedAttendance.userId, artistConsents.userId))
    .where(
      and(
        eq(verifiedAttendance.eventId, eventId),
        eq(artistConsents.artistId, artistId),
        eq(artistConsents.consentType, "attendee_offers"),
        eq(artistConsents.status, "granted"),
      ),
    );
  return new Set(rows.map((r) => r.userId));
}

async function loadConnectedAfterShowCount(
  eventId: string,
  artistId: string,
  eventEndsAt: Date,
): Promise<number> {
  const [row] = await db
    .select({ total: count(sql`distinct ${artistConsents.userId}`) })
    .from(artistConsents)
    .innerJoin(verifiedAttendance, eq(verifiedAttendance.userId, artistConsents.userId))
    .where(
      and(
        eq(verifiedAttendance.eventId, eventId),
        eq(artistConsents.artistId, artistId),
        eq(artistConsents.consentType, "attendee_offers"),
        eq(artistConsents.status, "granted"),
        sql`${artistConsents.grantedAt} > ${eventEndsAt}`,
      ),
    );
  return Number(row?.total ?? 0);
}

async function resolveRelationshipOrigins(
  artistId: string,
  userIds: string[],
  artistName: string,
): Promise<Map<string, RelationshipOrigin>> {
  if (userIds.length === 0) return new Map();

  const verifiedByUser = await loadVerifiedEventsByUser(artistId, userIds);
  const origins = new Map<string, RelationshipOrigin>();

  for (const userId of userIds) {
    const verifications = verifiedByUser.get(userId);
    if (!verifications?.length) continue;
    const first = verifications[0];
    const [tourRow] = await db
      .select({ tourName: tours.name })
      .from(events)
      .innerJoin(tours, eq(tours.id, events.tourId))
      .where(eq(events.id, first.eventId))
      .limit(1);

    origins.set(userId, {
      eventId: first.eventId,
      artistName,
      tourName: tourRow?.tourName ?? null,
      venueCity: first.venueCity,
      startsAt: first.startsAt,
      timezone: first.timezone,
    });
  }

  return origins;
}

export async function analyzeShowCohort(
  event: NonNullable<Awaited<ReturnType<typeof getEventById>>>,
  isDemoData: boolean,
): Promise<ShowCohortAnalysis> {
  const artistId = event.artistId;
  const window = buildEventWindow({
    id: event.id,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    postShowWindowMinutes: event.postShowWindowMinutes,
    cancelled: event.cancelled,
    tourWindowMinutes: event.tourWindowMinutes,
  });

  const verifiedRows = await db
    .select({ userId: verifiedAttendance.userId })
    .from(verifiedAttendance)
    .where(eq(verifiedAttendance.eventId, event.id));

  const verifiedUserIds = verifiedRows.map((r) => r.userId);
  const connectedSet = await loadConnectedFanIdsForEvent(event.id, artistId);
  const connectedAfterShow = await loadConnectedAfterShowCount(event.id, artistId, event.endsAt);

  if (verifiedUserIds.length === 0) {
    const emptyFunnel = aggregateFunnelCounts([]);
    const emptyWindows = buildPostShowWindows([], new Map(), window, event.endsAt);
    return {
      event,
      isDemoData,
      funnel: emptyFunnel,
      connectedAfterShow,
      showNightGmvCents: 0,
      postShowGmv30DaysCents: 0,
      postShowGmv90DaysCents: 0,
      totalObservedGmvCents: 0,
      repeatPurchaseRate: null,
      observedGmvPerVerifiedFanCents: null,
      memberships: [],
      postShowWindows: emptyWindows,
      timeline: buildCohortTimeline(emptyFunnel, 0, emptyWindows),
      connectedUserIds: connectedSet,
      ordersByUser: new Map(),
      originsByUser: new Map(),
    };
  }

  const orderLines = await loadOrderLinesForArtist(artistId, verifiedUserIds);
  const ordersByUser = groupOrdersByUser(orderLines);
  const verifiedSet = new Set([event.id]);

  const memberships: FanCohortMembership[] = [];
  let showNightGmv = 0;
  let postShow30 = 0;
  let postShow90 = 0;
  let totalObserved = 0;

  for (const userId of verifiedUserIds) {
    const userOrders = ordersByUser.get(userId) ?? [];
    const membership = classifyFanCohortMembership({
      isVerifiedAttendee: true,
      isConnected: connectedSet.has(userId),
      userOrders,
      eventWindow: window,
    });
    membership.userId = userId;
    memberships.push(membership);

    for (const order of userOrders) {
      const attributed = attributeOrderToEvent(order, window, verifiedSet);
      showNightGmv += sumAttributedGmv(attributed, "show_night");
      postShow30 += postShowGmvWithinWindow(attributed, event.endsAt, 30);
      postShow90 += postShowGmvWithinWindow(attributed, event.endsAt, 90);
      totalObserved += sumAttributedGmv(attributed);
    }
  }

  const funnel = aggregateFunnelCounts(memberships);
  const postShowWindows = buildPostShowWindows(memberships, ordersByUser, window, event.endsAt);
  const timeline = buildCohortTimeline(funnel, showNightGmv, postShowWindows);

  const originsByUser = await resolveRelationshipOrigins(
    artistId,
    verifiedUserIds,
    event.artistName,
  );

  return {
    event,
    isDemoData,
    funnel,
    connectedAfterShow,
    showNightGmvCents: showNightGmv,
    postShowGmv30DaysCents: postShow30,
    postShowGmv90DaysCents: postShow90,
    totalObservedGmvCents: totalObserved,
    repeatPurchaseRate:
      funnel.attendees > 0 ? funnel.repeatPurchasers / funnel.attendees : null,
    observedGmvPerVerifiedFanCents:
      funnel.attendees > 0 ? Math.round(totalObserved / funnel.attendees) : null,
    memberships,
    postShowWindows,
    timeline,
    connectedUserIds: connectedSet,
    ordersByUser,
    originsByUser,
  };
}

export async function loadCohortFanRows(
  analysis: ShowCohortAnalysis,
  stage: CohortFunnelStage | null,
): Promise<CohortFanRow[]> {
  const filtered = stage
    ? analysis.memberships.filter((m) => fanMatchesStage(m, stage))
    : analysis.memberships.filter((m) => m.isConnected);

  if (filtered.length === 0) return [];

  const userIds = filtered.map((m) => m.userId);
  const userRows = await db
    .select({
      userId: users.id,
      displayName: users.displayName,
      email: users.email,
    })
    .from(users)
    .where(inArray(users.id, userIds));

  const userMap = new Map(userRows.map((u) => [u.userId, u]));

  return filtered
    .map((membership) => {
      const user = userMap.get(membership.userId);
      if (!user) return null;
      return {
        userId: membership.userId,
        displayName: user.displayName,
        email: user.email,
        relationshipStart: analysis.originsByUser.get(membership.userId) ?? null,
        showNightGmvCents: membership.showNightGmvCents,
        postShowGmvCents: membership.postShowGmvCents,
        totalObservedGmvCents: membership.totalObservedGmvCents,
        lastActivityAt: membership.lastActivityAt,
        membership,
      };
    })
    .filter((row): row is CohortFanRow => row != null)
    .sort((a, b) => b.totalObservedGmvCents - a.totalObservedGmvCents);
}
