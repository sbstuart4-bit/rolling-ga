import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canSeedProductionDemoDatabase,
  shouldSeedDemoDatabaseAtBuildTime,
} from "@/db/demo-bootstrap-policy";

describe("canSeedProductionDemoDatabase", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows explicit opt-in regardless of user count", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ROLLING_GA_ALLOW_DEMO_SEED", "1");
    vi.stubEnv("ROLLING_GA_PUBLIC_GUIDED_DEMO", "1");

    expect(
      canSeedProductionDemoDatabase({
        userCount: 42,
        demoUserCount: 42,
        personasPresent: false,
      }),
    ).toBe(true);
  });

  it("allows auto-seed on empty demo hosts", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ROLLING_GA_PUBLIC_GUIDED_DEMO", "1");

    expect(
      canSeedProductionDemoDatabase({
        userCount: 0,
        demoUserCount: 0,
        personasPresent: false,
      }),
    ).toBe(true);
    expect(
      canSeedProductionDemoDatabase({
        userCount: 1,
        demoUserCount: 1,
        personasPresent: false,
      }),
    ).toBe(true);
    expect(
      canSeedProductionDemoDatabase({
        userCount: 1,
        demoUserCount: 0,
        personasPresent: false,
      }),
    ).toBe(false);
  });

  it("refuses auto-seed when demo mode is disabled", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ROLLING_GA_PUBLIC_GUIDED_DEMO", "");
    vi.stubEnv("ROLLING_GA_DEMO", "");

    expect(
      canSeedProductionDemoDatabase({
        userCount: 0,
        demoUserCount: 0,
        personasPresent: false,
      }),
    ).toBe(false);
  });

  it("skips when personas are already present", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ROLLING_GA_PUBLIC_GUIDED_DEMO", "1");

    expect(
      canSeedProductionDemoDatabase({
        userCount: 0,
        demoUserCount: 0,
        personasPresent: true,
      }),
    ).toBe(false);
  });
});

describe("shouldSeedDemoDatabaseAtBuildTime", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("seeds on public guided demo hosts", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ROLLING_GA_PUBLIC_GUIDED_DEMO", "1");
    expect(shouldSeedDemoDatabaseAtBuildTime()).toBe(true);
  });
});
