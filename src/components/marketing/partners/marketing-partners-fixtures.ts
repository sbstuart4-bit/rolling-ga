import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Disc3,
  Globe2,
  Mic2,
  Package,
  Shield,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Ticket,
  Truck,
  Users,
} from "lucide-react";

export const PARTNERS_STAKEHOLDER_CATEGORIES = [
  {
    icon: Mic2,
    title: "Artists & managers",
    body: "Define the show, merchandise, drops, fan experience, and what success should look like.",
  },
  {
    icon: Building2,
    title: "Venues",
    body: "Help establish how show-night access, venue operations, and merch economics should work in a real pilot.",
  },
  {
    icon: Globe2,
    title: "Promoters",
    body: "Help connect Rolling GA to the live-event experience and determine how digital merch fits alongside existing show operations.",
  },
  {
    icon: Truck,
    title: "Merch & fulfillment partners",
    body: "Provide merchandise production, inventory, fulfillment, and delivery capabilities without forcing the fan experience back into a physical-only model.",
  },
  {
    icon: Disc3,
    title: "Labels / artist teams",
    body: "Help artists coordinate product, brand, fan engagement, and future opportunities around the live moment.",
  },
] as const;

export const PARTNERS_PILOT_QUESTIONS = [
  {
    title: "Do more fans buy?",
    body: "Compare show-night conversion and purchasing behavior with the traditional experience.",
  },
  {
    title: "Does a broader catalog matter?",
    body: "Measure whether fans buy products or sizes that physical venue inventory would not have supported.",
  },
  {
    title: "Can we reduce lost sales?",
    body: "Observe purchases that otherwise may have been lost to stockouts, table limits, or line friction.",
  },
  {
    title: "Will fans accept delivery?",
    body: "Measure conversion and satisfaction when merchandise is fulfilled after the show rather than carried out of the venue.",
  },
  {
    title: "Can artists improve merch economics?",
    body: "Quantify the actual artist economics after fulfillment, payment, venue treatment, and operating costs.",
  },
  {
    title: "Does the relationship continue?",
    body: "Measure post-show engagement, repeat purchasing, and repeat attendance within the Rolling GA experience.",
  },
] as const;

export const PARTNERS_DESIGN_QUESTIONS = [
  {
    title: "Venue merch treatment",
    body: "How do digital, show-time, and off-site fulfilled purchases interact with existing venue merch agreements?",
  },
  {
    title: "Fulfillment responsibility",
    body: "Who produces, packs, ships, supports, and owns the delivery promise?",
  },
  {
    title: "Artist economics",
    body: "What does the artist actually retain after product cost, fulfillment, shipping, payment, and contractual treatment?",
  },
  {
    title: "Fan consent & data",
    body: "What fan information is collected, what is permissioned, and what is appropriately available to the artist?",
  },
  {
    title: "Show operations",
    body: "How does Rolling GA fit into venue entry, merch operations, live drops, customer support, and post-show fulfillment without creating new operational headaches?",
  },
] as const;

export const PARTNERS_ROLLING_GA_ROLE = [
  { icon: Ticket, label: "Show-aware fan experience" },
  { icon: ShoppingBag, label: "Digital merch access" },
  { icon: Smartphone, label: "Venue/show-specific unlocks" },
  { icon: Package, label: "Commerce orchestration" },
  { icon: Sparkles, label: "I Was There credential & history" },
  { icon: Users, label: "Permissioned artist–fan relationship" },
  { icon: Shield, label: "Observed fan & commerce signals within Rolling GA" },
] as const satisfies readonly { icon: LucideIcon; label: string }[];

export const PARTNERS_ECOSYSTEM_LABELS = [
  "Artists",
  "Venues",
  "Promoters",
  "Merch",
  "Labels",
] as const;
