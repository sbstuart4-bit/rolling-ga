import type { DemoScenario } from "@/lib/demo-scenario/types";
import type { GuidedDemoJourney, GuidedDemoStep } from "../types";

const BASE: Pick<
  DemoScenario,
  "artist" | "showKey" | "purchaseHistory" | "merchRule"
> = {
  artist: "nova_kestrel",
  showKey: "nova-nashville",
  purchaseHistory: "none",
  merchRule: "auto",
};

function step(
  partial: Omit<GuidedDemoStep, "step"> & { step: number },
): GuidedDemoStep {
  return partial;
}

export const NOVA_NASHVILLE_STEPS: GuidedDemoStep[] = [
  step({
    step: 1,
    title: "Discover the show",
    whatFanSees:
      "Nova Kestrel is coming to Nashville. The fan can learn about the show, but no merch is visible yet.",
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
      say: "The fan discovers the show a month out — no merch, no credential, just the relationship starting.",
      pointOut: "Show date, city, and teaser copy only. Drops and event shop stay empty.",
      next: "Move to T-14 — tour merch opens on Drops and Nashville exclusives become visible but locked.",
    },
  }),
  step({
    step: 2,
    title: "The show starts to feel real",
    whatFanSees:
      "Selected Nashville-exclusive products are now visible, but still locked.",
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
      pointOut: "Gold Hour tour merch is now on Drops; Nashville exclusives show locked on the event page.",
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
      pointOut: "Personalized countdown and “Coming to Nashville” relationship treatment.",
      next: "Jump to show day — the full collection is visible tonight.",
    },
  }),
  step({
    step: 4,
    title: "Show day",
    whatFanSees: "The full Nashville collection is visible.",
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
    whatFanSees: "Nashville-exclusive merchandise unlocks.",
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
      say: "Every eligible piece is here — core tour merch and Nashville exclusives together.",
      pointOut: "Product photography, pricing, and add-to-cart on real catalog items.",
      next: "Advance to the headliner moment — a show-night exclusive takes focus.",
    },
  }),
  step({
    step: 7,
    title: "The live moment becomes commerce",
    whatFanSees:
      "The Nashville Night exclusive takes center stage — a piece made for this room on this night.",
    whatChanged: "The live show phase highlights a configured show-night product.",
    whyItMatters:
      "Artists can tie merchandise to what is happening in the room right now.",
    scenario: {
      ...BASE,
      timePhase: "headliner",
      fanState: "at_venue",
      location: "inside_venue",
      fanHistory: "first_show",
    },
    route: "/event/{slug}/shop",
    presenter: {
      say: "Gold Hour is peaking — the Nashville Night Tee is the hero of the shop.",
      pointOut: "Nashville Night product card and show-night messaging.",
      next: "Walk through a real purchase on a show-night exclusive.",
    },
  }),
  step({
    step: 8,
    title: "The fan buys",
    whatFanSees:
      "Checkout is available at the venue — show exclusives unlocked by geofence, not credential yet.",
    whatChanged: "The fan can purchase inside the venue; no credential or purchase on record yet.",
    whyItMatters:
      "Rolling GA connects attendance and commerce into one relationship history.",
    scenario: {
      ...BASE,
      timePhase: "headliner",
      fanState: "at_venue",
      location: "inside_venue",
      fanHistory: "first_show",
    },
    route: "/product/nashville-night-tee?e={slug}",
    presenter: {
      say: "Add to cart and checkout if you want — this step demonstrates the path, not a completed order.",
      pointOut: "Product detail → cart → checkout. Demo payment can complete the purchase.",
      next: "Advance to post-show — attendance is recorded and the credential is issued.",
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
      next: "Fast-forward — this fan returns for another Nova show.",
    },
  }),
  step({
    step: 10,
    title: "Next time, this fan is known",
    whatFanSees:
      "Rolling GA recognizes the fan's prior Nashville attendance and purchase history.",
    whatChanged: "This is no longer a first-time anonymous interaction.",
    whyItMatters:
      "Rolling GA turns individual show transactions into an ongoing artist–fan relationship.",
    scenario: {
      ...BASE,
      timePhase: "t_plus_7",
      fanState: "attended",
      location: "outside_venue",
      fanHistory: "second_show",
    },
    route: "/shows",
    presenter: {
      say: "The passport remembers Nashville — welcome-back treatment on the next show.",
      pointOut: "My Shows credential history and returning-fan messaging.",
      next: "Exit guided demo or restart for another audience.",
    },
  }),
];

export const NOVA_NASHVILLE_JOURNEY: GuidedDemoJourney = {
  id: "nova-nashville",
  title: "Nova Kestrel — Full Rolling GA Journey",
  subtitle: "Nashville · Gold Hour",
  description:
    "Follow one fan from discovering a show to becoming a verified attendee, customer, and returning fan.",
  durationLabel: "4–5 minutes",
  showKey: "nova-nashville",
  steps: NOVA_NASHVILLE_STEPS,
};
