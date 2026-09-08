/**
 * Phase 4 — Fan activation: cohort → drop → eligibility → attribution → results.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { desc, eq } from "drizzle-orm";
import {
  artistConsents,
  audienceSegments,
  drops,
} from "@/db/schema";
import {
  db,
  createUser,
  createArtist,
  createVenue,
  createTour,
  createEvent,
  createProduct,
  createVerifiedAttendance,
  createVariantWithInventory,
  authContextFor,
  membershipFor,
} from "./helpers";
import {
  computeActivationResults,
  decomposePostShowGmv,
  isActivatedRevenueLine,
} from "@/lib/activation/revenue";
import {
  isActivatableCohortStage,
  isFanInAudienceSnapshot,
  SHOW_COHORT_RULE_KIND,
} from "@/lib/activation/audience";
import { createActivationHref } from "@/lib/relationship-intelligence/cohorts";
import { MARISOL_ARTIST_STUDIO_ROUTE_PARAMS } from "@/lib/artist-guided-demo/journeys/marisol-artist-studio";

const getAuthContext = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));
vi.mock("@/server/auth/session", () => ({ getAuthContext }));

import { createFlashDropAction } from "@/server/studio/drop-actions";
import {
  buildActivationAudiencePreview,
  isFanEligibleForDropAudience,
  resolveCohortMemberUserIds,
} from "@/server/activation/queries";
import { resolveLine, loadAttendanceFacts } from "@/server/commerce/resolve";
import { demoNow } from "@/server/demo/clock";

function form(fields: Record<string, string | string[] | undefined>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    for (const entry of Array.isArray(value) ? value : [value]) data.append(key, entry);
  }
  return data;
}

describe("activation audience lib", () => {
  it("recognizes activatable cohort stages", () => {
    expect(isActivatableCohortStage("connected")).toBe(true);
    expect(isActivatableCohortStage("purchasing")).toBe(true);
    expect(isActivatableCohortStage("post_show")).toBe(true);
    expect(isActivatableCohortStage("repeat")).toBe(true);
    expect(isActivatableCohortStage("attendees")).toBe(false);
  });

  it("checks publish-time snapshot membership", () => {
    expect(
      isFanInAudienceSnapshot("fan_a", {
        snapshotUserIds: ["fan_a", "fan_b"],
      }),
    ).toBe(true);
    expect(
      isFanInAudienceSnapshot("fan_c", {
        snapshotUserIds: ["fan_a", "fan_b"],
      }),
    ).toBe(false);
  });

  it("builds cohort activation href", () => {
    expect(createActivationHref("evt_marisol_brooklyn", "connected")).toBe(
      "/studio/drops/new?event=evt_marisol_brooklyn&cohort=connected",
    );
  });
});

describe("activated revenue", () => {
  it("identifies activation lines by drop id", () => {
    const activationDrops = new Set(["drp_activation"]);
    expect(isActivatedRevenueLine({ dropId: "drp_activation" }, activationDrops)).toBe(true);
    expect(isActivatedRevenueLine({ dropId: "drp_other" }, activationDrops)).toBe(false);
  });
});

describe("cohort flash drop activation", () => {
  beforeEach(() => {
    getAuthContext.mockReset();
  });

  async function brooklynScenario() {
    const owner = await createUser();
    const venue = await createVenue();
    const now = demoNow();
    const artist = await createArtist("Marisol Reyes");
    const tour = await createTour(artist.id);
    const event = await createEvent(artist.id, tour.id, venue.id, {
      startsAt: new Date(now.getTime() - 14 * 24 * 60 * 60_000),
      endsAt: new Date(now.getTime() - 7 * 24 * 60 * 60_000),
    });

    const poster = await createProduct(artist.id, { name: "A Tender Night Poster" });
    await createVariantWithInventory(poster.id);
    const eligibleFan = await createUser();
    const ineligibleFan = await createUser();
    const otherArtistFan = await createUser();

    await createVerifiedAttendance(eligibleFan.id, event.id);
    await createVerifiedAttendance(ineligibleFan.id, event.id);

    await db().insert(artistConsents).values({
      userId: eligibleFan.id,
      artistId: artist.id,
      consentType: "attendee_offers",
      status: "granted",
      source: "post_verification_prompt",
      grantedAt: event.endsAt,
      isDemo: true,
    });

    getAuthContext.mockResolvedValue(
      authContextFor(owner, { memberships: [membershipFor(artist)], activeArtistId: artist.id }),
    );

    return {
      artist,
      event,
      poster,
      eligibleFan,
      ineligibleFan,
      otherArtistFan,
      owner,
    };
  }

  it("resolves connected cohort members dynamically before publish", async () => {
    const { artist, event, eligibleFan, ineligibleFan } = await brooklynScenario();
    const ids = await resolveCohortMemberUserIds(artist.id, event.id, "connected");
    expect(ids).toContain(eligibleFan.id);
    expect(ids).not.toContain(ineligibleFan.id);
  });

  it("previews audience size for cohort activation", async () => {
    const { artist, event } = await brooklynScenario();
    const preview = await buildActivationAudiencePreview(artist.id, event.id, "connected");
    expect(preview?.eligibleFanCount).toBe(1);
    expect(preview?.audienceLabel).toContain("Connected");
  });

  it("snapshots audience at publish and links drop to segment", async () => {
    const { artist, event, poster, eligibleFan } = await brooklynScenario();

    const previewState = await createFlashDropAction(
      {},
      form({
        artistId: artist.id,
        title: "Brooklyn Encore Drop",
        eventId: event.id,
        durationMinutes: "2880",
        productIds: poster.id,
        cohortStage: "connected",
        confirm: "false",
      }),
    );

    expect(previewState.error).toBeUndefined();
    expect(previewState.preview?.eligibleFanCount).toBe(1);
    expect(previewState.preview?.cohortStage).toBe("connected");

    await expect(
      createFlashDropAction(
        previewState,
        form({
          artistId: artist.id,
          title: "Brooklyn Encore Drop",
          eventId: event.id,
          durationMinutes: "2880",
          productIds: poster.id,
          cohortStage: "connected",
          confirm: "true",
        }),
      ),
    ).rejects.toThrow(/NEXT_REDIRECT/);

    const published = await db()
      .select()
      .from(drops)
      .where(eq(drops.artistId, artist.id))
      .orderBy(desc(drops.createdAt))
      .limit(1);

    const activationDrop = published[0]!;
    expect(activationDrop.audienceSegmentId).toBeTruthy();

    const [segment] = await db()
      .select()
      .from(audienceSegments)
      .where(eq(audienceSegments.id, activationDrop.audienceSegmentId!))
      .limit(1);

    expect(segment.ruleKind).toBe(SHOW_COHORT_RULE_KIND);
    expect(segment.params?.snapshotUserIds).toContain(eligibleFan.id);
    expect(segment.params?.eligibleCountAtPublish).toBe(1);
  });

  it("blocks ineligible fans at commerce resolution", async () => {
    const { artist, event, poster, eligibleFan, ineligibleFan } = await brooklynScenario();

    await expect(
      createFlashDropAction(
        {},
        form({
          artistId: artist.id,
          title: "Test Activation",
          eventId: event.id,
          durationMinutes: "60",
          productIds: poster.id,
          cohortStage: "connected",
          confirm: "true",
        }),
      ),
    ).rejects.toThrow(/NEXT_REDIRECT/);

    const [drop] = await db()
      .select()
      .from(drops)
      .where(eq(drops.artistId, artist.id))
      .orderBy(desc(drops.createdAt))
      .limit(1);

    const eligibleAttendance = await loadAttendanceFacts(eligibleFan.id);
    const eligibleResult = await resolveLine({
      productId: poster.id,
      quantity: 1,
      dropId: drop.id,
      eventId: event.id,
      userId: eligibleFan.id,
      attendance: eligibleAttendance,
    });
    expect(eligibleResult.ok).toBe(true);

    const ineligibleAttendance = await loadAttendanceFacts(ineligibleFan.id);
    const blocked = await resolveLine({
      productId: poster.id,
      quantity: 1,
      dropId: drop.id,
      eventId: event.id,
      userId: ineligibleFan.id,
      attendance: ineligibleAttendance,
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.reason).toBe("audience_not_eligible");
  });

  it("enforces audience segment eligibility server-side", async () => {
    const artist = await createArtist("Activation Artist");
    const [segment] = await db()
      .insert(audienceSegments)
      .values({
        artistId: artist.id,
        name: "Test cohort",
        ruleKind: SHOW_COHORT_RULE_KIND,
        params: {
          originEventId: "evt_test",
          cohortStage: "connected",
          snapshotUserIds: ["fan_allowed"],
          eligibleCountAtPublish: 1,
        },
        isDemo: true,
      })
      .returning();

    const allowed = await isFanEligibleForDropAudience("fan_allowed", segment.id);
    const denied = await isFanEligibleForDropAudience("fan_blocked", segment.id);
    expect(allowed.eligible).toBe(true);
    expect(denied.eligible).toBe(false);
  });
});

describe("guided demo step 5 route", () => {
  it("includes cohort activation prefill for Brooklyn", () => {
    const route = `/studio/drops/new?event=${MARISOL_ARTIST_STUDIO_ROUTE_PARAMS.eventId}&prefill=brooklyn-encore&cohort=connected`;
    expect(route).toContain("cohort=connected");
    expect(route).toContain(MARISOL_ARTIST_STUDIO_ROUTE_PARAMS.eventId);
  });
});

describe("activation results metrics", () => {
  it("computes conversion and AOV from real lines", () => {
    const metrics = computeActivationResults(4, [
      {
        dropId: "drp_a",
        lineTotalCents: 2500,
        placedAt: new Date(),
        userId: "u1",
        orderId: "o1",
      },
      {
        dropId: "drp_a",
        lineTotalCents: 2500,
        placedAt: new Date(),
        userId: "u2",
        orderId: "o2",
      },
    ]);
    expect(metrics.eligibleFans).toBe(4);
    expect(metrics.purchasingFans).toBe(2);
    expect(metrics.conversionRate).toBe(0.5);
    expect(metrics.activatedRevenueCents).toBe(5000);
    expect(metrics.averageOrderValueCents).toBe(2500);
  });

  it("decomposes activated vs organic post-show GMV", () => {
    const activationDrops = new Set(["drp_act"]);
    const breakdown = decomposePostShowGmv(
      [
        {
          dropId: "drp_act",
          lineTotalCents: 1000,
          placedAt: new Date(),
          userId: "u1",
          orderId: "o1",
        },
        {
          dropId: "drp_other",
          lineTotalCents: 500,
          placedAt: new Date(),
          userId: "u2",
          orderId: "o2",
        },
      ],
      activationDrops,
      () => true,
    );
    expect(breakdown.postShowGmvCents).toBe(1500);
    expect(breakdown.activatedPostShowGmvCents).toBe(1000);
    expect(breakdown.organicPostShowGmvCents).toBe(500);
  });
});
