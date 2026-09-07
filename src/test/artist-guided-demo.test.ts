import { describe, expect, it } from "vitest";

import {
  MARISOL_ARTIST_STUDIO_JOURNEY,
  MARISOL_ARTIST_STUDIO_ROUTE_PARAMS,
  MARISOL_ARTIST_STUDIO_STEPS,
  activeArtistGuidedJourneyId,
  getArtistGuidedJourney,
  getArtistGuidedStep,
  listActiveArtistGuidedJourneys,
  resolveArtistGuidedRoute,
} from "@/lib/artist-guided-demo";
import {
  artistGuidedDemoQuery,
  resolveArtistGuidedStepRoute,
} from "@/server/demo/artist-guided-demo-state";
import { MARISOL_BROOKLYN_EVENT_ID, DEMO_SCOTT_FAN_ID, MARISOL_ARTIST_ID } from "@/lib/demo-user-ids";
import { isElenaMarisolDemoSession } from "@/server/demo/artist-guided-demo-apply";
import type { AuthContext } from "@/server/auth/session";
import {
  isArtistGuidedDemoQuery,
  isFanGuidedDemoQuery,
  parseGuidedDemoQuery,
  shouldAllowGuidedDemoRequest,
} from "@/lib/guided-demo-entry";

describe("artist guided demo journey", () => {
  it("registers the Marisol artist studio journey with six steps", () => {
    expect(activeArtistGuidedJourneyId()).toBe("marisol-artist-studio");
    expect(listActiveArtistGuidedJourneys()).toHaveLength(1);
    expect(MARISOL_ARTIST_STUDIO_JOURNEY.steps).toHaveLength(6);
    expect(getArtistGuidedJourney("marisol-artist-studio")?.title).toMatch(/Artist Studio/i);
  });

  it("maps each step to a real studio route for Brooklyn", () => {
    const params = MARISOL_ARTIST_STUDIO_ROUTE_PARAMS;

    expect(resolveArtistGuidedRoute("/studio/live/{eventId}", params)).toBe(
      `/studio/live/${MARISOL_BROOKLYN_EVENT_ID}`,
    );
    expect(resolveArtistGuidedRoute("/studio/fans/{fanId}", params)).toBe(
      `/studio/fans/${DEMO_SCOTT_FAN_ID}`,
    );

    for (const step of MARISOL_ARTIST_STUDIO_STEPS) {
      const resolved = resolveArtistGuidedStepRoute(step);
      expect(resolved).toMatch(/^\/studio\//);
      expect(resolved).not.toContain("{eventId}");
      expect(resolved).not.toContain("{fanId}");
    }
  });

  it("uses artist narration fields and conclusion CTA on step six", () => {
    const step6 = getArtistGuidedStep("marisol-artist-studio", 6)!;
    expect(step6.isConclusion).toBe(true);
    expect(step6.keyMessage).toMatch(/relationship doesn't/i);
    expect(step6.whatArtistSees).toMatch(/show-night GMV/i);
  });

  it("serializes guided demo query params", () => {
    const qs = artistGuidedDemoQuery({
      journeyId: "marisol-artist-studio",
      step: 3,
      autoplay: false,
      presenter: true,
    });
    expect(qs).toBe("guided=marisol-artist-studio&step=3&presenter=1");
  });
});

describe("guided demo entry routing", () => {
  it("distinguishes artist vs fan guided queries", () => {
    const artistParams = new URLSearchParams("guided=marisol-artist-studio&step=2");
    const fanParams = new URLSearchParams("guided=marisol-tender-night&step=2");

    expect(isArtistGuidedDemoQuery(artistParams)).toBe(true);
    expect(isFanGuidedDemoQuery(artistParams)).toBe(false);
    expect(isFanGuidedDemoQuery(fanParams)).toBe(true);
    expect(isArtistGuidedDemoQuery(fanParams)).toBe(false);
  });

  it("allows anonymous studio routes only for artist guided entry", () => {
    const artistRequest = {
      cookies: { get: () => undefined },
      nextUrl: new URL(
        "http://localhost/studio/insights?guided=marisol-artist-studio&step=2",
      ),
    } as unknown as import("next/server").NextRequest;

    const fanOnStudio = {
      cookies: { get: () => undefined },
      nextUrl: new URL(
        "http://localhost/studio/insights?guided=marisol-tender-night&step=2",
      ),
    } as unknown as import("next/server").NextRequest;

    expect(shouldAllowGuidedDemoRequest(artistRequest)).toBe(true);
    expect(shouldAllowGuidedDemoRequest(fanOnStudio)).toBe(false);
  });

  it("parses artist perspective from guided query", () => {
    const parsed = parseGuidedDemoQuery(
      new URLSearchParams("guided=marisol-artist-studio&step=5&presenter=1"),
    );
    expect(parsed?.perspective).toBe("artist");
    expect(parsed?.journeyId).toBe("marisol-artist-studio");
    expect(parsed?.step).toBe(5);
    expect(parsed?.presenter).toBe(true);
  });
});

describe("Elena artist demo session", () => {
  function ctx(overrides: Partial<AuthContext>): AuthContext {
    return {
      sessionId: "ses_test",
      userId: "usr_test",
      email: "elena@marisolreyes.example",
      displayName: "Elena Vasquez",
      roles: ["artist_member"],
      memberships: [
        {
          artistId: MARISOL_ARTIST_ID,
          artistName: "Marisol Reyes",
          artistSlug: "marisol-reyes",
          role: "merch_manager",
          canPublish: true,
        },
      ],
      activeArtistId: MARISOL_ARTIST_ID,
      onboardingCompletedAt: new Date(),
      ...overrides,
    };
  }

  it("accepts Elena with Marisol membership", () => {
    expect(isElenaMarisolDemoSession(ctx({}))).toBe(true);
  });

  it("rejects fan sessions even when the display name matches", () => {
    expect(
      isElenaMarisolDemoSession(
        ctx({
          email: "scott@example.com",
          displayName: "Scott Weller",
          roles: ["fan"],
          memberships: [],
          activeArtistId: null,
        }),
      ),
    ).toBe(false);
  });

  it("rejects artist team members on other artists", () => {
    expect(
      isElenaMarisolDemoSession(
        ctx({
          email: "marcus@thedegens.example",
          displayName: "Marcus Vale",
          memberships: [
            {
              artistId: "art_the_degens",
              artistName: "The Degens",
              artistSlug: "the-degens",
              role: "management",
              canPublish: true,
            },
          ],
          activeArtistId: "art_the_degens",
        }),
      ),
    ).toBe(false);
  });
});
