import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { artistMembers, artists, userRoles, users } from "@/db/schema";
import {
  DEMO_ELENA_MARISOL_ID,
  DEMO_SCOTT_FAN_ID,
  MARISOL_ARTIST_ID,
} from "@/lib/demo-user-ids";
import { DEMO_PASSWORD } from "@/db/seed";
import { canAccessArtist, hasAnyRole } from "@/server/auth/guards";
import { hashPassword } from "@/server/auth/password";
import type { AuthContext } from "@/server/auth/session";

const SCOTT_EMAIL = "scott@example.com";
const ELENA_EMAIL = "elena@marisolreyes.example";

let cachedDemoPasswordHash: string | null = null;

async function demoPasswordHash(): Promise<string> {
  if (!cachedDemoPasswordHash) {
    cachedDemoPasswordHash = await hashPassword(DEMO_PASSWORD);
  }
  return cachedDemoPasswordHash;
}

async function userIdForEmail(email: string): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user?.id ?? null;
}

async function hasArtistMemberRole(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.role, "artist_member")))
    .limit(1);
  return Boolean(row);
}

async function hasFanRole(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.role, "fan")))
    .limit(1);
  return Boolean(row);
}

async function hasMarisolMembership(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ artistId: artistMembers.artistId })
    .from(artistMembers)
    .where(and(eq(artistMembers.userId, userId), eq(artistMembers.artistId, MARISOL_ARTIST_ID)))
    .limit(1);
  return Boolean(row);
}

async function marisolArtistExists(): Promise<boolean> {
  const [row] = await db
    .select({ id: artists.id })
    .from(artists)
    .where(eq(artists.id, MARISOL_ARTIST_ID))
    .limit(1);
  return Boolean(row);
}

/** True when Elena can access Marisol Reyes Artist Studio, not just when the user row exists. */
export async function isElenaMarisolDemoAccountReady(): Promise<boolean> {
  const userId = await userIdForEmail(ELENA_EMAIL);
  if (!userId) return false;
  if (!(await marisolArtistExists())) return false;
  if (!(await hasArtistMemberRole(userId))) return false;
  return hasMarisolMembership(userId);
}

/** True when Scott can run the fan guided demo. */
export async function isScottDemoAccountReady(): Promise<boolean> {
  const userId = await userIdForEmail(SCOTT_EMAIL);
  if (!userId) return false;
  return hasFanRole(userId);
}

export async function areRequiredDemoPersonasReady(): Promise<boolean> {
  const [scott, elena] = await Promise.all([
    isScottDemoAccountReady(),
    isElenaMarisolDemoAccountReady(),
  ]);
  return scott && elena;
}

/**
 * Repairs a partial production seed where Elena exists but her Marisol membership is missing.
 * Safe to call repeatedly — only inserts missing rows.
 */
export async function repairElenaMarisolDemoAccount(): Promise<boolean> {
  if (!(await marisolArtistExists())) return false;

  let userId = await userIdForEmail(ELENA_EMAIL);
  if (!userId) {
    userId = DEMO_ELENA_MARISOL_ID;
    await db
      .insert(users)
      .values({
        id: userId,
        email: ELENA_EMAIL,
        displayName: "Elena Vasquez",
        passwordHash: await demoPasswordHash(),
        onboardingCompletedAt: new Date(),
        isDemo: true,
      })
      .onConflictDoNothing();
  }

  await db
    .insert(userRoles)
    .values({ userId, role: "artist_member" })
    .onConflictDoNothing();

  await db
    .insert(artistMembers)
    .values({
      artistId: MARISOL_ARTIST_ID,
      userId,
      role: "merch_manager",
      canPublish: true,
      isDemo: true,
    })
    .onConflictDoUpdate({
      target: [artistMembers.artistId, artistMembers.userId],
      set: {
        role: "merch_manager",
        canPublish: true,
        isDemo: true,
      },
    });

  return isElenaMarisolDemoAccountReady();
}

export async function repairScottDemoAccount(): Promise<boolean> {
  let userId = await userIdForEmail(SCOTT_EMAIL);
  if (!userId) {
    userId = DEMO_SCOTT_FAN_ID;
    await db
      .insert(users)
      .values({
        id: userId,
        email: SCOTT_EMAIL,
        displayName: "Scott Weller",
        passwordHash: await demoPasswordHash(),
        onboardingCompletedAt: new Date(),
        isDemo: true,
      })
      .onConflictDoNothing();
  }

  await db.insert(userRoles).values({ userId, role: "fan" }).onConflictDoNothing();
  return isScottDemoAccountReady();
}

export function isElenaMarisolDemoSession(ctx: AuthContext): boolean {
  return (
    ctx.email === ELENA_EMAIL &&
    hasAnyRole(ctx, ["artist_member", "rga_admin"]) &&
    canAccessArtist(ctx, MARISOL_ARTIST_ID)
  );
}

export function isScottDemoSession(ctx: AuthContext): boolean {
  return ctx.email === SCOTT_EMAIL && hasAnyRole(ctx, ["fan"]);
}

/** Users table only — kept for quick existence checks during bootstrap. */
export async function requiredDemoPersonaEmailsPresent(): Promise<boolean> {
  const rows = await db
    .select({ email: users.email })
    .from(users)
    .where(inArray(users.email, [SCOTT_EMAIL, ELENA_EMAIL]));
  return rows.length === 2;
}
