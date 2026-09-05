import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { artistBrand, eventThemes, events, tours } from "@/db/schema";
import { mergeTheme, type ResolvedTheme, type ThemeLayer } from "@/lib/theme";

/**
 * Resolves the artist takeover for one show by walking the three configuration levels.
 *
 *   artist_brand  →  tour theme  →  event override
 *
 * Tours inherit everything the artist set; events inherit everything the tour set. A
 * city only has to supply what it actually changes.
 */
export async function resolveEventTheme(eventId: string): Promise<ResolvedTheme> {
  const [row] = await db
    .select({
      artistId: events.artistId,
      tourId: events.tourId,
      localMessage: events.localMessage,
    })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!row) return mergeTheme([]);

  const [brand, tour, override] = await Promise.all([
    loadArtistLayer(row.artistId),
    loadTourLayer(row.tourId),
    loadEventLayer(eventId),
  ]);

  return mergeTheme(
    [
      { level: "artist", layer: brand },
      { level: "tour", layer: tour },
      { level: "event", layer: override },
    ],
    row.localMessage,
  );
}

/** The theme a tour would produce with no event override, used by the brand preview. */
export async function resolveTourTheme(tourId: string): Promise<ResolvedTheme> {
  const [tour] = await db
    .select({ artistId: tours.artistId })
    .from(tours)
    .where(eq(tours.id, tourId))
    .limit(1);

  if (!tour) return mergeTheme([]);

  const [brand, tourLayer] = await Promise.all([
    loadArtistLayer(tour.artistId),
    loadTourLayer(tourId),
  ]);

  return mergeTheme([
    { level: "artist", layer: brand },
    { level: "tour", layer: tourLayer },
  ]);
}

export async function resolveArtistTheme(artistId: string): Promise<ResolvedTheme> {
  return mergeTheme([{ level: "artist", layer: await loadArtistLayer(artistId) }]);
}

async function loadArtistLayer(artistId: string): Promise<ThemeLayer | null> {
  const [brand] = await db
    .select()
    .from(artistBrand)
    .where(eq(artistBrand.artistId, artistId))
    .limit(1);

  if (!brand) return null;

  return {
    background: brand.background,
    surface: brand.surface,
    foreground: brand.foreground,
    mutedForeground: brand.mutedForeground,
    accent: brand.accent,
    accentForeground: brand.accentForeground,
    accentSecondary: brand.accentSecondary,
    border: brand.border,
    fontId: brand.fontId,
    logoUrl: brand.logoUrl,
    heroImageUrl: brand.heroImageUrl,
    merchPhotographyNote: brand.merchPhotographyNote,
    showMessaging: brand.showMessaging,
  };
}

async function loadTourLayer(tourId: string): Promise<ThemeLayer | null> {
  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1);
  if (!tour) return null;

  return {
    background: tour.background,
    surface: tour.surface,
    foreground: tour.foreground,
    mutedForeground: tour.mutedForeground,
    accent: tour.accent,
    accentForeground: tour.accentForeground,
    accentSecondary: tour.accentSecondary,
    border: tour.border,
    fontId: tour.fontId,
    logoUrl: tour.logoUrl,
    heroImageUrl: tour.heroImageUrl,
    tourArtworkUrl: tour.artworkUrl,
    showMessaging: tour.showMessaging,
  };
}

async function loadEventLayer(eventId: string): Promise<ThemeLayer | null> {
  const [override] = await db
    .select()
    .from(eventThemes)
    .where(eq(eventThemes.eventId, eventId))
    .limit(1);

  if (!override) return null;

  return {
    background: override.background,
    surface: override.surface,
    foreground: override.foreground,
    mutedForeground: override.mutedForeground,
    accent: override.accent,
    accentForeground: override.accentForeground,
    accentSecondary: override.accentSecondary,
    border: override.border,
    fontId: override.fontId,
    logoUrl: override.logoUrl,
    heroImageUrl: override.heroImageUrl,
    cityArtworkUrl: override.cityArtworkUrl,
    showMessaging: override.showMessaging,
  };
}
