import { afterEach, describe, expect, it, vi } from "vitest";
import { canSeedProductionDemoDatabase } from "@/db/demo-bootstrap-policy";

describe("canSeedProductionDemoDatabase", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows explicit opt-in regardless of user count", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ROLLING_GA_ALLOW_DEMO_SEED", "1");
    vi.stubEnv("ROLLING_GA_PUBLIC_GUIDED_DEMO", "1");

    expect(canSeedProductionDemoDatabase(42)).toBe(true);
  });

  it("allows auto-seed on empty demo hosts", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ROLLING_GA_PUBLIC_GUIDED_DEMO", "1");

    expect(canSeedProductionDemoDatabase(0)).toBe(true);
    expect(canSeedProductionDemoDatabase(1)).toBe(false);
    expect(canSeedProductionDemoDatabase(null)).toBe(false);
  });

  it("refuses auto-seed when demo mode is disabled", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ROLLING_GA_PUBLIC_GUIDED_DEMO", "");
    vi.stubEnv("ROLLING_GA_DEMO", "");

    expect(canSeedProductionDemoDatabase(0)).toBe(false);
  });
});
