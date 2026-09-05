/**
 * Role authorization and artist tenant isolation.
 */
import { describe, it, expect } from "vitest";
import {
  hasRole,
  isAdmin,
  canAccessArtist,
  canPublishForArtist,
  ownsRecord,
} from "@/server/auth/guards";
import type { AuthContext } from "@/server/auth/session";

function ctx(overrides: Partial<AuthContext>): AuthContext {
  return {
    sessionId: "ses_test",
    userId: "usr_test",
    displayName: "Test",
    email: "test@example.com",
    roles: [],
    memberships: [],
    activeArtistId: null,
    onboardingCompletedAt: new Date(),
    ...overrides,
  };
}

describe("hasRole", () => {
  it("returns true when role is present", () => {
    expect(hasRole(ctx({ roles: ["artist_member"] }), "artist_member")).toBe(true);
  });

  it("returns false when role is absent", () => {
    expect(hasRole(ctx({ roles: [] }), "rga_admin")).toBe(false);
  });

  it("returns false for null context", () => {
    expect(hasRole(null, "rga_admin")).toBe(false);
  });
});

describe("isAdmin", () => {
  it("returns true for rga_admin", () => {
    expect(isAdmin(ctx({ roles: ["rga_admin"] }))).toBe(true);
  });

  it("returns false for artist_member", () => {
    expect(isAdmin(ctx({ roles: ["artist_member"] }))).toBe(false);
  });
});

describe("canAccessArtist", () => {
  it("grants admin access to any artist", () => {
    expect(canAccessArtist(ctx({ roles: ["rga_admin"] }), "art_any")).toBe(true);
  });

  it("grants access when artist_members row exists", () => {
    const c = ctx({
      roles: ["artist_member"],
      memberships: [{ artistId: "art_abc", artistSlug: "x", artistName: "X", role: "management", canPublish: false }],
    });
    expect(canAccessArtist(c, "art_abc")).toBe(true);
  });

  it("denies access to an artist the member is not on", () => {
    const c = ctx({
      roles: ["artist_member"],
      memberships: [{ artistId: "art_abc", artistSlug: "x", artistName: "X", role: "management", canPublish: false }],
    });
    expect(canAccessArtist(c, "art_xyz")).toBe(false);
  });

  it("denies access with no context", () => {
    expect(canAccessArtist(null, "art_abc")).toBe(false);
  });
});

describe("canPublishForArtist", () => {
  it("allows publish when canPublish is true", () => {
    const c = ctx({
      roles: ["artist_member"],
      memberships: [{ artistId: "art_abc", artistSlug: "x", artistName: "X", role: "management", canPublish: true }],
    });
    expect(canPublishForArtist(c, "art_abc")).toBe(true);
  });

  it("denies publish when canPublish is false", () => {
    const c = ctx({
      roles: ["artist_member"],
      memberships: [{ artistId: "art_abc", artistSlug: "x", artistName: "X", role: "merch_manager", canPublish: false }],
    });
    expect(canPublishForArtist(c, "art_abc")).toBe(false);
  });

  it("admin can always publish", () => {
    expect(canPublishForArtist(ctx({ roles: ["rga_admin"] }), "art_any")).toBe(true);
  });
});

describe("ownsRecord", () => {
  it("owner can access own record", () => {
    expect(ownsRecord(ctx({ userId: "usr_abc" }), "usr_abc")).toBe(true);
  });

  it("non-owner is denied", () => {
    expect(ownsRecord(ctx({ userId: "usr_abc" }), "usr_xyz")).toBe(false);
  });

  it("admin can access any record", () => {
    expect(ownsRecord(ctx({ userId: "usr_abc", roles: ["rga_admin"] }), "usr_xyz")).toBe(true);
  });
});
