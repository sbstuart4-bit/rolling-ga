import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Eye,
  Heart,
  Music,
  Package,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Star,
  Ticket,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";

/** Real concert and editorial photography — not stock. */
export const MKT_PHOTOS = {
  heroHomeBackdrop: "/marketing/hero-home-backdrop.png",
  /** Wide B&W official merch booth — homepage opportunity section backdrop. */
  opportunityBackdrop: "/marketing/merch-line-bw.png",
  marisolPortrait: "/marketing/marisol-reyes-portrait.png",
  merchLine: "/marketing/merch-line-bw.png",
  frontRowCrowd: "/marketing/fan-front-row-crowd.png",
  arenaStage: "/marketing/arena-stage-blue.png",
  pilotVenue: "/marketing/pilot-merch-table.png",
  backstageAmp: "/marketing/backstage-amp.png",
  /** Problem card crops — same documentary set as the opportunity backdrop. */
  problemLongLines: "/marketing/merch-line-bw.png",
  problemSoldOut: "/marketing/merch-line-bw.png",
  problemCarryAll: "/marketing/pilot-merch-table.png",
} as const;

export const HOME_HERO_BENEFITS = [
  { icon: BarChart3, label: "Increase merch sales" },
  { icon: Package, label: "Sell more products" },
  { icon: Users, label: "Know your fans" },
  { icon: Heart, label: "Keep the moment going" },
] as const satisfies readonly { icon: LucideIcon; label: string }[];

export const HOME_PROBLEM_ITEMS = [
  {
    title: "Long lines",
    body: "Fans wait. Many walk away.",
    photo: MKT_PHOTOS.problemLongLines,
    photoAlt: "Fans waiting in a long official merchandise line at a concert",
    objectPosition: "50% 88%",
  },
  {
    title: "Sold-out sizes",
    body: "Limited inventory means lost sales.",
    photo: MKT_PHOTOS.problemSoldOut,
    photoAlt: "Sold-out sizes on the official merchandise display",
    objectPosition: "50% 18%",
  },
  {
    title: "Fans carry it all",
    body: "It gets in the way of the show experience.",
    photo: MKT_PHOTOS.problemCarryAll,
    photoAlt: "Fans carrying multiple shirts away from the merch table",
    objectPosition: "72% 55%",
  },
] as const;

export const HOME_BETTER_WAY_BENEFITS = [
  "Sell more, without bigger merch tables",
  "Offer exclusive, city-specific drops",
  "Reduce stockouts and leftover inventory",
  "Keep more of the value",
  "Turn show nights into long-term fan relationships",
] as const;

/** Bump when marketing screenshots are re-captured so browsers skip stale PNG cache. */
export const MARKETING_SCREENSHOT_VERSION = "10";

/** Real Marisol guided-demo UI — captured from the product, not illustrated. */
export const MARISOL_REYES_SHOP_SCREENSHOT = `/marketing/marisol-reyes-shop-mobile.png?v=${MARKETING_SCREENSHOT_VERSION}`;
export const MARISOL_REYES_DISCOVER_SCREENSHOT = `/marketing/marisol-reyes-discover-mobile.png?v=${MARKETING_SCREENSHOT_VERSION}`;
export const MARISOL_REYES_UNLOCK_SCREENSHOT = `/marketing/marisol-reyes-unlock-mobile.png?v=${MARKETING_SCREENSHOT_VERSION}`;
export const MARISOL_REYES_RECEIVE_SCREENSHOT = `/marketing/marisol-reyes-receive-mobile.png?v=${MARKETING_SCREENSHOT_VERSION}`;
export const MARISOL_REYES_MY_SHOWS_SCREENSHOT = `/marketing/marisol-reyes-my-shows-mobile.png?v=${MARKETING_SCREENSHOT_VERSION}`;
export const MARISOL_REYES_CREDENTIAL_SCREENSHOT = `/marketing/marisol-reyes-credential-mobile.png?v=${MARKETING_SCREENSHOT_VERSION}`;
export const MARISOL_REYES_STUDIO_SCREENSHOT = `/marketing/marisol-reyes-artist-studio-desktop.png?v=${MARKETING_SCREENSHOT_VERSION}`;

/** Primary marketing demo CTA label — enters Marcus Vale Artist Studio directly. */
export const MARKETING_DEMO_CTA_LABEL = "Experience the Demo";

/** Fan-journey demo CTA for /for-fans and fan-focused sections. */
export const MARKETING_FAN_DEMO_CTA_LABEL = "Experience Marisol's Show";

/** @deprecated Use MARISOL_REYES_* screenshot constants. */
export const NOVA_KESTREL_SHOP_SCREENSHOT = MARISOL_REYES_SHOP_SCREENSHOT;
export const NOVA_KESTREL_DISCOVER_SCREENSHOT = MARISOL_REYES_DISCOVER_SCREENSHOT;
export const NOVA_KESTREL_UNLOCK_SCREENSHOT = MARISOL_REYES_UNLOCK_SCREENSHOT;
export const NOVA_KESTREL_RECEIVE_SCREENSHOT = MARISOL_REYES_RECEIVE_SCREENSHOT;
export const NOVA_KESTREL_MY_SHOWS_SCREENSHOT = MARISOL_REYES_MY_SHOWS_SCREENSHOT;
export const NOVA_KESTREL_CREDENTIAL_SCREENSHOT = MARISOL_REYES_CREDENTIAL_SCREENSHOT;

export const HOME_SOLUTION_RAIL = [
  { icon: Eye, label: "See it" },
  { icon: ShoppingCart, label: "Buy it" },
  { icon: Music, label: "Enjoy the show" },
  { icon: Package, label: "Get it delivered" },
] as const satisfies readonly { icon: LucideIcon; label: string }[];

export const HOME_RELATIONSHIP_RAIL = [
  { icon: Ticket, label: "I Was There" },
  { icon: Users, label: "Show history" },
  { icon: Star, label: "Known fan" },
  { icon: ShoppingBag, label: "Drops" },
  { icon: BarChart3, label: "Return" },
] as const satisfies readonly { icon: LucideIcon; label: string }[];

/** Illustrative Artist Studio tour overview — Marisol Reyes demo data. */
export const HOME_STUDIO_OVERVIEW = {
  artistName: "Marisol Reyes",
  portrait: MKT_PHOTOS.marisolPortrait,
  kpis: [
    { label: "Total Merch Sales", value: "$284,620", delta: "+42%" },
    { label: "Purchasing Fans", value: "12,480", delta: "+39%" },
    { label: "Repeat Purchasers", value: "28%", delta: "+12%" },
    { label: "Avg. Order Value", value: "$56", delta: "+18%" },
  ],
  salesByShow: [
    { city: "Brooklyn", pct: 92 },
    { city: "Denver", pct: 68 },
    { city: "Chicago", pct: 78 },
    { city: "Toronto", pct: 55 },
    { city: "Nashville", pct: 72 },
    { city: "Atlanta", pct: 48 },
  ],
  topProducts: [
    { name: "Tender Night Brooklyn Tee", units: "1,420 Units Sold" },
    { name: "More Tender Nights Hoodie", units: "980 Units Sold" },
    { name: "A Tender Night Poster", units: "742 Units Sold" },
  ],
} as const;

export interface HomeHowItWorksStage {
  icon: LucideIcon;
  title: string;
  body: string;
  screenshot: string;
  alt: string;
}

export const HOME_HOW_IT_WORKS_STAGES: readonly HomeHowItWorksStage[] = [
  {
    icon: Smartphone,
    title: "See it",
    body: "Browse Marisol Reyes merch from your phone at the show.",
    screenshot: MARISOL_REYES_SHOP_SCREENSHOT,
    alt: "Marisol Reyes attendee shop in Rolling GA — A Tender Night tour merchandise",
  },
];

export const HOME_ARTIST_VALUE_BENEFITS = [
  {
    icon: TrendingUp,
    label: "Increase merch sales",
    body: "Capture show-night demand beyond the physical table window.",
  },
  {
    icon: Package,
    label: "Sell more products",
    body: "Offer more SKUs without adding table inventory.",
  },
  {
    icon: Users,
    label: "Know your fans",
    body: "Turn attendance into permissioned, ongoing relationships.",
  },
  {
    icon: Heart,
    label: "Keep the moment going",
    body: "Post-show drops and credentials extend the night.",
  },
] as const;

export const HOME_FAN_RELATIONSHIP_BENEFITS = [
  { icon: Star, label: "I Was There credentials" },
  { icon: Users, label: "Show history" },
  { icon: ShoppingBag, label: "Exclusive drops" },
  { icon: Heart, label: "Known fan status" },
] as const satisfies readonly { icon: LucideIcon; label: string }[];
