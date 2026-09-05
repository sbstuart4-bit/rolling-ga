import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { artistMembers, sessions, userRoles, users } from "@/db/schema";
import type { ArtistMemberRole, PlatformRole } from "@/lib/types";
import {
  readSessionCookie,
  SESSION_COOKIE_NAME,
  SESSION_TTL_DAYS,
  serializeSessionCookie,
} from "./cookie-token";

export interface ArtistMembership {
  artistId: string;
  artistName: string;
  artistSlug: string;
  role: ArtistMemberRole;
  canPublish: boolean;
}

export interface AuthContext {
  sessionId: string;
  userId: string;
  email: string;
  displayName: string;
  roles: PlatformRole[];
  memberships: ArtistMembership[];
  /** Which artist's Studio the member is currently acting in, when they have several. */
  activeArtistId: string | null;
  /** Null until the fan onboarding wizard is completed. */
  onboardingCompletedAt: Date | null;
}

export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const sessionId = `ses_${randomBytes(24).toString("base64url")}`;

  await db.insert(sessions).values({ id: sessionId, userId, expiresAt });

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, serializeSessionCookie(sessionId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const sessionId = readSessionCookie(store.get(SESSION_COOKIE_NAME)?.value);
  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }
  store.delete(SESSION_COOKIE_NAME);
}

/** Switches which artist a multi-artist team member is acting as. */
export async function setActiveArtist(sessionId: string, artistId: string | null): Promise<void> {
  await db.update(sessions).set({ activeArtistId: artistId }).where(eq(sessions.id, sessionId));
}

/**
 * Reads and validates the current session. Returns null rather than throwing so callers
 * can decide between redirecting, rendering a public view, or refusing outright.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const store = await cookies();
  const sessionId = readSessionCookie(store.get(SESSION_COOKIE_NAME)?.value);
  if (!sessionId) return null;

  const [row] = await db
    .select({
      sessionId: sessions.id,
      activeArtistId: sessions.activeArtistId,
      userId: users.id,
      email: users.email,
      displayName: users.displayName,
      onboardingCompletedAt: users.onboardingCompletedAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!row) return null;

  const [roleRows, membershipRows] = await Promise.all([
    db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, row.userId)),
    db
      .select({
        artistId: artistMembers.artistId,
        role: artistMembers.role,
        canPublish: artistMembers.canPublish,
      })
      .from(artistMembers)
      .where(eq(artistMembers.userId, row.userId)),
  ]);

  const memberships = await hydrateMemberships(membershipRows);

  return {
    sessionId: row.sessionId,
    userId: row.userId,
    email: row.email,
    displayName: row.displayName,
    roles: roleRows.map((r) => r.role),
    memberships,
    activeArtistId: row.activeArtistId,
    onboardingCompletedAt: row.onboardingCompletedAt,
  };
}

async function hydrateMemberships(
  rows: { artistId: string; role: ArtistMemberRole; canPublish: boolean }[],
): Promise<ArtistMembership[]> {
  if (rows.length === 0) return [];

  const { artists } = await import("@/db/schema");
  const { inArray } = await import("drizzle-orm");

  const artistRows = await db
    .select({ id: artists.id, name: artists.name, slug: artists.slug })
    .from(artists)
    .where(
      inArray(
        artists.id,
        rows.map((r) => r.artistId),
      ),
    );

  const byId = new Map(artistRows.map((a) => [a.id, a]));

  return rows.flatMap((row) => {
    const artist = byId.get(row.artistId);
    if (!artist) return [];
    return [
      {
        artistId: row.artistId,
        artistName: artist.name,
        artistSlug: artist.slug,
        role: row.role,
        canPublish: row.canPublish,
      },
    ];
  });
}

/** Removes expired sessions. Called opportunistically on sign-in. */
export async function pruneExpiredSessions(): Promise<void> {
  const { lt } = await import("drizzle-orm");
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}
