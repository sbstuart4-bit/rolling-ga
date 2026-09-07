import type { LucideIcon } from "lucide-react";
import { CalendarDays, MapPin, Smartphone, Truck, Users } from "lucide-react";
import {
  MARISOL_REYES_CREDENTIAL_SCREENSHOT,
  MARISOL_REYES_DISCOVER_SCREENSHOT,
  MARISOL_REYES_MY_SHOWS_SCREENSHOT,
  MARISOL_REYES_RECEIVE_SCREENSHOT,
  MARISOL_REYES_SHOP_SCREENSHOT,
  MARISOL_REYES_UNLOCK_SCREENSHOT,
} from "@/components/marketing/home/marketing-home-fixtures";

export interface HowItWorksJourneyStage {
  step: string;
  icon: LucideIcon;
  title: string;
  body: string;
  screenshot: string;
  alt: string;
}

/** Commerce journey — real Marisol Reyes guided-demo screenshots. */
export const HOW_IT_WORKS_COMMERCE_STAGES: readonly HowItWorksJourneyStage[] = [
  {
    step: "01",
    icon: CalendarDays,
    title: "Discover",
    body: "See what's coming before the show.",
    screenshot: MARISOL_REYES_DISCOVER_SCREENSHOT,
    alt: "Marisol Reyes show page in Rolling GA — discover the Brooklyn show before doors",
  },
  {
    step: "02",
    icon: MapPin,
    title: "Unlock",
    body: "Being at the show unlocks what others can't get.",
    screenshot: MARISOL_REYES_UNLOCK_SCREENSHOT,
    alt: "Marisol Reyes event page in Rolling GA — venue arrival unlocks show-night exclusives",
  },
  {
    step: "03",
    icon: Smartphone,
    title: "Shop",
    body: "Buy from your phone. Skip the merch line.",
    screenshot: MARISOL_REYES_SHOP_SCREENSHOT,
    alt: "Marisol Reyes attendee shop in Rolling GA — A Tender Night tour merchandise",
  },
  {
    step: "04",
    icon: Truck,
    title: "Receive",
    body: "Leave the merch behind. We'll send it to you.",
    screenshot: MARISOL_REYES_RECEIVE_SCREENSHOT,
    alt: "Rolling GA order confirmation — your piece of tonight is on its way",
  },
];

export const HOW_IT_WORKS_RELATIONSHIP_STAGES = [
  {
    label: "Remember",
    title: "The fan keeps a record of the show they attended.",
    screenshot: MARISOL_REYES_CREDENTIAL_SCREENSHOT,
    alt: "Marisol Reyes I Was There digital credential in Rolling GA",
  },
  {
    label: "Reconnect",
    title: "The next time the artist has something worth sharing, the relationship already exists.",
    screenshot: MARISOL_REYES_MY_SHOWS_SCREENSHOT,
    alt: "My Shows in Rolling GA — Marisol Reyes Brooklyn credential and show history",
  },
] as const;

export const HOW_IT_WORKS_ARTIST_CAPABILITIES = [
  {
    icon: Users,
    title: "Understand which fans actually showed up",
    body: "Pilot capability: connect attendance signals to a permissioned fan record — not just a merch receipt.",
  },
  {
    icon: Smartphone,
    title: "See observed purchasing behavior",
    body: "Pilot capability: understand what fans bought at the show without relying on table-level guesswork.",
  },
  {
    icon: CalendarDays,
    title: "Recognize returning fans",
    body: "Pilot capability: welcome back fans who have been to previous shows with context that carries forward.",
  },
  {
    icon: MapPin,
    title: "Create future drops and experiences for known fans",
    body: "Pilot capability: reach fans who already have a relationship — not a one-night anonymous transaction.",
  },
] as const;
