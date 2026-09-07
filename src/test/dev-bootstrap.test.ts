import { describe, expect, it, vi } from "vitest";
import { isPgliteAbortError, isPgliteCorruptionError } from "@/db/dev-bootstrap";

describe("dev-bootstrap", () => {
  it("detects PGlite Aborted errors", () => {
    expect(isPgliteAbortError(new Error("Aborted(). Build with -sASSERTIONS for more info."))).toBe(
      true,
    );
    expect(
      isPgliteAbortError(
        new Error("Failed query", { cause: new Error("RuntimeError: Aborted()") }),
      ),
    ).toBe(true);
    expect(isPgliteAbortError(new Error("relation users does not exist"))).toBe(false);
  });

  it("detects corrupt PGlite cluster errors", () => {
    expect(
      isPgliteCorruptionError(
        new Error("Failed query", {
          cause: new Error('could not open file "base/5/25624": No such file or directory'),
        }),
      ),
    ).toBe(true);
    expect(
      isPgliteCorruptionError(
        new Error("duplicate key value violates unique constraint \"artists_pkey\""),
      ),
    ).toBe(true);
  });
});

describe("listDemoAccounts fallback", () => {
  it("returns static personas when database query fails", async () => {
    vi.doUnmock("@/db/dev-bootstrap");
    vi.resetModules();

    vi.mock("@/lib/demo-mode", () => ({ demoModeEnabled: () => true }));
    vi.mock("@/db/dev-bootstrap", () => ({
      withDevDatabaseRecovery: async () => {
        throw new Error("Aborted()");
      },
    }));

    const { listDemoAccounts } = await import("@/server/demo/accounts");
    const accounts = await listDemoAccounts();
    expect(accounts.length).toBe(7);
    expect(accounts.some((a) => a.email === "scott@example.com")).toBe(true);
    expect(accounts.some((a) => a.email === "elena@marisolreyes.example")).toBe(true);

    vi.unmock("@/lib/demo-mode");
    vi.unmock("@/db/dev-bootstrap");
  });
});
