/**
 * The Degens artwork, with the unsafe parts cropped off.
 *
 * The generated Degens assets carry dates and venues that contradict the seeded
 * demo show (Ironworks Detroit, June 30 2026): the tour art says "Tour 2025",
 * the city plate says 10.04.2025, the numbered poster and the anniversary
 * hoodie say St. Andrew's Hall, Oct 14 2026. Marketing states the demo date out
 * loud, so that text can never appear legibly beside it.
 *
 * Each entry therefore records the region of the file that is safe to show.
 * `<SafeArt>` renders only that region, which means the safety rule is enforced
 * by the registry instead of by remembering to crop at every call site. Only
 * assets listed here are used on the homepage.
 */

export interface DegensArtEntry {
  src: string;
  /** Natural pixel dimensions, used to derive the cropped aspect ratio. */
  natural: { width: number; height: number };
  /** Fraction of the file to keep, as [start, end] on each axis. */
  keep: { x: readonly [number, number]; y: readonly [number, number] };
  alt: string;
  /** Why this crop exists, when it exists to remove conflicting text. */
  cropped?: string;
}

export const DEGENS_ART = {
  /** Tour art. Bottom quarter is the 2025 route; the headline block says "Tour 2025". */
  tourPoster: {
    src: "/demo/poster-atlas-void-signal-decay.png",
    natural: { width: 1024, height: 1536 },
    keep: { x: [0, 1], y: [0.22, 0.74] },
    alt: "The Degens Signal Decay tour artwork",
    cropped: "Removes the 2025 tour date list and the Tour 2025 lockup.",
  },

  /** Detroit city plate. Says Ironworks, which is right — and 10.04.2025, which is not. */
  cityPlate: {
    src: "/demo/city-atlas-detroit.png",
    natural: { width: 1586, height: 992 },
    keep: { x: [0, 0.7], y: [0, 1] },
    alt: "The Degens Detroit show artwork",
    cropped: "Removes the stamped venue-and-date block and the Tour 2025 lockup.",
  },

  /** Encore drop poster. Venue and date block sits mid-right. */
  encorePoster: {
    src: "/demo/poster-detroit-encore.png",
    natural: { width: 1024, height: 1536 },
    keep: { x: [0, 1], y: [0, 0.5] },
    alt: "The Degens Detroit Encore poster",
    cropped: "Removes the Oct 04 2025 venue block.",
  },

  /** Show-night poster. Venue and date block sits along the bottom. */
  tonightPoster: {
    src: "/demo/poster-detroit-tonight.png",
    natural: { width: 1024, height: 1536 },
    keep: { x: [0, 1], y: [0.3, 0.76] },
    alt: "The Degens Detroit show poster",
    cropped: "Removes the Oct 04 2025 venue block and the Tour 2025 lockup.",
  },

  /** Numbered Detroit print. Venue and date are printed bottom-left. */
  numberedPoster: {
    src: "/demo/product-prd-av-detroit-poster.png",
    natural: { width: 1024, height: 1536 },
    keep: { x: [0, 1], y: [0, 0.78] },
    alt: "The Degens numbered Detroit screenprint",
    cropped: "Removes the St. Andrew's Hall / Oct 14 2026 line.",
  },

  /**
   * The edition stamp alone. Scarcity is the only idea we need from this print,
   * and the stamp carries it without asserting a venue or a date.
   */
  editionStamp: {
    src: "/demo/product-prd-av-detroit-poster.png",
    natural: { width: 1024, height: 1536 },
    keep: { x: [0.42, 0.62], y: [0.808, 0.928] },
    alt: "Edition stamp reading number 037 of 250",
    cropped: "Isolates the edition stamp from a print whose venue and date conflict.",
  },

  /** Detroit Encore Tee. Carries the city with no date anywhere on the garment. */
  detroitTee: {
    src: "/demo/product-prd-av-detroit-tee.png",
    natural: { width: 1254, height: 1254 },
    keep: { x: [0, 1], y: [0, 1] },
    alt: "The Degens Detroit Last Resort tee",
  },

  /** Tour hoodie, front only. The back of the sheet prints the 2025 route. */
  hoodieFront: {
    src: "/demo/product-prd-av-hoodie.png",
    natural: { width: 1122, height: 1402 },
    keep: { x: [0.09, 0.53], y: [0.15, 0.68] },
    alt: "The Degens tour hoodie",
    cropped: "Front view only; the back view prints the 2025 tour route.",
  },

  /** Construction details: neck label, sleeve hit, woven patch. All date-free. */
  hoodieDetails: {
    src: "/demo/product-prd-av-hoodie.png",
    natural: { width: 1122, height: 1402 },
    keep: { x: [0.01, 0.99], y: [0.725, 0.958] },
    alt: "Hoodie neck label, sleeve print and woven patch",
    cropped: "Detail strip only, which keeps the dated tour print out of frame.",
  },

  /** Skateboard, three views. Deck graphic prints a venue and date near the tail. */
  skateboard: {
    src: "/demo/product-prd-av-skateboard.png",
    natural: { width: 1230, height: 1278 },
    keep: { x: [0, 1], y: [0, 0.77] },
    alt: "The Degens Detroit skateboard deck, three views",
    cropped: "Removes the Oct 14 2026 venue line printed near the tail.",
  },

  /** Returning-fan print. "Real fans show up again" is the whole idea. */
  returningPrint: {
    src: "/demo/product-prd-av-returning-print.png",
    natural: { width: 1024, height: 1536 },
    keep: { x: [0, 1], y: [0, 0.87] },
    alt: "The Degens Second Show Club print",
    cropped: "Removes the Oct 15 2026 venue line.",
  },

  /** Anniversary hoodie, back view. The front chest prints a conflicting venue and date. */
  anniversaryHoodieBack: {
    src: "/demo/product-prd-av-detroit-anniversary-hoodie.png",
    natural: { width: 1254, height: 1254 },
    keep: { x: [0.58, 1], y: [0.03, 0.95] },
    alt: "The Degens Detroit anniversary hoodie, back view",
    cropped: "Back view only; the front chest prints St. Andrew's Hall / Oct 14 2026.",
  },

  /** Wordmark. */
  logo: {
    src: "/demo/logo-the-degens.png",
    natural: { width: 2172, height: 724 },
    keep: { x: [0, 1], y: [0, 1] },
    alt: "The Degens",
  },
} as const satisfies Record<string, DegensArtEntry>;

export type DegensArtId = keyof typeof DEGENS_ART;

/** Aspect ratio of the safe region, which is what a container has to reserve. */
export function safeArtAspect(id: DegensArtId): number {
  const { natural, keep } = DEGENS_ART[id];
  return (natural.width * (keep.x[1] - keep.x[0])) / (natural.height * (keep.y[1] - keep.y[0]));
}

/** Posters for the flyposted wall, in the order they layer. */
export const POSTER_WALL: readonly DegensArtId[] = [
  "tonightPoster",
  "numberedPoster",
  "encorePoster",
  "returningPrint",
  "tourPoster",
];
