import { describe, expect, it } from "vitest";
import {
  isSameOriginReferer,
  shouldRedirectRootToDemoBoard,
} from "@/lib/demo-mode";

describe("demo mode root routing", () => {
  it("redirects a fresh open of / to the demo board", () => {
    expect(
      shouldRedirectRootToDemoBoard({
        pathname: "/",
        demoMode: true,
        hasSession: false,
        inAppNavigation: false,
      }),
    ).toBe(true);
    expect(
      shouldRedirectRootToDemoBoard({
        pathname: "/",
        demoMode: true,
        hasSession: true,
        inAppNavigation: false,
      }),
    ).toBe(true);
  });

  it("keeps in-app navigation to / on the fan home feed", () => {
    expect(
      shouldRedirectRootToDemoBoard({
        pathname: "/",
        demoMode: true,
        hasSession: true,
        inAppNavigation: true,
      }),
    ).toBe(false);
  });

  it("does not redirect production or non-root paths", () => {
    expect(
      shouldRedirectRootToDemoBoard({
        pathname: "/shows",
        demoMode: true,
        hasSession: false,
        inAppNavigation: false,
      }),
    ).toBe(false);
    expect(
      shouldRedirectRootToDemoBoard({
        pathname: "/",
        demoMode: false,
        hasSession: false,
        inAppNavigation: false,
      }),
    ).toBe(false);
  });

  it("detects same-origin referers", () => {
    const headers = new Headers({ referer: "http://localhost:3001/drops" });
    expect(isSameOriginReferer(headers, "http://localhost:3001")).toBe(true);
    expect(isSameOriginReferer(new Headers(), "http://localhost:3001")).toBe(false);
    expect(
      isSameOriginReferer(new Headers({ referer: "https://other.test/" }), "http://localhost:3001"),
    ).toBe(false);
  });
});
