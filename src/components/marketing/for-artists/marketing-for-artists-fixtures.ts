import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Package,
  Repeat,
  ShoppingBag,
  Smartphone,
  Truck,
  Users,
} from "lucide-react";
import {
  NOVA_KESTREL_CREDENTIAL_SCREENSHOT,
  NOVA_KESTREL_MY_SHOWS_SCREENSHOT,
  NOVA_KESTREL_SHOP_SCREENSHOT,
} from "@/components/marketing/home/marketing-home-fixtures";

export const FOR_ARTISTS_HERO_BENEFITS = [
  { icon: ShoppingBag, label: "More at the show" },
  { icon: Package, label: "Beyond the table" },
  { icon: Users, label: "Known fans" },
  { icon: Repeat, label: "After the encore" },
] as const satisfies readonly { icon: LucideIcon; label: string }[];

export const FOR_ARTISTS_MERCH_OPPORTUNITIES = [
  {
    icon: Package,
    title: "More choice",
    body: "Test a broader catalog without requiring every product and size to sit at the venue.",
  },
  {
    icon: BarChart3,
    title: "Fewer physical constraints",
    body: "Explore commerce that isn't limited by table space or what remains in stock late in the show.",
  },
  {
    icon: Truck,
    title: "No bag through the encore",
    body: "Let fans order from their phones and have eligible merchandise fulfilled after the show.",
  },
] as const;

export const FOR_ARTISTS_RELATIONSHIP_CAPABILITIES = [
  {
    icon: Users,
    title: "Know who was there",
    body: "Attendance and venue presence can become a permissioned fan signal — not just a merch receipt.",
  },
  {
    icon: Smartphone,
    title: "See observed purchase behavior",
    body: "Understand what that fan actually purchased through Rolling GA at the show.",
  },
  {
    icon: Repeat,
    title: "Recognize returning fans",
    body: "A future artist experience can recognize that the fan has been there before.",
  },
  {
    icon: ShoppingBag,
    title: "Create the next moment",
    body: "The relationship can support future drops, shows, rewards, and experiences.",
  },
] as const;

export const FOR_ARTISTS_RELATIONSHIP_SCREENS = [
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

export const FOR_ARTISTS_LEARN_QUESTIONS = [
  {
    title: "Who actually engaged?",
    body: "Which attendees connected with the Rolling GA experience at the show?",
  },
  {
    title: "What did they buy?",
    body: "Observe Rolling GA commerce associated with those fans — not their entire spending history.",
  },
  {
    title: "What happened after the show?",
    body: "Explore post-show purchasing and engagement within the Rolling GA experience.",
  },
  {
    title: "Who comes back?",
    body: "Begin understanding repeat attendance and repeat purchasing as the relationship develops.",
  },
] as const;

export const FOR_ARTISTS_SHOP_SCREENSHOT = NOVA_KESTREL_SHOP_SCREENSHOT;
