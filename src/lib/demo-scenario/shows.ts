import { demoCalendarDate, DEMO_YEAR } from "@/lib/demo-calendar";
import type { DemoArtistKey } from "./types";

export interface DemoShowDefinition {
  key: string;
  eventId: string;
  slug: string;
  city: string;
  venueName: string;
  artistKey: DemoArtistKey;
  artistId: string;
  artistName: string;
  tourName: string;
  doorsAt: Date;
  startsAt: Date;
  endsAt: Date;
  /** Whether this show has a configurable encore drop in the demo. */
  hasEncoreDrop: boolean;
}

/** Static registry of flagship demo shows — ids/slugs match seeded events. */
export const DEMO_SHOWS: DemoShowDefinition[] = [
  {
    key: "atlas-detroit",
    eventId: "evt_atlas_detroit",
    slug: `the-degens-signal-decay-detroit-${DEMO_YEAR}`,
    city: "Detroit",
    venueName: "The Ironworks",
    artistKey: "the_degens",
    artistId: "art_the_degens",
    artistName: "The Degens",
    tourName: "Signal Decay",
    doorsAt: demoCalendarDate(6, 30, 17, 0),
    startsAt: demoCalendarDate(6, 30, 20, 0),
    endsAt: demoCalendarDate(6, 30, 23, 0),
    hasEncoreDrop: true,
  },
  {
    key: "atlas-toronto",
    eventId: "evt_atlas_toronto",
    slug: `the-degens-signal-decay-toronto-${DEMO_YEAR}`,
    city: "Toronto",
    venueName: "Harbourline Hall",
    artistKey: "the_degens",
    artistId: "art_the_degens",
    artistName: "The Degens",
    tourName: "Signal Decay",
    doorsAt: demoCalendarDate(7, 8, 17, 0),
    startsAt: demoCalendarDate(7, 8, 20, 0),
    endsAt: demoCalendarDate(7, 8, 23, 0),
    hasEncoreDrop: false,
  },
  {
    key: "nova-nashville",
    eventId: "evt_nova_nashville",
    slug: `nova-kestrel-gold-hour-nashville-${DEMO_YEAR}`,
    city: "Nashville",
    venueName: "Cedar & Vine",
    artistKey: "nova_kestrel",
    artistId: "art_nova_kestrel",
    artistName: "Nova Kestrel",
    tourName: "Gold Hour",
    doorsAt: demoCalendarDate(6, 12, 17, 0),
    startsAt: demoCalendarDate(6, 12, 20, 0),
    endsAt: demoCalendarDate(6, 12, 22, 30),
    hasEncoreDrop: false,
  },
  {
    key: "nova-atlanta",
    eventId: "evt_nova_atlanta",
    slug: `nova-kestrel-gold-hour-atlanta-${DEMO_YEAR}`,
    city: "Atlanta",
    venueName: "Peachtree Hall",
    artistKey: "nova_kestrel",
    artistId: "art_nova_kestrel",
    artistName: "Nova Kestrel",
    tourName: "Gold Hour",
    doorsAt: demoCalendarDate(6, 22, 18, 0),
    startsAt: demoCalendarDate(6, 22, 20, 0),
    endsAt: demoCalendarDate(6, 22, 22, 30),
    hasEncoreDrop: false,
  },
  {
    key: "low-austin-return",
    eventId: "evt_low_austin_return",
    slug: `the-low-country-river-sessions-austin-return-${DEMO_YEAR}`,
    city: "Austin",
    venueName: "Riverbend Yard",
    artistKey: "the_low_country",
    artistId: "art_low_country",
    artistName: "The Low Country",
    tourName: "River Sessions",
    doorsAt: demoCalendarDate(6, 18, 18, 30),
    startsAt: demoCalendarDate(6, 18, 20, 0),
    endsAt: demoCalendarDate(6, 18, 22, 30),
    hasEncoreDrop: false,
  },
  {
    key: "marisol-brooklyn",
    eventId: "evt_marisol_brooklyn",
    slug: `marisol-reyes-a-tender-night-brooklyn-${DEMO_YEAR}`,
    city: "Brooklyn",
    venueName: "Warehouse Nine",
    artistKey: "marisol_reyes",
    artistId: "art_marisol_reyes",
    artistName: "Marisol Reyes",
    tourName: "A Tender Night",
    doorsAt: demoCalendarDate(6, 12, 18, 0),
    startsAt: demoCalendarDate(6, 12, 20, 0),
    endsAt: demoCalendarDate(6, 12, 22, 30),
    hasEncoreDrop: true,
  },
];

const showByKey = new Map(DEMO_SHOWS.map((show) => [show.key, show]));

export function getDemoShow(key: string): DemoShowDefinition | undefined {
  return showByKey.get(key);
}

export function listDemoShowsForArtist(artist: DemoArtistKey): DemoShowDefinition[] {
  return DEMO_SHOWS.filter((show) => show.artistKey === artist);
}

export function defaultDemoShowForArtist(artist: DemoArtistKey): DemoShowDefinition {
  return listDemoShowsForArtist(artist)[0]!;
}

export function getDemoShowByEventId(eventId: string): DemoShowDefinition | undefined {
  return DEMO_SHOWS.find((show) => show.eventId === eventId);
}

export function getDemoShowBySlug(slug: string): DemoShowDefinition | undefined {
  return DEMO_SHOWS.find((show) => show.slug === slug);
}
