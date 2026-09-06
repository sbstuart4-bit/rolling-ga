export const PILOT_PROCESS_STEPS = [
  {
    step: "01",
    title: "Plan",
    body: "Choose the artist, show, merchandise, fulfillment approach, and questions we want the pilot to answer.",
  },
  {
    step: "02",
    title: "Launch",
    body: "Create the show experience, configure the drop, and prepare the fan journey before doors open.",
  },
  {
    step: "03",
    title: "Run the show",
    body: "Fans discover, unlock, shop, and purchase through the Rolling GA experience.",
  },
  {
    step: "04",
    title: "Learn",
    body: "Review what happened, what fans did, what worked operationally, and what should change next.",
  },
] as const;

export const PILOT_QUESTIONS = [
  {
    title: "Do fans buy?",
    body: "Observe show-night interest, purchase behavior, and conversion through the Rolling GA experience.",
  },
  {
    title: "What do they buy?",
    body: "Understand products, sizes, quantities, combinations, and show-specific demand.",
  },
  {
    title: "Does more choice help?",
    body: "Test whether a broader digital assortment creates useful demand beyond what can practically sit at a merch table.",
  },
  {
    title: "Does fulfillment work?",
    body: "Test the operating model from purchase through production, packing, shipping, and delivery.",
  },
  {
    title: "Do fans stay connected?",
    body: "Observe whether fans choose to retain their show history and continue a permissioned relationship.",
  },
  {
    title: "What should happen next?",
    body: "Identify the product, operating, commercial, and partnership changes required before another pilot or broader rollout.",
  },
] as const;

export const PILOT_STAKEHOLDERS = [
  {
    title: "Artists & managers",
    body: "Shape the fan experience, merchandise, economics, and ongoing relationship.",
  },
  {
    title: "Venues & promoters",
    body: "Help define how the digital experience fits into show operations and the venue environment.",
  },
  {
    title: "Merch partners",
    body: "Help test assortment, production, packing, and fulfillment.",
  },
  {
    title: "Labels & artist teams",
    body: "Help explore how show-night engagement can fit into the broader artist relationship.",
  },
] as const;

export const PILOT_CAPABILITIES = [
  "Show-aware fan experience",
  "Digital merch access",
  "Show-night / show-specific unlocks",
  "Commerce orchestration",
  "I Was There / attendance history",
  "Permissioned artist–fan relationship",
  "Observed fan & commerce signals within Rolling GA",
] as const;

export const PILOT_PARTNER_NEEDS = [
  {
    title: "A show",
    body: "A real upcoming live event where the experience can be tested.",
  },
  {
    title: "Merchandise",
    body: "A small assortment or show-specific drop suitable for the pilot.",
  },
  {
    title: "Operating input",
    body: "The people responsible for merch, venue operations, fulfillment, and the artist experience help design the test.",
  },
  {
    title: "A question worth answering",
    body: "Agree on what we actually want to learn before the show happens.",
  },
] as const;

export const PILOT_HERO_CONDITIONS = [
  "One show",
  "Real fans",
  "Real commerce",
  "Real learning",
] as const;
