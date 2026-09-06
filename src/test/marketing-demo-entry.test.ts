import { afterEach, describe, expect, it, vi } from "vitest";

describe("production demo mode flags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("enables guided demo for public marketing hosts without full demo board routing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ROLLING_GA_DEMO", "");
    vi.stubEnv("ROLLING_GA_PUBLIC_GUIDED_DEMO", "1");

    const { demoModeEnabled, fullDemoBoardEnabled, publicGuidedDemoEnabled, unauthenticatedEntryPath } =
      await import("@/lib/demo-mode");

    expect(publicGuidedDemoEnabled()).toBe(true);
    expect(demoModeEnabled()).toBe(true);
    expect(fullDemoBoardEnabled()).toBe(false);
    expect(unauthenticatedEntryPath()).toBe("/demo");
  });

  it("accepts true as an enabled flag value", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ROLLING_GA_PUBLIC_GUIDED_DEMO", "true");

    const { publicGuidedDemoEnabled, demoModeEnabled } = await import("@/lib/demo-mode");

    expect(publicGuidedDemoEnabled()).toBe(true);
    expect(demoModeEnabled()).toBe(true);
  });

  it("keeps marketing root rewrite when only public guided demo is enabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ROLLING_GA_DEMO", "");
    vi.stubEnv("ROLLING_GA_PUBLIC_GUIDED_DEMO", "1");

    const { fullDemoBoardEnabled } = await import("@/lib/demo-mode");
    const { shouldRewriteRootToMarketing } = await import("@/lib/public-paths");

    expect(
      shouldRewriteRootToMarketing({
        pathname: "/",
        hasSession: false,
        demoMode: fullDemoBoardEnabled(),
      }),
    ).toBe(true);
  });

  it("sends anonymous visitors to welcome when no demo flags are set", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ROLLING_GA_DEMO", "");
    vi.stubEnv("ROLLING_GA_PUBLIC_GUIDED_DEMO", "");

    const { demoModeEnabled, unauthenticatedEntryPath } = await import("@/lib/demo-mode");

    expect(demoModeEnabled()).toBe(false);
    expect(unauthenticatedEntryPath()).toBe("/welcome");
  });
});

describe("public marketing guided demo entry", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("bypasses demo-board access for the marketing CTA", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ROLLING_GA_PUBLIC_GUIDED_DEMO", "1");

    const boardAccess = vi.fn(async () => false);
    const applyGuidedStepState = vi.fn(async () => undefined);
    const loadGuidedStepContext = vi.fn(async () => ({
      journey: { steps: [{ step: 1 }] },
      step: { step: 1, route: "/event/{slug}" },
      show: { slug: "nova-nashville-cedar-vine" },
      session: { journeyId: "nova-nashville", step: 1, autoplay: false, presenter: false },
    }));
    const redirect = vi.fn((url: string) => {
      throw new Error(`redirect:${url}`);
    });

    vi.doMock("@/lib/demo-board-access", () => ({
      hasDemoBoardAccess: boardAccess,
    }));
    vi.doMock("@/server/demo/guided-demo-apply", () => ({
      applyGuidedStepState,
      loadGuidedStepContext,
      ensureScottSession: vi.fn(),
    }));
    vi.doMock("@/lib/guided-demo", () => ({
      resolveGuidedRoute: () => "/event/nova-kestrel-gold-hour-nashville-2026",
    }));
    vi.doMock("@/server/demo/guided-demo-state", () => ({
      guidedDemoQuery: () => "guided=nova-nashville&step=1",
    }));
    vi.doMock("next/navigation", () => ({ redirect }));

    const { startGuidedDemoAction } = await import("@/server/demo/guided-demo-actions");

    const formData = new FormData();
    formData.set("journeyId", "nova-nashville");
    formData.set("publicMarketingEntry", "1");

    await expect(startGuidedDemoAction(formData)).rejects.toThrow(
      "redirect:/event/nova-kestrel-gold-hour-nashville-2026?guided=nova-nashville&step=1",
    );

    expect(boardAccess).not.toHaveBeenCalled();
    expect(applyGuidedStepState).toHaveBeenCalledOnce();
  });

  it("still requires demo-board access for manual /demo/guided starts", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ROLLING_GA_PUBLIC_GUIDED_DEMO", "1");

    const boardAccess = vi.fn(async () => false);
    const redirect = vi.fn((url: string) => {
      throw new Error(`redirect:${url}`);
    });

    vi.doMock("@/lib/demo-board-access", () => ({
      hasDemoBoardAccess: boardAccess,
    }));
    vi.doMock("next/navigation", () => ({ redirect }));

    const { startGuidedDemoAction } = await import("@/server/demo/guided-demo-actions");

    const formData = new FormData();
    formData.set("journeyId", "nova-nashville");

    await expect(startGuidedDemoAction(formData)).rejects.toThrow("redirect:/demo");
    expect(boardAccess).toHaveBeenCalledOnce();
  });
});
