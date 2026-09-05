import type { CSSProperties } from "react";
import { artistFontVariable, DEFAULT_ARTIST_FONT_ID } from "./fonts";

/**
 * The flat set of tokens an artist controls. Three configuration levels
 * (artist brand, tour, event) collapse into exactly this before anything renders,
 * so a component never needs to know where a value came from.
 */
export interface ThemeTokens {
  background: string | null;
  surface: string | null;
  foreground: string | null;
  mutedForeground: string | null;
  accent: string | null;
  accentForeground: string | null;
  accentSecondary: string | null;
  border: string | null;
  fontId: string | null;
}

export interface ThemeAssets {
  logoUrl: string | null;
  heroImageUrl: string | null;
  /** Set only when a city overrides the tour hero with its own artwork. */
  cityArtworkUrl: string | null;
  tourArtworkUrl: string | null;
  merchPhotographyNote: string | null;
}

export interface ResolvedTheme extends ThemeTokens, ThemeAssets {
  /** Tour- or artist-level standing message. */
  showMessaging: string | null;
  /** Event-level message, e.g. "Detroit, we've been waiting." */
  localMessage: string | null;
  /** Which of the three levels supplied each visible value, for the brand manager. */
  provenance: Record<keyof ThemeTokens, ThemeLevel | null>;
}

export type ThemeLevel = "artist" | "tour" | "event";

export type ThemeLayer = Partial<ThemeTokens> & Partial<ThemeAssets> & {
  showMessaging?: string | null;
};

const TOKEN_KEYS = [
  "background",
  "surface",
  "foreground",
  "mutedForeground",
  "accent",
  "accentForeground",
  "accentSecondary",
  "border",
  "fontId",
] as const;

const EMPTY_THEME: ResolvedTheme = {
  background: null,
  surface: null,
  foreground: null,
  mutedForeground: null,
  accent: null,
  accentForeground: null,
  accentSecondary: null,
  border: null,
  fontId: null,
  logoUrl: null,
  heroImageUrl: null,
  cityArtworkUrl: null,
  tourArtworkUrl: null,
  merchPhotographyNote: null,
  showMessaging: null,
  localMessage: null,
  provenance: {
    background: null,
    surface: null,
    foreground: null,
    mutedForeground: null,
    accent: null,
    accentForeground: null,
    accentSecondary: null,
    border: null,
    fontId: null,
  },
};

/**
 * Merges the cascade. A later level only overrides a token it actually sets, which is
 * what makes "configure the whole tour once, override one city" work: the Detroit event
 * can supply nothing but a hero image and still inherit the tour's entire palette.
 */
export function mergeTheme(
  layers: { level: ThemeLevel; layer: ThemeLayer | null | undefined }[],
  eventLocalMessage?: string | null,
): ResolvedTheme {
  const result: ResolvedTheme = {
    ...EMPTY_THEME,
    provenance: { ...EMPTY_THEME.provenance },
    localMessage: eventLocalMessage ?? null,
  };

  for (const { level, layer } of layers) {
    if (!layer) continue;

    for (const key of TOKEN_KEYS) {
      const value = layer[key];
      if (value != null && value !== "") {
        result[key] = value;
        result.provenance[key] = level;
      }
    }

    if (layer.logoUrl) result.logoUrl = layer.logoUrl;
    if (layer.heroImageUrl) result.heroImageUrl = layer.heroImageUrl;
    if (layer.cityArtworkUrl) result.cityArtworkUrl = layer.cityArtworkUrl;
    if (layer.tourArtworkUrl) result.tourArtworkUrl = layer.tourArtworkUrl;
    if (layer.merchPhotographyNote) result.merchPhotographyNote = layer.merchPhotographyNote;
    if (layer.showMessaging) result.showMessaging = layer.showMessaging;
  }

  return result;
}

/**
 * Turns a resolved theme into inline custom properties. Only tokens the artist actually
 * set are emitted; everything else falls through to the Rolling GA neutrals declared in
 * `globals.css`, so a half-configured artist is still legible rather than broken.
 */
export function themeToCssVars(theme: ResolvedTheme): CSSProperties {
  const vars: Record<string, string> = {};

  if (theme.background) vars["--artist-bg"] = theme.background;
  if (theme.surface) vars["--artist-surface"] = theme.surface;
  if (theme.foreground) vars["--artist-fg"] = theme.foreground;
  if (theme.mutedForeground) vars["--artist-muted"] = theme.mutedForeground;
  if (theme.accent) vars["--artist-accent"] = theme.accent;
  if (theme.accentForeground) vars["--artist-accent-fg"] = theme.accentForeground;
  if (theme.accentSecondary) vars["--artist-accent-2"] = theme.accentSecondary;
  if (theme.border) vars["--artist-border"] = theme.border;

  vars["--artist-font"] = `var(${artistFontVariable(theme.fontId ?? DEFAULT_ARTIST_FONT_ID)})`;

  return vars as CSSProperties;
}

/** The image a show should lead with: city artwork wins, then event hero, then tour hero. */
export function heroImageFor(theme: ResolvedTheme): string | null {
  return theme.cityArtworkUrl ?? theme.heroImageUrl ?? theme.tourArtworkUrl;
}
