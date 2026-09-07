import "server-only";
import { demoArtistBrandImages } from "@/lib/demo-assets";
import { enrichResolvedTheme, isGeneratedDemoCitySvg, isGeneratedDemoPosterSvg } from "@/lib/demo-theme-assets";
import { heroImageFor } from "@/lib/theme";
import { resolveEventTheme } from "@/server/theme/resolve";

export interface PassportHeroContext {
  eventId: string;
  artistId: string;
  tourId: string;
}

/** My Shows cards lead with artist photography when available, not city SVG overrides. */
function passportThumbnailUrl(
  theme: ReturnType<typeof enrichResolvedTheme>,
  artistId: string,
): string | null {
  const brandHero = demoArtistBrandImages(artistId)?.heroImageUrl;
  if (
    brandHero &&
    !isGeneratedDemoPosterSvg(brandHero) &&
    !isGeneratedDemoCitySvg(brandHero)
  ) {
    return brandHero;
  }

  const hero = heroImageFor(theme);
  if (!hero || isGeneratedDemoPosterSvg(hero) || isGeneratedDemoCitySvg(hero)) {
    return brandHero ?? null;
  }
  return hero;
}

/** Resolves clipped thumbnail art for passport cards, keyed by event id. */
export async function resolvePassportHeroImages(
  entries: PassportHeroContext[],
): Promise<Map<string, string | null>> {
  const byEventId = new Map<string, string | null>();
  const uniqueEventIds = [...new Set(entries.map((entry) => entry.eventId))];

  await Promise.all(
    uniqueEventIds.map(async (eventId) => {
      const context = entries.find((entry) => entry.eventId === eventId)!;
      const theme = enrichResolvedTheme(await resolveEventTheme(eventId), context);
      byEventId.set(eventId, passportThumbnailUrl(theme, context.artistId));
    }),
  );

  return byEventId;
}
