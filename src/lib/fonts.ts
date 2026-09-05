import { Archivo, Bebas_Neue, DM_Serif_Display, Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";

export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

/** Rolling GA brand display face — Bebas Neue, all-caps poster energy. */
export const bebasNeue = Bebas_Neue({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

/** Rolling GA's own editorial display face. */
export const archivo = Archivo({
  variable: "--font-editorial",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Artists pick a display face from this allowlist rather than uploading font files,
 * which keeps licensing unambiguous and lets the takeover load fonts through
 * `next/font` instead of an arbitrary remote stylesheet.
 */
const spaceGrotesk = Space_Grotesk({
  variable: "--font-artist-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const bebasNeueArtist = Bebas_Neue({
  variable: "--font-artist-bebas",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-artist-dm-serif",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export interface ArtistFontOption {
  id: string;
  label: string;
  description: string;
  /** The CSS variable name the takeover wrapper points `--artist-font` at. */
  cssVariable: string;
  /** Set on `<html>` so the font is available anywhere a takeover renders. */
  className: string;
}

export const ARTIST_FONTS: ArtistFontOption[] = [
  {
    id: "editorial",
    label: "Archivo",
    description: "Rolling GA default. Neutral editorial grotesque.",
    cssVariable: "--font-editorial",
    className: archivo.variable,
  },
  {
    id: "space-grotesk",
    label: "Space Grotesk",
    description: "Technical, slightly mechanical.",
    cssVariable: "--font-artist-space-grotesk",
    className: spaceGrotesk.variable,
  },
  {
    id: "bebas",
    label: "Bebas Neue",
    description: "Tall condensed caps. Poster energy.",
    cssVariable: "--font-artist-bebas",
    className: bebasNeueArtist.variable,
  },
  {
    id: "dm-serif",
    label: "DM Serif Display",
    description: "High-contrast serif for classic tours.",
    cssVariable: "--font-artist-dm-serif",
    className: dmSerifDisplay.variable,
  },
  {
    id: "system-sans",
    label: "Inter",
    description: "Understated. Lets artwork carry the identity.",
    cssVariable: "--font-inter",
    className: inter.variable,
  },
];

export const DEFAULT_ARTIST_FONT_ID = "editorial";

export function artistFontVariable(fontId: string | null | undefined): string {
  const match = ARTIST_FONTS.find((f) => f.id === fontId);
  return (match ?? ARTIST_FONTS[0]).cssVariable;
}

/** Every allowlisted font variable, applied once on `<html>`. */
export const allFontClassNames = [
  inter.variable,
  jetbrainsMono.variable,
  bebasNeue.variable,
  archivo.variable,
  spaceGrotesk.variable,
  bebasNeueArtist.variable,
  dmSerifDisplay.variable,
].join(" ");
