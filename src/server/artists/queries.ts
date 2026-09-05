import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { artistBrand, artists, tours } from "@/db/schema";
import { assertArtistAccess, defaultArtistId } from "@/server/auth/guards";
import type { AuthContext } from "@/server/auth/session";

export async function listAllArtists() {
  return db
    .select({ id: artists.id, name: artists.name, slug: artists.slug })
    .from(artists)
    .orderBy(asc(artists.name));
}

export async function getArtistById(artistId: string) {
  const [artist] = await db.select().from(artists).where(eq(artists.id, artistId)).limit(1);
  return artist ?? null;
}

export async function getArtistBySlug(slug: string) {
  const [artist] = await db.select().from(artists).where(eq(artists.slug, slug)).limit(1);
  return artist ?? null;
}

/**
 * Resolves which artist a Studio request is acting on and proves the caller may.
 *
 * Every Studio query funnels through here rather than trusting an artist id from the
 * URL, which is what keeps one artist's Studio out of another's data.
 */
export async function resolveStudioArtist(ctx: AuthContext, requestedArtistId?: string) {
  const artistId = requestedArtistId ?? defaultArtistId(ctx);
  if (!artistId) return null;

  assertArtistAccess(ctx, artistId);

  const [artist] = await db
    .select({
      id: artists.id,
      name: artists.name,
      slug: artists.slug,
      bio: artists.bio,
    })
    .from(artists)
    .where(eq(artists.id, artistId))
    .limit(1);

  return artist ?? null;
}

export async function getArtistBrand(artistId: string) {
  const [brand] = await db
    .select()
    .from(artistBrand)
    .where(eq(artistBrand.artistId, artistId))
    .limit(1);
  return brand ?? null;
}

export async function listArtistTours(ctx: AuthContext, artistId: string) {
  assertArtistAccess(ctx, artistId);
  return db.select().from(tours).where(eq(tours.artistId, artistId)).orderBy(asc(tours.name));
}
