import { afterEach, describe, expect, it, vi } from "vitest";

describe("enter guided demo route handler", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("redirects to Marisol step 1 after establishing demo state", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ROLLING_GA_PUBLIC_GUIDED_DEMO", "1");

    const applyGuidedStepState = vi.fn(async () => undefined);
    const loadGuidedStepContext = vi.fn(async () => ({
      journey: { steps: [{ step: 1 }] },
      step: { step: 1, route: "/event/{slug}" },
      show: { slug: "marisol-reyes-a-tender-night-brooklyn-2026" },
      session: { journeyId: "marisol-tender-night", step: 1, autoplay: false, presenter: false },
    }));

    vi.doMock("@/server/demo/guided-demo-apply", () => ({
      applyGuidedStepState,
      loadGuidedStepContext,
    }));

    const { handleEnterGuidedDemoRequest } = await import("@/server/demo/enter-guided-demo");

    const returnTo =
      "/event/marisol-reyes-a-tender-night-brooklyn-2026?guided=marisol-tender-night&step=1";
    const response = await handleEnterGuidedDemoRequest(
      new Request(`https://rollingga.com/api/demo/enter-guided?returnTo=${encodeURIComponent(returnTo)}`),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      `https://rollingga.com${returnTo}`,
    );
    expect(applyGuidedStepState).toHaveBeenCalledOnce();
  });

  it("redirects to seed unavailable when Scott is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ROLLING_GA_PUBLIC_GUIDED_DEMO", "1");

    vi.doMock("@/server/demo/guided-demo-apply", () => ({
      loadGuidedStepContext: vi.fn(async () => ({
        journey: { steps: [{ step: 1 }] },
        step: { step: 1, route: "/event/{slug}" },
        show: { slug: "nova-kestrel-gold-hour-nashville-2026" },
        session: { journeyId: "nova-nashville", step: 1, autoplay: false, presenter: false },
      })),
      applyGuidedStepState: vi.fn(async () => {
        throw new Error("Demo fan Scott Weller is not seeded.");
      }),
    }));

    const { handleEnterGuidedDemoRequest } = await import("@/server/demo/enter-guided-demo");

    const returnTo =
      "/event/marisol-reyes-a-tender-night-brooklyn-2026?guided=marisol-tender-night&step=1";
    const response = await handleEnterGuidedDemoRequest(
      new Request(`https://rollingga.com/api/demo/enter-guided?returnTo=${encodeURIComponent(returnTo)}`),
    );

    expect(response.headers.get("location")).toBe(
      "https://rollingga.com/demo/guided?unavailable=seed",
    );
  });
});
