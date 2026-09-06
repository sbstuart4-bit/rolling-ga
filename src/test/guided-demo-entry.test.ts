import { describe, expect, it } from "vitest";
import { GUIDED_DEMO_COOKIE } from "@/lib/auth-cookies";
import {
  isGuidedDemoQuery,
  parseGuidedDemoQuery,
  shouldAllowGuidedDemoFanRequest,
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
  } as Parameters<typeof shouldAllowGuidedDemoFanRequest>[0];
}

describe("guided demo fan entry detection", () => {
  it("recognises Nova Nashville guided query params", () => {
    const params = new URLSearchParams("guided=nova-nashville&step=1");
    expect(isGuidedDemoQuery(params)).toBe(true);
    expect(parseGuidedDemoQuery(params)).toEqual({
      journeyId: "nova-nashville",
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
      shouldAllowGuidedDemoFanRequest(
        mockRequest("/event/nova-kestrel-gold-hour-nashville-2026?guided=nova-nashville&step=1"),
      ),
    ).toBe(true);
  });

  it("allows anonymous fan routes when the guided session cookie is present", () => {
    expect(
      shouldAllowGuidedDemoFanRequest(
        mockRequest("/event/nova-kestrel-gold-hour-nashville-2026", {
          [GUIDED_DEMO_COOKIE]: '{"journeyId":"nova-nashville","step":1}',
        }),
      ),
    ).toBe(true);
  });

  it("does not allow unrelated protected routes", () => {
    expect(shouldAllowGuidedDemoFanRequest(mockRequest("/profile"))).toBe(false);
  });
});
