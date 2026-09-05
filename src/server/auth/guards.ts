import type { PlatformRole } from "@/lib/types";
import type { ArtistMembership, AuthContext } from "./session";

export type AuthorizationCode = "unauthenticated" | "forbidden" | "not_found";

export class AuthorizationError extends Error {
  readonly code: AuthorizationCode;

  constructor(code: AuthorizationCode, message?: string) {
    super(message ?? code);
    this.name = "AuthorizationError";
    this.code = code;
  }
}

/* ------------------------------------------------------------------ *
 * Pure predicates
 *
 * Every authorization decision in the application resolves to one of these. They take
 * an explicit context rather than reading cookies, which keeps them testable and means
 * a domain service can never accidentally authorize itself against the wrong user.
 * ------------------------------------------------------------------ */

export function hasRole(ctx: AuthContext | null, role: PlatformRole): boolean {
  return !!ctx?.roles.includes(role);
}

export function isAdmin(ctx: AuthContext | null): boolean {
  return hasRole(ctx, "rga_admin");
}

export function hasAnyRole(ctx: AuthContext | null, roles: PlatformRole[]): boolean {
  return !!ctx && roles.some((role) => ctx.roles.includes(role));
}

export function membershipFor(
  ctx: AuthContext | null,
  artistId: string,
): ArtistMembership | undefined {
  return ctx?.memberships.find((m) => m.artistId === artistId);
}

/**
 * Artist tenancy. A team member reaches exactly the artists they hold an
 * `artist_members` row for. Rolling GA admins are the only global exception.
 */
export function canAccessArtist(ctx: AuthContext | null, artistId: string): boolean {
  if (!ctx) return false;
  if (isAdmin(ctx)) return true;
  return membershipFor(ctx, artistId) !== undefined;
}

/** Publishing a live drop or rewriting brand configuration needs more than read access. */
export function canPublishForArtist(ctx: AuthContext | null, artistId: string): boolean {
  if (!ctx) return false;
  if (isAdmin(ctx)) return true;
  return membershipFor(ctx, artistId)?.canPublish === true;
}

export function canOperateFulfillment(ctx: AuthContext | null): boolean {
  return hasAnyRole(ctx, ["fulfillment_operator", "rga_admin"]);
}

/** Fans only ever reach their own private records. */
export function ownsRecord(ctx: AuthContext | null, ownerUserId: string): boolean {
  if (!ctx) return false;
  return ctx.userId === ownerUserId || isAdmin(ctx);
}

/* ------------------------------------------------------------------ *
 * Assertions
 * ------------------------------------------------------------------ */

export function assertUser(ctx: AuthContext | null): asserts ctx is AuthContext {
  if (!ctx) throw new AuthorizationError("unauthenticated");
}

export function assertRole(ctx: AuthContext | null, role: PlatformRole): asserts ctx is AuthContext {
  assertUser(ctx);
  if (!hasRole(ctx, role) && !isAdmin(ctx)) {
    throw new AuthorizationError("forbidden", `Requires the ${role} role.`);
  }
}

export function assertAnyRole(
  ctx: AuthContext | null,
  roles: PlatformRole[],
): asserts ctx is AuthContext {
  assertUser(ctx);
  if (!hasAnyRole(ctx, roles) && !isAdmin(ctx)) {
    throw new AuthorizationError("forbidden", `Requires one of: ${roles.join(", ")}.`);
  }
}

/**
 * The single chokepoint for artist-scoped data. Server code that reads or writes
 * anything belonging to an artist calls this first and passes the resulting artist id
 * into its query, so cross-tenant reads are impossible rather than merely hidden.
 */
export function assertArtistAccess(
  ctx: AuthContext | null,
  artistId: string,
): asserts ctx is AuthContext {
  assertUser(ctx);
  if (!canAccessArtist(ctx, artistId)) {
    throw new AuthorizationError("forbidden", "This artist is not on your account.");
  }
}

export function assertArtistPublish(
  ctx: AuthContext | null,
  artistId: string,
): asserts ctx is AuthContext {
  assertArtistAccess(ctx, artistId);
  if (!canPublishForArtist(ctx, artistId)) {
    throw new AuthorizationError("forbidden", "Your team role cannot publish for this artist.");
  }
}

export function assertOwnership(
  ctx: AuthContext | null,
  ownerUserId: string,
): asserts ctx is AuthContext {
  assertUser(ctx);
  if (!ownsRecord(ctx, ownerUserId)) {
    throw new AuthorizationError("not_found");
  }
}

export function assertFulfillment(ctx: AuthContext | null): asserts ctx is AuthContext {
  assertAnyRole(ctx, ["fulfillment_operator"]);
}

/** The artist a Studio page should default to for this member. */
export function defaultArtistId(ctx: AuthContext): string | null {
  if (ctx.activeArtistId && canAccessArtist(ctx, ctx.activeArtistId)) return ctx.activeArtistId;
  return ctx.memberships[0]?.artistId ?? null;
}
