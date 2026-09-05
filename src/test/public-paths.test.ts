import { describe, expect, it } from "vitest";
import {
  isPublicPath,
  isStaticAssetPath,
  MARKETING_PATHS,
  shouldRewriteRootToMarketing,
} from "@/lib/public-paths";

describe("public paths", () => {
  it("never treats compiled CSS or icons as auth-gated", () => {
    expect(isStaticAssetPath("/_next/static/chunks/[root-of-the-server]__14jiz7r._.css")).toBe(true);
    expect(isStaticAssetPath("/_next/static/chunks/%5Broot-of-the-server%5D__14jiz7r._.css")).toBe(true);
    expect(isStaticAssetPath("/icon")).toBe(true);
    expect(isStaticAssetPath("/favicon.ico")).toBe(true);
    expect(isStaticAssetPath("/home")).toBe(false);
  });

  it("treats marketing routes as public", () => {
    for (const path of MARKETING_PATHS) {
      expect(isPublicPath(path)).toBe(true);
    }
  });

  it("does not treat fan or studio routes as public", () => {
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/studio")).toBe(false);
    expect(isPublicPath("/shows")).toBe(false);
    expect(isPublicPath("/product/signal-decay-tour-tee")).toBe(false);
    expect(isPublicPath("/product/opengraph-image")).toBe(true);
  });

  it("rewrites production root without a session", () => {
    expect(
      shouldRewriteRootToMarketing({ pathname: "/", hasSession: false, demoMode: false }),
    ).toBe(true);
  });

  it("keeps authenticated and demo root on the product surfaces", () => {
    expect(
      shouldRewriteRootToMarketing({ pathname: "/", hasSession: true, demoMode: false }),
    ).toBe(false);
    expect(
      shouldRewriteRootToMarketing({ pathname: "/", hasSession: false, demoMode: true }),
    ).toBe(false);
    expect(
      shouldRewriteRootToMarketing({ pathname: "/home", hasSession: false, demoMode: false }),
    ).toBe(false);
  });
});
