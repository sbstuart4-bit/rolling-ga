import { describe, expect, it } from "vitest";
import {
  aggregateFunnelCounts,
  buildPostShowWindows,
  classifyFanCohortMembership,
} from "@/lib/relationship-intelligence/metrics";
import {
  BROOKLYN_COHORT_STAGES,
  cohortMembersHref,
  MARISOL_BROOKLYN_COHORT_EVENT_ID,
} from "@/lib/relationship-intelligence/cohorts";
import {
  cohortStageLabel,
  fanMatchesStage,
  parseCohortStage,
} from "@/lib/relationship-intelligence/types";
import { MARISOL_BROOKLYN_EVENT_ID } from "@/lib/demo-user-ids";
import {
  MARISOL_ARTIST_STUDIO_STEPS,
  resolveArtistGuidedRoute,
} from "@/lib/artist-guided-demo";

const eventWindow = {
  eventId: "evt_test",
  startsAt: new Date("2027-09-12T20:00:00Z"),
  endsAt: new Date("2027-09-12T23:00:00Z"),
  postShowClosesAt: new Date("2027-09-13T07:00:00Z"),
};

describe("cohort funnel definitions", () => {
  it("requires connected status for purchasing fan", () => {
    const attendeeOnly = classifyFanCohortMembership({
      isVerifiedAttendee: true,
      isConnected: false,
      userOrders: [
        {
          orderId: "ord_1",
          orderEventId: "evt_test",
          placedAt: new Date("2027-09-12T21:00:00Z"),
          commerceSource: "event_scoped",
          lines: [{ dropId: "drp", dropEventId: "evt_test", lineTotalCents: 5000 }],
        },
      ],
      eventWindow,
    });
    expect(attendeeOnly.isPurchasing).toBe(false);

    const connected = classifyFanCohortMembership({
      ...{
        isVerifiedAttendee: true,
        isConnected: true,
        userOrders: attendeeOnly ? [] : [],
      },
      isVerifiedAttendee: true,
      isConnected: true,
      userOrders: [
        {
          orderId: "ord_1",
          orderEventId: "evt_test",
          placedAt: new Date("2027-09-12T21:00:00Z"),
          commerceSource: "event_scoped",
          lines: [{ dropId: "drp", dropEventId: "evt_test", lineTotalCents: 5000 }],
        },
      ],
      eventWindow,
    });
    expect(connected.isPurchasing).toBe(true);
  });

  it("identifies post-show purchaser separately from show-night only", () => {
    const showNightOnly = classifyFanCohortMembership({
      isVerifiedAttendee: true,
      isConnected: true,
      userOrders: [
        {
          orderId: "ord_sn",
          orderEventId: "evt_test",
          placedAt: new Date("2027-09-12T21:00:00Z"),
          commerceSource: "event_scoped",
          lines: [{ dropId: "drp", dropEventId: "evt_test", lineTotalCents: 4000 }],
        },
      ],
      eventWindow,
    });
    expect(showNightOnly.isPostShowPurchaser).toBe(false);

    const postShow = classifyFanCohortMembership({
      isVerifiedAttendee: true,
      isConnected: true,
      userOrders: [
        {
          orderId: "ord_ps",
          orderEventId: "evt_test",
          placedAt: new Date("2027-09-15T12:00:00Z"),
          commerceSource: "event_scoped",
          lines: [{ dropId: "drp", dropEventId: "evt_test", lineTotalCents: 6000 }],
        },
      ],
      eventWindow,
    });
    expect(postShow.isPostShowPurchaser).toBe(true);
  });

  it("counts repeat purchaser at two attributed orders", () => {
    const repeat = classifyFanCohortMembership({
      isVerifiedAttendee: true,
      isConnected: true,
      userOrders: [
        {
          orderId: "ord_1",
          orderEventId: "evt_test",
          placedAt: new Date("2027-09-12T21:00:00Z"),
          commerceSource: "event_scoped",
          lines: [{ dropId: "drp", dropEventId: "evt_test", lineTotalCents: 4000 }],
        },
        {
          orderId: "ord_2",
          orderEventId: "evt_test",
          placedAt: new Date("2027-09-20T12:00:00Z"),
          commerceSource: "event_scoped",
          lines: [{ dropId: "drp", dropEventId: "evt_test", lineTotalCents: 6000 }],
        },
      ],
      eventWindow,
    });
    expect(repeat.isRepeatPurchaser).toBe(true);
    expect(repeat.attributedOrderCount).toBe(2);
  });

  it("aggregates funnel counts without overlap miscounts", () => {
    const funnel = aggregateFunnelCounts([
      {
        userId: "a",
        isAttendee: true,
        isConnected: true,
        isPurchasing: true,
        isPostShowPurchaser: false,
        isRepeatPurchaser: false,
        showNightGmvCents: 1000,
        postShowGmvCents: 0,
        totalObservedGmvCents: 1000,
        attributedOrderCount: 1,
        lastActivityAt: null,
      },
      {
        userId: "b",
        isAttendee: true,
        isConnected: true,
        isPurchasing: true,
        isPostShowPurchaser: true,
        isRepeatPurchaser: true,
        showNightGmvCents: 2000,
        postShowGmvCents: 3000,
        totalObservedGmvCents: 5000,
        attributedOrderCount: 2,
        lastActivityAt: null,
      },
    ]);
    expect(funnel.attendees).toBe(2);
    expect(funnel.connectedFans).toBe(2);
    expect(funnel.purchasingFans).toBe(2);
    expect(funnel.postShowPurchasers).toBe(1);
    expect(funnel.repeatPurchasers).toBe(1);
  });
});

describe("post-show windows", () => {
  it("computes T+1 / T+7 / T+30 metrics from orders", () => {
    const membership = classifyFanCohortMembership({
      isVerifiedAttendee: true,
      isConnected: true,
      userOrders: [
        {
          orderId: "ord_ps",
          orderEventId: "evt_test",
          placedAt: new Date("2027-09-13T10:00:00Z"),
          commerceSource: "event_scoped",
          lines: [{ dropId: "drp", dropEventId: "evt_test", lineTotalCents: 2500 }],
        },
      ],
      eventWindow,
    });
    membership.userId = "fan_1";

    const windows = buildPostShowWindows(
      [membership],
      new Map([
        [
          "fan_1",
          [
            {
              orderId: "ord_ps",
              orderEventId: "evt_test",
              placedAt: new Date("2027-09-13T10:00:00Z"),
              commerceSource: "event_scoped",
              lines: [{ dropId: "drp", dropEventId: "evt_test", lineTotalCents: 2500 }],
            },
          ],
        ],
      ]),
      eventWindow,
      eventWindow.endsAt,
    );

    expect(windows).toHaveLength(3);
    expect(windows[0].label).toBe("T+1 day");
    expect(windows[0].postShowPurchasers).toBe(1);
    expect(windows[0].postShowGmvCents).toBe(2500);
  });
});

describe("cohort stage helpers", () => {
  it("parses and labels funnel stages", () => {
    expect(parseCohortStage("connected")).toBe("connected");
    expect(parseCohortStage("invalid")).toBeNull();
    expect(cohortStageLabel("post_show")).toBe("Post-show purchasers");
  });

  it("filters membership by stage", () => {
    const membership = {
      userId: "x",
      isAttendee: true,
      isConnected: true,
      isPurchasing: true,
      isPostShowPurchaser: true,
      isRepeatPurchaser: false,
      showNightGmvCents: 0,
      postShowGmvCents: 100,
      totalObservedGmvCents: 100,
      attributedOrderCount: 1,
      lastActivityAt: null,
    };
    expect(fanMatchesStage(membership, "post_show")).toBe(true);
    expect(fanMatchesStage(membership, "repeat")).toBe(false);
  });

  it("exposes Brooklyn cohort hrefs for Phase 4 reuse", () => {
    expect(MARISOL_BROOKLYN_COHORT_EVENT_ID).toBe(MARISOL_BROOKLYN_EVENT_ID);
    expect(cohortMembersHref(MARISOL_BROOKLYN_EVENT_ID, BROOKLYN_COHORT_STAGES.connected)).toBe(
      `/studio/fans/cohort/${MARISOL_BROOKLYN_EVENT_ID}?stage=connected`,
    );
  });
});

describe("guided demo integration", () => {
  it("step 3 routes to cohort page", () => {
    const step3 = MARISOL_ARTIST_STUDIO_STEPS[2];
    expect(step3.step).toBe(3);
    expect(
      resolveArtistGuidedRoute(step3.route, { eventId: MARISOL_BROOKLYN_EVENT_ID, fanId: "fan" }),
    ).toContain("/studio/fans/cohort/");
  });

  it("step 4 routes to Scott fan profile", () => {
    const step4 = MARISOL_ARTIST_STUDIO_STEPS[3];
    expect(step4.route).toContain("/studio/fans/");
  });
});
