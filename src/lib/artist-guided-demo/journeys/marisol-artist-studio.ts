import {
  DEMO_SCOTT_FAN_ID,
  MARISOL_ARTIST_ID,
  MARISOL_BROOKLYN_EVENT_ID,
} from "@/lib/demo-user-ids";
import type { ArtistGuidedDemoJourney, ArtistGuidedDemoStep } from "../types";

function step(
  partial: Omit<ArtistGuidedDemoStep, "step"> & { step: number },
): ArtistGuidedDemoStep {
  return partial;
}

/** Canonical six-step artist studio walkthrough — Brooklyn · A Tender Night. */
export const MARISOL_ARTIST_STUDIO_STEPS: ArtistGuidedDemoStep[] = [
  step({
    step: 1,
    title: "Tonight's show",
    whatArtistSees:
      "Marisol Reyes · A Tender Night at Warehouse Nine, Brooklyn — attendance, connected fans, purchasing fans and merch GMV for tonight.",
    whatChanged:
      "The show is live on Rolling GA. Every scan and sale feeds the command center in real time.",
    whyItMatters:
      "Rolling GA turns a concert into measurable commerce and fan relationships from the first door.",
    keyMessage: "A live show is a revenue and relationship event — not just a ticket scan.",
    timePhase: "show_ended",
    route: "/studio/live/{eventId}",
    nextCta: "See what sold →",
    presenter: {
      say: "Brooklyn is the flagship A Tender Night show — here's what the room is producing tonight.",
      pointOut: "Attendance, connected fans, purchasing fans and merch GMV in the live command center header.",
      next: "Move into show-level commerce to see what actually sold.",
    },
  }),
  step({
    step: 2,
    title: "See what sold",
    whatArtistSees:
      "Show-level merch economics: total GMV, orders, units sold, average order value and top products including the A Tender Night assortment.",
    whatChanged:
      "Commerce is attributed to this specific Brooklyn show — not blended tour totals.",
    whyItMatters:
      "Rolling GA lets the artist understand what fans actually bought at this show.",
    timePhase: "t_plus_1",
    route: "/studio/insights?event={eventId}",
    nextCta: "Meet your fans →",
    presenter: {
      say: "This is show-scoped commerce — tee, hoodie, hat and poster performance for Brooklyn.",
      pointOut: "Top products and order mix reflect real seeded demo orders for Warehouse Nine.",
      next: "Open the show cohort to see who those buyers became.",
    },
  }),
  step({
    step: 3,
    title: "Meet your fans",
    whatArtistSees:
      "The Brooklyn show cohort — connected fans, purchasing fans, repeat purchasers and a relationship funnel from attendees to repeat revenue.",
    whatChanged:
      "Merch transactions are linked to verified attendance and opt-in connection.",
    whyItMatters: "A merch transaction becomes a fan relationship.",
    keyMessage: "A merch transaction becomes a fan relationship.",
    timePhase: "t_plus_7",
    route: "/studio/fans/cohort/{eventId}",
    nextCta: "Follow one fan →",
    presenter: {
      say: "Every verified attendee can become a connected fan — the funnel shows where they convert.",
      pointOut: "Attendees → connected → purchasing → repeat — all from seeded cohort data.",
      next: "Open Scott Weller — the strongest demo relationship profile.",
    },
  }),
  step({
    step: 4,
    title: "Follow one fan",
    whatArtistSees:
      "Scott Weller's relationship timeline: show, purchase, credential, connected fan and post-show purchase — with observed fan value split by show-night and post-show GMV.",
    whatChanged:
      "Individual fan economics are tied to verified attendance, not a generic CRM record.",
    whyItMatters: "You didn't just sell a shirt. You created a customer relationship.",
    keyMessage: "You didn't just sell a shirt. You created a customer relationship.",
    timePhase: "t_plus_7",
    route: "/studio/fans/{fanId}",
    nextCta: "Keep it going →",
    presenter: {
      say: "Scott's timeline is the proof — show night purchase, credential, connection, then post-show revenue.",
      pointOut: "Observed fan value separates show-night GMV, post-show GMV and total — not LTV.",
      next: "Show how Marisol can activate this audience again with a drop.",
    },
  }),
  step({
    step: 5,
    title: "Activate the audience",
    whatArtistSees:
      "Creating a 48-hour Brooklyn Encore Drop for fans connected at Marisol Reyes · A Tender Night · Brooklyn — audience size, duration, product and eligibility preview.",
    whatChanged:
      "The artist can target a show cohort without exporting a list or guessing who was there.",
    whyItMatters:
      "Rolling GA doesn't merely tell the artist who their fans are — it lets the artist continue the relationship.",
    timePhase: "t_plus_7",
    route: "/studio/drops/new?event={eventId}&prefill=brooklyn-encore&cohort=connected",
    nextCta: "See the value →",
    presenter: {
      say: "Brooklyn connected fans — 48 hours, A Tender Night Poster, audience already attached.",
      pointOut: "Preview shows audience size and eligibility — publish through the real drop engine.",
      next: "Close with show-night vs post-show vs activated revenue.",
    },
  }),
  step({
    step: 6,
    title: "See the value",
    whatArtistSees:
      "Show-night GMV, post-show GMV, connected fans, repeat purchasers and total observed fan value — the full Brooklyn relationship story.",
    whatChanged:
      "Post-show revenue is attributed back to the show that created the relationship.",
    whyItMatters:
      "Rolling GA turns a night of live music into an audience the artist can know, serve and grow.",
    keyMessage: "The show ends. The relationship doesn't.",
    timePhase: "t_plus_30",
    route: "/studio/insights?event={eventId}&conclusion=1",
    isConclusion: true,
    presenter: {
      say: "Brooklyn created an audience — and that audience kept buying after the lights came up.",
      pointOut: "Show-night vs post-show GMV, connected fans and repeat purchasers on one screen.",
      next: "Invite them to explore Artist Studio or talk about a pilot.",
    },
  }),
];

export const MARISOL_ARTIST_STUDIO_JOURNEY: ArtistGuidedDemoJourney = {
  id: "marisol-artist-studio",
  title: "Marisol Reyes — Artist Studio",
  subtitle: "Brooklyn · A Tender Night",
  description:
    "Six steps through the real Artist Studio — from tonight's show through fan relationships, activation and observed value.",
  durationLabel: "2–4 min",
  showKey: "marisol-brooklyn",
  artistId: MARISOL_ARTIST_ID,
  steps: MARISOL_ARTIST_STUDIO_STEPS,
};

/** Resolved route placeholders used in tests. */
export const MARISOL_ARTIST_STUDIO_ROUTE_PARAMS = {
  eventId: MARISOL_BROOKLYN_EVENT_ID,
  fanId: DEMO_SCOTT_FAN_ID,
};
