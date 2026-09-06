import type { LucideIcon } from "lucide-react";
import { Heart, MapPin, Package, Repeat, Shield, Smartphone, Sparkles, UserCheck, Users } from "lucide-react";
import {
  NOVA_KESTREL_CREDENTIAL_SCREENSHOT,
  NOVA_KESTREL_MY_SHOWS_SCREENSHOT,
  NOVA_KESTREL_SHOP_SCREENSHOT,
  NOVA_KESTREL_UNLOCK_SCREENSHOT,
} from "@/components/marketing/home/marketing-home-fixtures";

export const FOR_FANS_NIGHT_BENEFITS = [
  {
    icon: Smartphone,
    title: "Don't miss the show",
    body: "Buy from your phone instead of waiting in line.",
  },
  {
    icon: MapPin,
    title: "Get what's there",
    body: "Being at the show can unlock merch and experiences made for that night.",
  },
  {
    icon: Package,
    title: "Don't carry it all night",
    body: "Order at the show and have your merch fulfilled afterward.",
  },
] as const satisfies readonly { icon: LucideIcon; title: string; body: string }[];

export const FOR_FANS_SHOW_SCREENS = [
  {
    label: "You were there",
    screenshot: NOVA_KESTREL_CREDENTIAL_SCREENSHOT,
    alt: "Nova Kestrel I Was There digital credential in Rolling GA",
  },
  {
    label: "My shows",
    screenshot: NOVA_KESTREL_MY_SHOWS_SCREENSHOT,
    alt: "My Shows in Rolling GA — Nova Kestrel Nashville credential and show history",
  },
] as const;

export const FOR_FANS_HERO_UNLOCK = NOVA_KESTREL_UNLOCK_SCREENSHOT;
export const FOR_FANS_HERO_CREDENTIAL = NOVA_KESTREL_CREDENTIAL_SCREENSHOT;
export const FOR_FANS_NIGHT_UNLOCK = NOVA_KESTREL_UNLOCK_SCREENSHOT;
export const FOR_FANS_NIGHT_SHOP = NOVA_KESTREL_SHOP_SCREENSHOT;

export const FOR_FANS_NEXT_SHOW_POSSIBILITIES = [
  {
    icon: UserCheck,
    title: "Known fan",
    body: "The artist can recognize that you've been there before.",
  },
  {
    icon: Sparkles,
    title: "New drops",
    body: "Future merch and show-specific experiences can reach fans who choose to stay connected.",
  },
  {
    icon: Heart,
    title: "More to come back to",
    body: "One night can become part of a longer relationship with the artist.",
  },
] as const satisfies readonly { icon: LucideIcon; title: string; body: string }[];

export const FOR_FANS_CONTROL_PRINCIPLES = [
  {
    icon: Users,
    title: "You choose to connect",
    body: "A show shouldn't automatically become an unwanted marketing relationship.",
  },
  {
    icon: Repeat,
    title: "Your history has context",
    body: "Attendance and purchases are tied to the experiences where they happened.",
  },
  {
    icon: Shield,
    title: "The relationship should earn its place",
    body: "Artists should have a reason to reach back out — another show, a meaningful drop, or something worth returning for.",
  },
] as const satisfies readonly { icon: LucideIcon; title: string; body: string }[];

export const FOR_FANS_JOURNEY_STEPS = [
  "Discover",
  "Unlock",
  "Shop",
  "Receive",
  "Remember",
  "Reconnect",
] as const;
