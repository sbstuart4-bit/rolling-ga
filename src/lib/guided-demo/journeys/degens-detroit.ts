import type { DemoScenario } from "@/lib/demo-scenario/types";
import type { GuidedDemoJourney, GuidedDemoStep } from "../types";

const BASE: Pick<
  DemoScenario,
  "artist" | "showKey" | "purchaseHistory" | "merchRule"
> = {
  artist: "the_degens",
  showKey: "atlas-detroit",
  purchaseHistory: "none",
  merchRule: "auto",
};

function step(
  partial: Omit<GuidedDemoStep, "step"> & { step: number },
): GuidedDemoStep {
  return partial;
}

export const DEGENS_DETROIT_STEPS: GuidedDemoStep[] = [
  step({
    step: 1,
    title: "Discover the show",
    whatFanSees:
      "The Degens are coming to Detroit. Core merch is available now and something exclusive is being teased for the show.",
    whatChanged: "Nothing has been claimed yet. The fan is still anonymous to this show.",
    whyItMatters: "Rolling GA can begin the relationship before the fan enters the venue.",
    scenario: {
      ...BASE,
      timePhase: "t_minus_30",
      fanState: "unknown",
      location: "outside_venue",
      fanHistory: "first_show",
    },
    route: "/event/{slug}",
    presenter: {
      say: "The fan can browse core tour merch, but Detroit exclusives are only teased.",
      pointOut: "Locked or teaser treatment on show-exclusive products.",
      next: "Move closer to show night — more of the assortment becomes visible.",
    },
  }),
  step({
    step: 2,
    title: "The show starts to feel real",
    whatFanSees:
      "Selected Detroit-exclusive products are now visible, but still locked.",
    whatChanged:
      "Rolling GA is revealing more of the show-specific assortment as the date approaches.",
    whyItMatters: "The fan can form purchase intent before show night.",
    scenario: {
      ...BASE,
      timePhase: "t_minus_14",
      fanState: "unknown",
      location: "outside_venue",
      fanHistory: "first_show",
    },
    route: "/event/{slug}",
    presenter: {
      say: "The exclusive is visible now — the fan can see what they want, but cannot buy it yet.",
      pointOut: "Locked Detroit product cards and “Available at the show” messaging.",
      next: "The fan declares intent with I'm Going.",
    },
  }),
  step({
    step: 3,
    title: 'The fan says "I\'m Going"',
    whatFanSees: "The show is now saved and personalized.",
    whatChanged: "The fan has declared intent.",
    whyItMatters:
      "Rolling GA now has a pre-show relationship signal without needing to pretend the fan has attended.",
    presenterNote:
      "\"I'm Going\" is NOT attendance and does NOT unlock venue-exclusive merch.",
    scenario: {
      ...BASE,
      timePhase: "t_minus_7",
      fanState: "going",
      location: "outside_venue",
      fanHistory: "first_show",
    },
    route: "/event/{slug}",
    presenter: {
      say: "The fan has told us they're coming — but exclusives are still locked.",
      pointOut: "Personalized countdown and “Coming to Detroit” relationship treatment.",
      next: "Jump to show day — the full collection is visible tonight.",
    },
  }),
  step({
    step: 4,
    title: "Show day",
    whatFanSees: "The full Detroit collection is visible.",
    whatChanged: "The show is now tonight.",
    whyItMatters: "The fan can decide what they want before entering the building.",
    presenterNote: "Time alone still does not unlock attendance-only products.",
    scenario: {
      ...BASE,
      timePhase: "t_minus_3_hours",
      fanState: "going",
      location: "outside_venue",
      fanHistory: "first_show",
    },
    route: "/event/{slug}",
    presenter: {
      say: "It's show day. Every exclusive is visible — still locked until the fan is at the venue.",
      pointOut: "Tonight messaging and the full locked assortment preview.",
      next: "Simulate venue arrival to unlock the collection.",
    },
  }),
  step({
    step: 5,
    title: "You arrive at the venue",
    whatFanSees: "Detroit-exclusive merchandise unlocks.",
    whatChanged: "Rolling GA has established qualifying presence for this show.",
    whyItMatters: "Physical attendance becomes digital access.",
    presenterNote: "This is one of the core Rolling GA control points.",
    scenario: {
      ...BASE,
      timePhase: "doors_open",
      fanState: "at_venue",
      location: "inside_venue",
      fanHistory: "first_show",
    },
    route: "/event/{slug}/shop",
    presenter: {
      say: "The fan crossed the geofence — show exclusives are now purchasable.",
      pointOut: "Unlocked product cards and the event shop entry point.",
      next: "Open the full event shop assortment.",
    },
  }),
  step({
    step: 6,
    title: "Shop without the merch line",
    whatFanSees: "The complete eligible assortment is available digitally.",
    whatChanged: "The fan is now eligible for the show-specific collection.",
    whyItMatters:
      "The artist can capture show-night demand without requiring the fan to stand in line or carry merchandise through the concert.",
    scenario: {
      ...BASE,
      timePhase: "pre_show",
      fanState: "at_venue",
      location: "inside_venue",
      fanHistory: "first_show",
    },
    route: "/event/{slug}/shop",
    presenter: {
      say: "Every eligible piece is here — core tour merch and Detroit exclusives together.",
      pointOut: "Product photography, pricing, and add-to-cart on real catalog items.",
      next: "Advance to encore — a live drop moment appears.",
    },
  }),
  step({
    step: 7,
    title: "The live moment becomes commerce",
    whatFanSees: "A product or encore drop appears that was not available earlier.",
    whatChanged: "The live show phase triggered a configured merch moment.",
    whyItMatters:
      "Artists can create merchandise tied to what is happening in the room right now.",
    scenario: {
      ...BASE,
      timePhase: "encore",
      fanState: "at_venue",
      location: "inside_venue",
      fanHistory: "first_show",
    },
    route: "/event/{slug}/shop",
    presenter: {
      say: "The encore drop is live — this tee wasn't available at doors.",
      pointOut: "Encore drop section and flash countdown on the Detroit Encore Tee.",
      next: "Walk through a real purchase on a show-night exclusive.",
    },
  }),
  step({
    step: 8,
    title: "The fan buys",
    whatFanSees: "A normal checkout experience.",
    whatChanged: "The fan is now both a verified attendee and a purchasing fan.",
    whyItMatters:
      "Rolling GA connects attendance and commerce into one relationship history.",
    scenario: {
      ...BASE,
      timePhase: "encore",
      fanState: "at_venue",
      location: "inside_venue",
      fanHistory: "first_show",
    },
    route: "/product/detroit-encore-tee?e={slug}",
    presenter: {
      say: "Add to cart, checkout, and confirm — this is the real commerce path.",
      pointOut: "Product detail → cart → checkout. Use demo payment to complete the order.",
      next: "After checkout, advance to post-show — the show becomes history.",
    },
  }),
  step({
    step: 9,
    title: "The show becomes part of the fan's history",
    whatFanSees:
      "A permanent attendance credential and show history.",
    whatChanged: "The show is over, but the relationship remains.",
    whyItMatters: "The concert is no longer a one-time transaction.",
    scenario: {
      ...BASE,
      timePhase: "show_ended",
      fanState: "attended",
      location: "outside_venue",
      fanHistory: "first_show",
    },
    route: "/event/{slug}",
    verifyAttendance: true,
    presenter: {
      say: "The show ended — the fan keeps the credential and any post-show store access.",
      pointOut: "You Were There state, credential link, and attendee store if still open.",
      next: "Fast-forward — this fan returns for another Degens show.",
    },
  }),
  step({
    step: 10,
    title: "Next time, this fan is known",
    whatFanSees:
      "Rolling GA recognizes the fan's prior Degens attendance and purchase history.",
    whatChanged: "This is no longer a first-time anonymous interaction.",
    whyItMatters:
      "Rolling GA turns individual show transactions into an ongoing artist–fan relationship.",
    scenario: {
      ...BASE,
      timePhase: "t_plus_7",
      fanState: "returning_fan",
      location: "outside_venue",
      fanHistory: "second_show",
    },
    route: "/shows",
    presenter: {
      say: "The passport remembers Detroit — welcome-back treatment on the next show.",
      pointOut: "My Shows credential history and returning-fan messaging.",
      next: "Exit guided demo or restart for another audience.",
    },
  }),
];

export const DEGENS_DETROIT_JOURNEY: GuidedDemoJourney = {
  id: "degens-detroit",
  title: "The Degens — Full Rolling GA Journey",
  subtitle: "Detroit · Signal Decay",
  description:
    "Follow one fan from discovering a show to becoming a verified attendee, customer, and returning fan.",
  durationLabel: "4–5 minutes",
  showKey: "atlas-detroit",
  steps: DEGENS_DETROIT_STEPS,
};
