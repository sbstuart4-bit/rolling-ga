import { describe, expect, it } from "vitest";
import { GUIDED_DEMO_COOKIE } from "@/lib/auth-cookies";
import {
  isFanGuidedDemoQuery,
  isGuidedDemoQuery,
  parseGuidedDemoQuery,
  shouldAllowGuidedDemoFanRequest,
  shouldAllowGuidedDemoRequest,
} from "@/lib/guided-demo-entry";

function mockRequest(pathWithSearch: string, cookies: Record<string, string> = {}) {
  const url = new URL(pathWithSearch, "https://rollingga.com");
  return {
    nextUrl: url,
    cookies: {
      get: (name: string) => {
        const value = cookies[name];
        return value ? { value } : undefined;
      },
    },
  } as Parameters<typeof shouldAllowGuidedDemoRequest>[0];
}

describe("guided demo fan entry detection", () => {
  it("recognises Marisol guided query params and normalises legacy Nova alias", () => {
    const params = new URLSearchParams("guided=nova-nashville&step=1");
    expect(isGuidedDemoQuery(params)).toBe(true);
    expect(parseGuidedDemoQuery(params)).toEqual({
      perspective: "fan",
      journeyId: "marisol-tender-night",
      step: 1,
      presenter: false,
      autoplay: false,
    });
  });

  it("rejects unknown guided journeys", () => {
    const params = new URLSearchParams("guided=unknown&step=1");
    expect(isGuidedDemoQuery(params)).toBe(false);
  });

  it("allows anonymous fan routes with guided query through proxy", () => {
    expect(
      shouldAllowGuidedDemoRequest(
        mockRequest("/event/nova-kestrel-gold-hour-nashville-2026?guided=nova-nashville&step=1"),
      ),
    ).toBe(true);
  });

  it("allows anonymous fan routes when the guided session cookie is present", () => {
    expect(
      shouldAllowGuidedDemoRequest(
        mockRequest("/event/nova-kestrel-gold-hour-nashville-2026", {
          [GUIDED_DEMO_COOKIE]: '{"journeyId":"nova-nashville","step":1}',
        }),
      ),
    ).toBe(true);
  });

  it("does not allow unrelated protected routes", () => {
    expect(shouldAllowGuidedDemoRequest(mockRequest("/profile"))).toBe(false);
  });

  it("allows studio routes for artist guided demo queries only", () => {
    expect(
      shouldAllowGuidedDemoRequest(
        mockRequest("/studio/live/evt_marisol_brooklyn?guided=marisol-artist-studio&step=1"),
      ),
    ).toBe(true);
    expect(
      shouldAllowGuidedDemoRequest(
        mockRequest("/studio/live/evt_marisol_brooklyn?guided=marisol-tender-night&step=1"),
      ),
    ).toBe(false);
  });

  it("keeps fan alias for shouldAllowGuidedDemoFanRequest", () => {
    expect(isFanGuidedDemoQuery(new URLSearchParams("guided=marisol-tender-night&step=1"))).toBe(
      true,
    );
    const request = mockRequest("/event/marisol-reyes-a-tender-night-brooklyn-2026?guided=marisol-tender-night&step=1");
    expect(shouldAllowGuidedDemoFanRequest(request)).toBe(
      shouldAllowGuidedDemoRequest(request),
    );
  });
});
