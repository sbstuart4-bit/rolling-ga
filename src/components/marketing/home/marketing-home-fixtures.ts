import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Heart,
  MapPin,
  Package,
  Smartphone,
  Sparkles,
  TrendingUp,
  Truck,
} from "lucide-react";

export const HOME_HERO_BENEFITS = [
  { icon: TrendingUp, label: "More sales for artists" },
  { icon: Heart, label: "Better fan experience" },
  { icon: Package, label: "No stockouts" },
  { icon: Sparkles, label: "Show lives on" },
] as const satisfies readonly { icon: LucideIcon; label: string }[];

export const HOME_PROBLEM_ITEMS = [
  {
    title: "Long lines",
    body: "Fans shouldn't spend the show waiting to buy a shirt.",
    photoLabel: "Approved photography: fans waiting in a long merch line at a concert",
  },
  {
    title: "Sold-out sizes",
    body: "Physical inventory limits what artists can sell.",
    photoLabel: "Approved photography: sold-out sizes sign on a merch table at a show",
  },
  {
    title: "Carry it all night",
    body: "Buying merch shouldn't mean carrying it through the concert.",
    photoLabel: "Approved photography: fan carrying a merch bag through a concert crowd",
  },
] as const;

/** Real Nova guided-demo UI — captured from the product, not illustrated. */
export const NOVA_KESTREL_SHOP_SCREENSHOT = "/marketing/nova-kestrel-shop-mobile.png";
export const NOVA_KESTREL_DISCOVER_SCREENSHOT = "/marketing/nova-kestrel-discover-mobile.png";
export const NOVA_KESTREL_UNLOCK_SCREENSHOT = "/marketing/nova-kestrel-unlock-mobile.png";
export const NOVA_KESTREL_RECEIVE_SCREENSHOT = "/marketing/nova-kestrel-receive-mobile.png";
export const NOVA_KESTREL_MY_SHOWS_SCREENSHOT = "/marketing/nova-kestrel-my-shows-mobile.png";
export const NOVA_KESTREL_CREDENTIAL_SCREENSHOT = "/marketing/nova-kestrel-credential-mobile.png";

export interface HomeHowItWorksStage {
  icon: LucideIcon;
  title: string;
  body: string;
  screenshot: string;
  alt: string;
}

/** Each stage is an independent responsive unit: copy + one real product screenshot. */
export const HOME_HOW_IT_WORKS_STAGES: readonly HomeHowItWorksStage[] = [
  {
    icon: CalendarDays,
    title: "Discover",
    body: "See what's coming.",
    screenshot: NOVA_KESTREL_DISCOVER_SCREENSHOT,
    alt: "Nova Kestrel show page in Rolling GA — discover the Nashville show before doors",
  },
  {
    icon: MapPin,
    title: "Unlock",
    body: "Being at the show unlocks what others can't get.",
    screenshot: NOVA_KESTREL_UNLOCK_SCREENSHOT,
    alt: "Nova Kestrel event page in Rolling GA — venue arrival unlocks show-night exclusives",
  },
  {
    icon: Smartphone,
    title: "Shop",
    body: "Buy from your phone. Skip the merch line.",
    screenshot: NOVA_KESTREL_SHOP_SCREENSHOT,
    alt: "Nova Kestrel attendee shop in Rolling GA — buy Nashville Night Tee from your phone at the show",
  },
  {
    icon: Truck,
    title: "Receive",
    body: "Leave the merch behind. We'll send it to you.",
    screenshot: NOVA_KESTREL_RECEIVE_SCREENSHOT,
    alt: "Rolling GA order confirmation — It's yours, your piece of tonight is on its way with shipping details",
  },
];

export const HOME_ARTIST_VALUE_BENEFITS = [
  {
    icon: TrendingUp,
    label: "Capture show-night demand",
    body: "Pilot hypothesis: extend merch sales beyond the physical table window.",
  },
  {
    icon: Package,
    label: "Digital catalog at the show",
    body: "Pilot hypothesis: offer more SKUs without adding table inventory.",
  },
  {
    icon: Sparkles,
    label: "Less table friction",
    body: "Pilot hypothesis: reduce line bottlenecks and size sellouts on the floor.",
  },
  {
    icon: Heart,
    label: "Permissioned relationships",
    body: "Pilot hypothesis: turn attendance into an ongoing artist–fan channel.",
  },
] as const;

export const HOME_FAN_RELATIONSHIP_BENEFITS = [
  { icon: Sparkles, label: "Exclusive drops" },
  { icon: Smartphone, label: "Shop from your phone" },
  { icon: Truck, label: "Delivered after the show" },
  { icon: Heart, label: "I Was There credentials" },
] as const satisfies readonly { icon: LucideIcon; label: string }[];
