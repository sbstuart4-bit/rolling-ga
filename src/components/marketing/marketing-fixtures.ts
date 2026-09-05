import type { CredentialData } from "@/components/fan/credential-card";
import type { ResolvedTheme } from "@/lib/theme";
import { THE_DEGENS_DEMO_ASSETS } from "@/lib/the-degens-demo-assets";

const ARTIST_PROVENANCE = {
  background: "artist",
  surface: "artist",
  foreground: "artist",
  mutedForeground: "artist",
  accent: "artist",
  accentForeground: "artist",
  accentSecondary: "artist",
  border: "artist",
  fontId: "artist",
} as const;

/** Static The Degens / Detroit fixture — no database reads. */
export const THE_DEGENS_THEME: ResolvedTheme = {
  background: "#0B0B0C",
  surface: "#151517",
  foreground: "#F3F3F0",
  mutedForeground: "#8B8B85",
  accent: "#D8FF3E",
  accentForeground: "#0B0B0C",
  accentSecondary: "#FF4A28",
  border: "#28282C",
  fontId: "space-grotesk",
  logoUrl: THE_DEGENS_DEMO_ASSETS.logo,
  heroImageUrl: THE_DEGENS_DEMO_ASSETS.tourHero,
  cityArtworkUrl: THE_DEGENS_DEMO_ASSETS.cityDetroit,
  tourArtworkUrl: THE_DEGENS_DEMO_ASSETS.tourHero,
  merchPhotographyNote: null,
  showMessaging: "No encore unless we mean it.",
  localMessage: "Detroit, we've been waiting.",
  provenance: ARTIST_PROVENANCE,
};

export const DETROIT_CREDENTIAL: CredentialData = {
  id: "vat_mkt_detroit",
  artistName: "The Degens",
  tourName: "Signal Decay",
  venueName: "The Ironworks",
  city: "Detroit",
  region: "MI",
  startsAt: new Date("2026-06-30T20:00:00-04:00"),
  timezone: "America/Detroit",
  method: "event_qr",
  verifiedAt: new Date("2026-06-30T19:12:00-04:00"),
};

export const HERO_UNLOCK = {
  eyebrow: "Unlocked tonight",
  title: "Detroit Exclusive",
  product: "Encore Tee",
  price: "$55",
};

export const JOURNEY_STEPS = [
  {
    n: "01",
    title: "Attend",
    body: "Fan enters the concert.",
    detail: "The night starts like any other show — the room is full, the artist is about to play.",
  },
  {
    n: "02",
    title: "Verify",
    body: "QR / venue verification establishes I was there.",
    detail: "A venue QR, location check, or staff code proves the fan is actually in the room.",
  },
  {
    n: "03",
    title: "Unlock",
    body: "Artist Takeover opens exclusive show access.",
    detail: "The phone becomes the artist’s world for the night — exclusive merch, drops, and access.",
  },
  {
    n: "04",
    title: "Buy",
    body: "Show exclusives. Endless Aisle. Flash drops. Bundles.",
    detail: "Fans buy from their phone: booth hits, the digital catalog, timed drops, and bundles.",
  },
  {
    n: "05",
    title: "Connect",
    body: "Fan explicitly chooses whether to stay connected with the artist.",
    detail: "Attendance and purchase never grant marketing permission. The fan says yes — or not now.",
  },
  {
    n: "06",
    title: "Return",
    body: "The show remains inside My Shows / My access.",
    detail: "The credential stays. Drops, anniversary access, and purchases live on the fan’s passport.",
  },
  {
    n: "07",
    title: "Buy again",
    body: "Future attendee drops and anniversary releases create new commerce moments.",
    detail: "Verified attendance becomes a channel the artist can activate long after load-out.",
  },
] as const;

export const MARKETING_PRODUCTS = [
  { name: "Tour Tee", image: THE_DEGENS_DEMO_ASSETS.products.prd_av_tour_tee, tag: "Booth" },
  {
    name: "Detroit Exclusive",
    image: THE_DEGENS_DEMO_ASSETS.products.prd_av_detroit_tee,
    tag: "City",
  },
  {
    name: "Limited Poster",
    image: THE_DEGENS_DEMO_ASSETS.products.prd_av_detroit_poster,
    tag: "Show",
  },
  { name: "Vinyl", image: THE_DEGENS_DEMO_ASSETS.products.prd_av_vinyl, tag: "Endless Aisle" },
  {
    name: "Premium Hoodie",
    image: THE_DEGENS_DEMO_ASSETS.products.prd_av_hoodie,
    tag: "Endless Aisle",
  },
  {
    name: "Show Bundle",
    image: THE_DEGENS_DEMO_ASSETS.dropPosters["detroit-tonight"],
    tag: "Bundle",
  },
] as const;

export const ENDLESS_AISLE_EQUATION = {
  booth: 8,
  rollingGa: 24,
  total: 32,
} as const;

export const OBSERVED_FAN_VALUE = {
  showNight: 55,
  postShow: 70,
  total: 125,
} as const;

export const ILLUSTRATIVE_AUDIENCE = {
  city: "Detroit",
  verified: 4218,
  connected: 2104,
  purchasers: 642,
} as const;

export const STUDIO_NAV_ITEMS = [
  { label: "Live", description: "Tonight's show, in real time" },
  { label: "Tour", description: "Tours, shows and QR codes" },
  { label: "Drops", description: "Scheduled and flash drops" },
  { label: "Merch", description: "Products, variants, inventory" },
  { label: "Fans", description: "Consented audience only" },
  { label: "Insights", description: "Per-attendee economics" },
] as const;

export const COHORT_METRICS = [
  { label: "GMV / attendee", value: "$12.40" },
  { label: "Contribution / attendee", value: "$7.10" },
  { label: "Connected fan rate", value: "50%" },
  { label: "Repeat purchase rate", value: "18%" },
  { label: "Post-show GMV", value: "$29.4k" },
  { label: "Endless Aisle GMV", value: "$18.2k" },
] as const;

export const PILOT_MEASURES = [
  "GMV / attendee",
  "Contribution / attendee",
  "Verification rate",
  "Endless Aisle sales",
  "Shipping economics",
  "Connected fan rate",
  "Post-show GMV",
  "Repeat purchase",
] as const;

export const RELATIONSHIP_BEATS = [
  { kicker: "Detroit show", title: "I was there", detail: "Verified attendance becomes a credential." },
  { kicker: "Purchase #1", title: "Show-night merch", detail: "Encore tee from the attendee store." },
  { kicker: "Connected", title: "Permission granted", detail: "The fan chooses to stay connected." },
  { kicker: "90 days later", title: "Detroit attendee drop", detail: "A new offer for people who were in the room." },
  { kicker: "Purchase #2", title: "Post-show commerce", detail: "Attributed to the original show." },
  { kicker: "One year later", title: "Anniversary access", detail: "The same credential unlocks again." },
  { kicker: "Next tour", title: "Returning fan access", detail: "Previous attendees get the next door." },
] as const;

export const FULFILLMENT_STEPS = [
  { title: "Fan orders from their phone at the show." },
  { title: "Order flows to centralized fulfillment." },
  { title: "Pick + pack overnight." },
  { title: "Carrier handoff." },
  { title: "Delivery to fan." },
] as const;

export const EXCLUSIVITY_TYPES = [
  { label: "City exclusives", live: true },
  { label: "Attendee-only drops", live: true },
  { label: "Encore drops", live: true },
  { label: "Anniversary drops", live: true },
  { label: "Returning-fan access", live: true },
] as const;

/** @deprecated Use THE_DEGENS_THEME */
export const ATLAS_VOID_THEME = THE_DEGENS_THEME;

export const MARKETING_NAV = [
  { href: "/product", label: "Product" },
  { href: "/for-artists", label: "For Artists" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/demo", label: "Demo" },
  { href: "/pilot", label: "Pilot" },
] as const;
