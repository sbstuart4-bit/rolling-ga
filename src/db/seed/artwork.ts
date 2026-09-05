import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRng } from "@/lib/rng";

/**
 * Generates the demo's artwork as SVG files under `public/demo/`.
 *
 * Nothing here is a photograph or a licensed asset: every image is composed from the
 * artist's own palette and typography, so the demo looks art-directed without shipping
 * imagery we do not own. The database stores ordinary URLs, so replacing any of these
 * with real photography is just a matter of changing the string.
 */
const OUTPUT_DIR = resolve(process.cwd(), "public", "demo");

export interface ArtworkPalette {
  background: string;
  surface: string;
  foreground: string;
  accent: string;
  accentSecondary: string;
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function write(name: string, svg: string): string {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(resolve(OUTPUT_DIR, `${name}.svg`), svg.trim(), "utf8");
  return `/demo/${name}.svg`;
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] as string,
  );
}

/** A flat wordmark. Artists rarely have a symbol at this stage; the name is the logo. */
export function generateWordmark(name: string, palette: ArtworkPalette): string {
  const label = escapeXml(name.toUpperCase());
  const width = Math.max(320, label.length * 46);

  return write(
    `logo-${slug(name)}`,
    `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 120" role="img" aria-label="${label}">
  <rect width="${width}" height="120" fill="none"/>
  <text x="0" y="86" font-family="Archivo, Helvetica, Arial, sans-serif" font-size="76"
        font-weight="800" letter-spacing="-2" fill="${palette.foreground}">${label}</text>
  <rect x="0" y="102" width="${Math.min(width, 96)}" height="6" fill="${palette.accent}"/>
</svg>`,
  );
}

/**
 * Tour poster artwork. The composition varies by seed so three artists do not look like
 * three colourways of one template.
 */
export function generatePoster(
  key: string,
  title: string,
  subtitle: string,
  palette: ArtworkPalette,
): string {
  const rng = createRng(hashSeed(key));
  const variant = rng.randInt(0, 2);

  const geometry =
    variant === 0
      ? arcs(rng, palette)
      : variant === 1
        ? grid(rng, palette)
        : horizon(rng, palette);

  return write(
    `poster-${slug(key)}`,
    `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.background}"/>
      <stop offset="100%" stop-color="${palette.surface}"/>
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>
  <rect width="1600" height="1000" fill="url(#bg)"/>
  ${geometry}
  <rect width="1600" height="1000" filter="url(#grain)" opacity="0.05"/>
  <text x="96" y="800" font-family="Archivo, Helvetica, Arial, sans-serif" font-size="132"
        font-weight="800" letter-spacing="-5" fill="${palette.foreground}">${escapeXml(title.toUpperCase())}</text>
  <text x="100" y="856" font-family="Archivo, Helvetica, Arial, sans-serif" font-size="30"
        font-weight="600" letter-spacing="10" fill="${palette.accent}">${escapeXml(subtitle.toUpperCase())}</text>
</svg>`,
  );
}

/** City artwork for an event override: the city name at poster scale. */
export function generateCityArtwork(
  key: string,
  city: string,
  palette: ArtworkPalette,
): string {
  const rng = createRng(hashSeed(`city:${key}`));
  const rings = Array.from({ length: 7 }, (_, i) => {
    const r = 140 + i * 78;
    return `<circle cx="1180" cy="440" r="${r}" fill="none" stroke="${
      i % 2 === 0 ? palette.accent : palette.accentSecondary
    }" stroke-width="${rng.randInt(1, 3)}" opacity="${(0.34 - i * 0.04).toFixed(2)}"/>`;
  }).join("\n  ");

  return write(
    `city-${slug(key)}`,
    `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" role="img" aria-label="${escapeXml(city)}">
  <rect width="1600" height="1000" fill="${palette.background}"/>
  ${rings}
  <rect x="0" y="0" width="1600" height="1000" fill="${palette.background}" opacity="0.15"/>
  <text x="96" y="620" font-family="Archivo, Helvetica, Arial, sans-serif" font-size="210"
        font-weight="800" letter-spacing="-10" fill="${palette.foreground}">${escapeXml(city.toUpperCase())}</text>
  <rect x="100" y="668" width="220" height="10" fill="${palette.accent}"/>
</svg>`,
  );
}

/**
 * Product photography stand-in. It reads as a styled studio shot on a seamless
 * backdrop rather than a broken-image box, and carries the artist's palette.
 */
export function generateProductShot(
  key: string,
  name: string,
  category: string,
  palette: ArtworkPalette,
): string {
  const rng = createRng(hashSeed(`product:${key}`));
  const shape = productSilhouette(category, palette, rng.randInt(0, 1) === 1);

  return write(
    `product-${slug(key)}`,
    `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500" role="img" aria-label="${escapeXml(name)}">
  <defs>
    <linearGradient id="seamless" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${palette.surface}"/>
      <stop offset="62%" stop-color="${palette.background}"/>
      <stop offset="100%" stop-color="${palette.surface}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="1500" fill="url(#seamless)"/>
  <ellipse cx="600" cy="1290" rx="330" ry="46" fill="${palette.foreground}" opacity="0.08"/>
  ${shape}
  <text x="600" y="1420" text-anchor="middle" font-family="Archivo, Helvetica, Arial, sans-serif"
        font-size="26" font-weight="600" letter-spacing="8"
        fill="${palette.foreground}" opacity="0.42">${escapeXml(category.toUpperCase())}</text>
</svg>`,
  );
}

function productSilhouette(category: string, palette: ArtworkPalette, flipped: boolean): string {
  const ink = palette.accent;
  const body = palette.foreground;

  switch (category) {
    case "apparel":
      return `
  <path d="M380 430 L520 360 Q600 410 680 360 L820 430 L770 560 L720 535 L720 1240 L480 1240 L480 535 L430 560 Z"
        fill="${body}" opacity="0.93"/>
  <rect x="${flipped ? 545 : 520}" y="700" width="160" height="160" rx="12" fill="${ink}" opacity="0.9"/>`;
    case "headwear":
      return `
  <path d="M340 900 Q600 520 860 900 Z" fill="${body}" opacity="0.93"/>
  <path d="M300 900 Q600 960 900 900 L900 960 Q600 1030 300 960 Z" fill="${body}" opacity="0.8"/>
  <circle cx="600" cy="770" r="66" fill="${ink}" opacity="0.9"/>`;
    case "collectible":
    case "print":
      return `
  <rect x="360" y="330" width="480" height="900" fill="${palette.surface}" stroke="${body}" stroke-width="6" opacity="0.96"/>
  <rect x="420" y="400" width="360" height="520" fill="${ink}" opacity="0.85"/>
  <rect x="420" y="980" width="240" height="18" fill="${body}" opacity="0.6"/>
  <rect x="420" y="1030" width="150" height="18" fill="${body}" opacity="0.35"/>`;
    case "music":
      return `
  <circle cx="600" cy="780" r="330" fill="${body}" opacity="0.94"/>
  <circle cx="600" cy="780" r="180" fill="none" stroke="${palette.background}" stroke-width="2" opacity="0.5"/>
  <circle cx="600" cy="780" r="110" fill="${ink}"/>
  <circle cx="600" cy="780" r="16" fill="${palette.background}"/>`;
    case "accessory":
      return `
  <circle cx="600" cy="780" r="200" fill="${ink}" opacity="0.92"/>
  <circle cx="600" cy="780" r="132" fill="none" stroke="${palette.background}" stroke-width="14"/>
  <rect x="560" y="560" width="80" height="80" rx="16" fill="${body}" opacity="0.8"/>`;
    default:
      return `
  <rect x="380" y="480" width="440" height="620" rx="24" fill="${body}" opacity="0.9"/>
  <rect x="440" y="560" width="320" height="320" fill="${ink}" opacity="0.9"/>`;
  }
}

function arcs(rng: ReturnType<typeof createRng>, palette: ArtworkPalette): string {
  return Array.from({ length: 9 }, (_, i) => {
    const r = 120 + i * 96;
    return `<circle cx="1230" cy="330" r="${r}" fill="none" stroke="${
      i % 3 === 0 ? palette.accentSecondary : palette.accent
    }" stroke-width="${rng.randInt(1, 4)}" opacity="${(0.4 - i * 0.035).toFixed(2)}"/>`;
  }).join("\n  ");
}

function grid(rng: ReturnType<typeof createRng>, palette: ArtworkPalette): string {
  const lines: string[] = [];
  for (let x = 0; x <= 1600; x += 64) {
    lines.push(
      `<line x1="${x}" y1="0" x2="${x}" y2="1000" stroke="${palette.accent}" stroke-width="1" opacity="${(rng.randFloat(0.03, 0.16, 2)).toFixed(2)}"/>`,
    );
  }
  lines.push(
    `<rect x="900" y="120" width="560" height="560" fill="${palette.accent}" opacity="0.16"/>`,
    `<rect x="980" y="200" width="400" height="400" fill="${palette.accentSecondary}" opacity="0.2"/>`,
  );
  return lines.join("\n  ");
}

function horizon(rng: ReturnType<typeof createRng>, palette: ArtworkPalette): string {
  const bands = Array.from({ length: 14 }, (_, i) => {
    const y = 120 + i * 34;
    const w = 1600 - rng.randInt(0, 700);
    return `<rect x="0" y="${y}" width="${w}" height="${rng.randInt(4, 16)}" fill="${
      i % 4 === 0 ? palette.accentSecondary : palette.accent
    }" opacity="${(0.5 - i * 0.028).toFixed(2)}"/>`;
  });
  return bands.join("\n  ");
}

export function slug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
