/**
 * Production deployment safeguards for hosted demo-only environments.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDb, createPgliteDb } from "@/db/client";
import { PGlite } from "@electric-sql/pglite";
import {
  readDemoBoardAccessCookie,
  serializeDemoBoardAccessCookie,
} from "@/lib/demo-board-access";
import { runHealthCheck } from "@/lib/health-check";
import {
  assertHostedDemoBoardSecret,
  assertProductionDatabaseUrl,
  hostedDemoBoardGateRequired,
  validateProductionEnvironment,
} from "@/lib/production-env";
import { createSignedCookieValue, verifySignedCookie } from "@/lib/signed-cookie-edge";

const env = process.env;

afterEach(() => {
  process.env = { ...env };
  vi.unstubAllEnvs();
});

describe("production database guard", () => {
  it("allows PGlite fallback outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.DATABASE_URL;
    delete process.env.ROLLING_GA_DATABASE_URL;

    expect(() => createDb()).not.toThrow();
  });

  it("throws in production when DATABASE_URL is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.DATABASE_URL;
    delete process.env.ROLLING_GA_DATABASE_URL;

    expect(() => assertProductionDatabaseUrl()).toThrow(/DATABASE_URL/);
    expect(() => createDb()).toThrow(/DATABASE_URL/);
  });

  it("selects postgres-js when DATABASE_URL is set in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/rollingga_test_guard");

    const handle = createDb();
    expect(handle.driver).toBe("postgres-js");
    await handle.close();
  });
});

describe("hosted demo board gate", () => {
  it("is required only for production demo deployments", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ROLLING_GA_DEMO", "1");
    expect(hostedDemoBoardGateRequired()).toBe(false);

    vi.stubEnv("NODE_ENV", "production");
    expect(hostedDemoBoardGateRequired()).toBe(true);

    vi.stubEnv("ROLLING_GA_DEMO", "0");
    expect(hostedDemoBoardGateRequired()).toBe(false);
  });

  it("requires a demo board secret when production demo mode is enabled", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ROLLING_GA_DEMO", "1");
    vi.stubEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/rollingga_test_guard");
    delete process.env.ROLLING_GA_DEMO_BOARD_SECRET;

    expect(() => assertHostedDemoBoardSecret()).toThrow(/ROLLING_GA_DEMO_BOARD_SECRET/);
    expect(() => validateProductionEnvironment()).toThrow(/ROLLING_GA_DEMO_BOARD_SECRET/);
  });

  it("accepts production demo mode when board secret and database url are configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ROLLING_GA_DEMO", "1");
    vi.stubEnv("ROLLING_GA_DEMO_BOARD_SECRET", "demo-board-secret-16chars");
    vi.stubEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/rollingga_test_guard");

    expect(() => validateProductionEnvironment()).not.toThrow();
  });

  it("signs and verifies demo board access cookies consistently", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ROLLING_GA_DEMO", "1");
    vi.stubEnv("ROLLING_GA_DEMO_BOARD_SECRET", "demo-board-secret-16chars");

    const nodeCookie = serializeDemoBoardAccessCookie();
    expect(readDemoBoardAccessCookie(nodeCookie)).toBe(true);

    const edgeCookie = await createSignedCookieValue("granted", "demo-board-secret-16chars");
    expect(readDemoBoardAccessCookie(edgeCookie)).toBe(true);
    expect(await verifySignedCookie(edgeCookie, "demo-board-secret-16chars")).toBe("granted");
  });
});

describe("health check", () => {
  it("reports ok when database connectivity and migrations are present", async () => {
    const handle = createPgliteDb(new PGlite());
    await handle.migrate(`${process.cwd()}/drizzle`);

    const result = await runHealthCheck(() => handle);
    expect(result.status).toBe("ok");
    expect(result.checks.application).toBe("ok");
    expect(result.checks.database).toBe("ok");
    expect(result.checks.migrations).toBe("ok");

    await handle.close();
  });

  it("reports error in production when DATABASE_URL is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.DATABASE_URL;
    delete process.env.ROLLING_GA_DATABASE_URL;

    const result = await runHealthCheck(() => {
      throw new Error("should not connect");
    });

    expect(result.status).toBe("error");
    expect(result.checks.database).toBe("error");
    expect(result.details?.error).toMatch(/DATABASE_URL/);
  });
});
