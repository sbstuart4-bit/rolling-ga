/**
 * Runtime demo theme asset resolution.
 *
 * Seeded theme rows may still reference generated SVG placeholders after PNG art
 * lands in `/public/demo`. Canonical maps in `demo-assets` win at render time.
 */
import {
  demoArtistBrandImages,
  demoEventCityImage,
  MARISOL_REYES_DEMO_ASSETS,
  NOVA_KESTREL_DEMO_ASSETS,
  THE_DEGENS_DEMO_ASSETS,
} from "@/lib/demo-assets";
import type { ResolvedTheme } from "@/lib/theme";

const GENERATED_LOGO_SVG = /^\/demo\/logo-.+\.svg$/i;
const GENERATED_POSTER_SVG = /^\/demo\/poster-.+\.svg$/i;
const GENERATED_CITY_SVG = /^\/demo\/city-.+\.svg$/i;

export function isGeneratedDemoLogoSvg(url: string | null | undefined): boolean {
  return Boolean(url && GENERATED_LOGO_SVG.test(url));
}

export function isGeneratedDemoPosterSvg(url: string | null | undefined): boolean {
  return Boolean(url && GENERATED_POSTER_SVG.test(url));
}

export function isGeneratedDemoCitySvg(url: string | null | undefined): boolean {
  return Boolean(url && GENERATED_CITY_SVG.test(url));
}

/** Prefer canonical demo PNG over stale seeded SVG for theme URLs. */
export function resolveDemoThemeUrl(
  stored: string | null | undefined,
  canonical: string | undefined,
): string | null {
  if (canonical) return canonical;
  return stored ?? null;
}

const TOUR_ARTWORK_BY_ID: Partial<Record<string, string>> = {
  tor_signal_decay: THE_DEGENS_DEMO_ASSETS.tourHero,
  tor_gold_hour: NOVA_KESTREL_DEMO_ASSETS.hero,
  tor_violeta: MARISOL_REYES_DEMO_ASSETS.hero,
};

export function enrichResolvedTheme(
  theme: ResolvedTheme,
  context: { artistId: string; eventId: string; tourId: string },
): ResolvedTheme {
  const brand = demoArtistBrandImages(context.artistId);
  const city = demoEventCityImage(context.eventId);
  const tourArt = TOUR_ARTWORK_BY_ID[context.tourId];

  return {
    ...theme,
    logoUrl: resolveDemoThemeUrl(theme.logoUrl, brand?.logoUrl),
    heroImageUrl: resolveDemoThemeUrl(theme.heroImageUrl, brand?.heroImageUrl),
    cityArtworkUrl: resolveDemoThemeUrl(theme.cityArtworkUrl, city),
    tourArtworkUrl: resolveDemoThemeUrl(theme.tourArtworkUrl, tourArt),
  };
}
