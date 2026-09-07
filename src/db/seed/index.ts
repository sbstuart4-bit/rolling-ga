import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import type { Db } from "../client";
import {
  artistBrand,
  artistConsents,
  artistMembers,
  artists,
  audienceSegments,
  bundleItems,
  bundles,
  campaignAudiences,
  campaigns,
  dropProducts,
  drops,
  eventContent,
  eventThemes,
  eventVerificationTokens,
  events,
  fanPreferences,
  inventory,
  orderItems,
  orders,
  productVariants,
  products,
  shipments,
  shippingOptions,
  tours,
  userRoles,
  users,
  venues,
  verifiedAttendance,
} from "../schema";
import { hashPassword } from "@/server/auth/password";
import { demoAnchorDate, demoCalendarDate, DEMO_YEAR } from "@/lib/demo-calendar";
import { createRng } from "@/lib/rng";
import {
  demoArtistBrandImages,
  demoEventCityImage,
  demoProductImage,
  THE_DEGENS_DEMO_ASSETS,
  theDegensDropPoster,
} from "@/lib/demo-assets";
import { generateEventToken, generateOrderNumber } from "@/lib/token";
import type { ProductAccessType } from "@/lib/types";
import {
  generateCityArtwork,
  generatePoster,
  generateProductShot,
  generateWordmark,
} from "./artwork";
import {
  THE_DEGENS,
  THE_DEGENS_PRODUCTS,
  FAN_FIRST_NAMES,
  FAN_LAST_NAMES,
  FULL_ARTISTS,
  HISTORICAL_ARTISTS,
  LOW_COUNTRY,
  LOW_COUNTRY_PRODUCTS,
  MARISOL_PRODUCTS,
  MARISOL_REYES,
  NOVA_KESTREL,
  NOVA_KESTREL_PRODUCTS,
  type ArtistDefinition,
  type ProductDefinition,
  US_CITIES_FOR_SHIPPING,
  VENUES,
} from "./definitions";

export const DEMO_PASSWORD = "rollingga";
export const PRIMARY_FAN_EMAIL = "scott@example.com";
/** Seeded fan with the full Detroit verify → buy → connect → anniversary purchase story. */
export const DEMO_RELATIONSHIP_FAN_EMAIL = "jordan.demo@example.com";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * `users.id` is a real uuid, so seeded accounts cannot use readable ids like
 * `usr_fan_scott`. Deriving the uuid from a stable key keeps every persona's id
 * identical across resets, which is what makes a bookmarked demo URL keep working.
 *
 * This is UUID v5 in shape: a namespaced SHA-1 with the version and variant bits set.
 */
function demoUserId(key: string): string {
  const hash = createHash("sha1").update(`rolling-ga/demo-user/${key}`).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

interface EventSeed {
  key: string;
  id: string;
  artistId: string;
  tourId: string;
  venueId: string;
  slug: string;
  startsAt: Date;
  endsAt: Date;
  doorsAt: Date;
  expectedAttendance: number;
  actualAttendance: number | null;
  localMessage: string | null;
  postShowWindowMinutes: number | null;
}

/**
 * Builds the complete demo dataset.
 *
 * The timeline is anchored to June 1 on the demo calendar. The Degens' flagship show
 * is June 30 — slide the demo clock forward to walk from pre-show through live set,
 * flash drop, and post-show store.
 */
export async function seedDemoData(db: Db, anchorDate?: Date): Promise<string> {
  const now = anchorDate ?? demoAnchorDate();
  const rng = createRng(20270214);
  const counts: Record<string, number> = {};

  /* ---------------------------------------------------------------- *
   * Artwork
   * ---------------------------------------------------------------- */

  const artwork = new Map<string, string>();
  for (const artist of [...FULL_ARTISTS, ...HISTORICAL_ARTISTS]) {
    artwork.set(`logo:${artist.id}`, generateWordmark(artist.name, artist.palette));
  }

  /* ---------------------------------------------------------------- *
   * Artists and brand
   * ---------------------------------------------------------------- */

  for (const artist of FULL_ARTISTS) {
    await db.insert(artists).values({
      id: artist.id,
      slug: artist.slug,
      name: artist.name,
      bio: artist.bio,
      isDemo: true,
    });

    const brandAssets = demoArtistBrandImages(artist.id);

    await db.insert(artistBrand).values({
      artistId: artist.id,
      logoUrl: brandAssets?.logoUrl ?? artwork.get(`logo:${artist.id}`),
      heroImageUrl:
        brandAssets?.heroImageUrl ??
        generatePoster(
          `${artist.slug}-brand`,
          artist.name,
          "Rolling GA verified",
          artist.palette,
        ),
      background: artist.palette.background,
      surface: artist.palette.surface,
      foreground: artist.palette.foreground,
      mutedForeground: artist.mutedForeground,
      accent: artist.palette.accent,
      accentForeground: artist.accentForeground,
      accentSecondary: artist.palette.accentSecondary,
      border: artist.border,
      fontId: artist.fontId,
      merchPhotographyNote: artist.merchPhotographyNote,
      showMessaging: artist.showMessaging,
    });
  }

  for (const artist of HISTORICAL_ARTISTS) {
    await db.insert(artists).values({
      id: artist.id,
      slug: artist.slug,
      name: artist.name,
      bio: artist.bio,
      isDemo: true,
    });

    const brandAssets = demoArtistBrandImages(artist.id);

    await db.insert(artistBrand).values({
      artistId: artist.id,
      logoUrl: brandAssets?.logoUrl ?? artwork.get(`logo:${artist.id}`),
      heroImageUrl:
        brandAssets?.heroImageUrl ??
        generatePoster(
          `${artist.slug}-brand`,
          artist.name,
          "Rolling GA verified",
          artist.palette,
        ),
      background: artist.palette.background,
      surface: artist.palette.surface,
      foreground: artist.palette.foreground,
      mutedForeground: artist.mutedForeground,
      accent: artist.palette.accent,
      accentForeground: artist.accentForeground,
      accentSecondary: artist.palette.accentSecondary,
      border: artist.border,
      fontId: artist.fontId,
      merchPhotographyNote: artist.merchPhotographyNote,
      showMessaging: artist.showMessaging,
    });
  }
  counts.artists = FULL_ARTISTS.length + HISTORICAL_ARTISTS.length;

  /* ---------------------------------------------------------------- *
   * Venues
   * ---------------------------------------------------------------- */

  for (const venue of VENUES) {
    await db.insert(venues).values({
      id: venue.id,
      name: venue.name,
      city: venue.city,
      region: venue.region,
      country: venue.region === "ON" ? "CA" : "US",
      lat: venue.lat,
      lng: venue.lng,
      timezone: venue.timezone,
      capacity: venue.capacity,
      geofenceRadiusMeters: venue.geofenceRadiusMeters,
      isDemo: true,
    });
  }
  counts.venues = VENUES.length;

  /* ---------------------------------------------------------------- *
   * Tours
   * ---------------------------------------------------------------- */

  const tourIds = {
    signalDecay: "tor_signal_decay",
    goldHour: "tor_gold_hour",
    riverSessions: "tor_river_sessions",
    tenderNight: "tor_violeta",
  };

  await insertTour(db, {
    id: tourIds.signalDecay,
    artist: THE_DEGENS,
    slug: "signal-decay",
    name: "Signal Decay",
    year: now.getFullYear(),
    postShowWindowMinutes: 480,
    subsidyCents: 400,
  });

  await insertTour(db, {
    id: tourIds.goldHour,
    artist: NOVA_KESTREL,
    slug: "gold-hour",
    name: "Gold Hour",
    year: now.getFullYear(),
    postShowWindowMinutes: 720,
    freeShippingThresholdCents: 7500,
  });

  await insertTour(db, {
    id: tourIds.riverSessions,
    artist: LOW_COUNTRY,
    slug: "river-sessions",
    name: "River Sessions",
    year: now.getFullYear() - 1,
    postShowWindowMinutes: 360,
  });

  await insertTour(db, {
    id: tourIds.tenderNight,
    artist: MARISOL_REYES,
    slug: "a-tender-night",
    name: "A Tender Night",
    year: now.getFullYear(),
    postShowWindowMinutes: 720,
    freeShippingThresholdCents: 7500,
  });

  const historicalTourIds = new Map<string, string>();
  for (const artist of HISTORICAL_ARTISTS) {
    const tourId = `tor_${artist.slug.replace(/-/g, "_")}`;
    historicalTourIds.set(artist.id, tourId);
    await db.insert(tours).values({
      id: tourId,
      artistId: artist.id,
      slug: "live",
      name: `${artist.name} Live`,
      year: now.getFullYear() - 2,
      isDemo: true,
    });
  }
  counts.tours = 4 + HISTORICAL_ARTISTS.length;

  /* ---------------------------------------------------------------- *
   * Events
   *
   * Fixed dates on the 2026 demo calendar. The Degens play Detroit on June 30.
   * ---------------------------------------------------------------- */

  const anniversaryStart = demoCalendarDate(6, 1, 20, 0, DEMO_YEAR - 1);

  const eventSeeds: EventSeed[] = [
    {
      key: "atlas-detroit",
      id: "evt_atlas_detroit",
      artistId: THE_DEGENS.id,
      tourId: tourIds.signalDecay,
      venueId: "ven_ironworks_detroit",
      slug: `the-degens-signal-decay-detroit-${DEMO_YEAR}`,
      doorsAt: demoCalendarDate(6, 30, 17, 0),
      startsAt: demoCalendarDate(6, 30, 20, 0),
      endsAt: demoCalendarDate(6, 30, 23, 0),
      expectedAttendance: 4200,
      actualAttendance: null,
      localMessage: "Detroit, we've been waiting on this room all year.",
      postShowWindowMinutes: null,
    },
    {
      key: "atlas-toronto",
      id: "evt_atlas_toronto",
      artistId: THE_DEGENS.id,
      tourId: tourIds.signalDecay,
      venueId: "ven_harbourline_toronto",
      slug: `the-degens-signal-decay-toronto-${DEMO_YEAR}`,
      doorsAt: demoCalendarDate(7, 8, 17, 0),
      startsAt: demoCalendarDate(7, 8, 20, 0),
      endsAt: demoCalendarDate(7, 8, 23, 0),
      expectedAttendance: 3600,
      actualAttendance: null,
      localMessage: "Harbourline Hall. Third time, still sold out.",
      postShowWindowMinutes: null,
    },
    {
      key: "atlas-chicago",
      id: "evt_atlas_chicago",
      artistId: THE_DEGENS.id,
      tourId: tourIds.signalDecay,
      venueId: "ven_foundry_chicago",
      slug: `the-degens-signal-decay-chicago-${DEMO_YEAR}`,
      doorsAt: demoCalendarDate(7, 15, 17, 0),
      startsAt: demoCalendarDate(7, 15, 20, 0),
      endsAt: demoCalendarDate(7, 15, 23, 0),
      expectedAttendance: 3900,
      actualAttendance: null,
      localMessage: null,
      postShowWindowMinutes: null,
    },
    {
      key: "nova-nashville",
      id: "evt_nova_nashville",
      artistId: NOVA_KESTREL.id,
      tourId: tourIds.goldHour,
      venueId: "ven_cedar_vine_nashville",
      slug: `nova-kestrel-gold-hour-nashville-${DEMO_YEAR}`,
      doorsAt: demoCalendarDate(6, 12, 17, 0),
      startsAt: demoCalendarDate(6, 12, 20, 0),
      endsAt: demoCalendarDate(6, 12, 22, 30),
      expectedAttendance: 2800,
      actualAttendance: null,
      localMessage: "Nashville. You sang the bridge louder than we did.",
      postShowWindowMinutes: null,
    },
    {
      key: "nova-atlanta",
      id: "evt_nova_atlanta",
      artistId: NOVA_KESTREL.id,
      tourId: tourIds.goldHour,
      venueId: "ven_peachtree_atlanta",
      slug: `nova-kestrel-gold-hour-atlanta-${DEMO_YEAR}`,
      doorsAt: demoCalendarDate(6, 22, 18, 0),
      startsAt: demoCalendarDate(6, 22, 20, 0),
      endsAt: demoCalendarDate(6, 22, 22, 30),
      expectedAttendance: 3100,
      actualAttendance: null,
      localMessage: null,
      postShowWindowMinutes: null,
    },
    {
      key: "low-austin",
      id: "evt_low_austin",
      artistId: LOW_COUNTRY.id,
      tourId: tourIds.riverSessions,
      venueId: "ven_riverbend_austin",
      slug: `the-low-country-river-sessions-austin-${DEMO_YEAR - 1}`,
      doorsAt: demoCalendarDate(6, 1, 18, 30, DEMO_YEAR - 1),
      startsAt: anniversaryStart,
      endsAt: demoCalendarDate(6, 1, 22, 0, DEMO_YEAR - 1),
      expectedAttendance: 5200,
      actualAttendance: 4980,
      localMessage: "Austin, thanks for listening quietly.",
      postShowWindowMinutes: null,
    },
    {
      key: "low-austin-return",
      id: "evt_low_austin_return",
      artistId: LOW_COUNTRY.id,
      tourId: tourIds.riverSessions,
      venueId: "ven_riverbend_austin",
      slug: `the-low-country-river-sessions-austin-return-${DEMO_YEAR}`,
      doorsAt: demoCalendarDate(6, 18, 18, 30),
      startsAt: demoCalendarDate(6, 18, 20, 0),
      endsAt: demoCalendarDate(6, 18, 22, 30),
      expectedAttendance: 5400,
      actualAttendance: null,
      localMessage: "Austin — welcome back to Riverbend Yard.",
      postShowWindowMinutes: null,
    },
    {
      key: "marisol-brooklyn",
      id: "evt_marisol_brooklyn",
      artistId: MARISOL_REYES.id,
      tourId: tourIds.tenderNight,
      venueId: "ven_warehouse_nine_brooklyn",
      slug: `marisol-reyes-a-tender-night-brooklyn-${DEMO_YEAR}`,
      doorsAt: demoCalendarDate(6, 12, 18, 0),
      startsAt: demoCalendarDate(6, 12, 20, 0),
      endsAt: demoCalendarDate(6, 12, 22, 30),
      expectedAttendance: 2400,
      actualAttendance: null,
      localMessage: "Brooklyn — music for a more tender night.",
      postShowWindowMinutes: null,
    },
  ];

  // Historical shows that give the fan's passport real depth.
  const historicalPlan: { artistId: string; venueId: string; monthsAgo: number }[] = [
    { artistId: THE_DEGENS.id, venueId: "ven_harbourline_toronto", monthsAgo: 20 },
    { artistId: THE_DEGENS.id, venueId: "ven_foundry_chicago", monthsAgo: 18 },
    { artistId: MARISOL_REYES.id, venueId: "ven_warehouse_nine_brooklyn", monthsAgo: 15 },
    { artistId: MARISOL_REYES.id, venueId: "ven_alpine_denver", monthsAgo: 14 },
    { artistId: "art_pale_horses", venueId: "ven_foundry_chicago", monthsAgo: 26 },
    { artistId: "art_pale_horses", venueId: "ven_harbourline_toronto", monthsAgo: 24 },
    { artistId: "art_kite_anchor", venueId: "ven_cedar_vine_nashville", monthsAgo: 31 },
    { artistId: "art_kite_anchor", venueId: "ven_warehouse_nine_brooklyn", monthsAgo: 29 },
    { artistId: "art_vantablack", venueId: "ven_alpine_denver", monthsAgo: 34 },
    { artistId: "art_vantablack", venueId: "ven_riverbend_austin", monthsAgo: 33 },
    { artistId: "art_ossuary", venueId: "ven_warehouse_nine_brooklyn", monthsAgo: 22 },
    { artistId: "art_ossuary", venueId: "ven_foundry_chicago", monthsAgo: 11 },
  ];

  historicalPlan.forEach((plan, index) => {
    const venue = VENUES.find((v) => v.id === plan.venueId)!;
    const start = new Date(now.getTime() - plan.monthsAgo * 30 * DAY);
    start.setHours(20, 0, 0, 0);

    const tourId =
      plan.artistId === THE_DEGENS.id
        ? tourIds.signalDecay
        : plan.artistId === MARISOL_REYES.id
          ? tourIds.tenderNight
          : historicalTourIds.get(plan.artistId)!;

    eventSeeds.push({
      key: `history-${index}`,
      id: `evt_history_${index}`,
      artistId: plan.artistId,
      tourId,
      venueId: plan.venueId,
      slug: `${plan.artistId.replace("art_", "").replace(/_/g, "-")}-${venue.city.toLowerCase()}-${start.getFullYear()}-${index}`,
      doorsAt: new Date(start.getTime() - 90 * MINUTE),
      startsAt: start,
      endsAt: new Date(start.getTime() + 2 * HOUR),
      expectedAttendance: venue.capacity,
      actualAttendance: Math.round(venue.capacity * 0.92),
      localMessage: null,
      postShowWindowMinutes: null,
    });
  });

  const eventByKey = new Map<string, EventSeed>();
  for (const seed of eventSeeds) {
    eventByKey.set(seed.key, seed);
    const venue = VENUES.find((v) => v.id === seed.venueId)!;

    await db.insert(events).values({
      id: seed.id,
      artistId: seed.artistId,
      tourId: seed.tourId,
      venueId: seed.venueId,
      slug: seed.slug,
      doorsAt: seed.doorsAt,
      startsAt: seed.startsAt,
      endsAt: seed.endsAt,
      timezone: venue.timezone,
      expectedAttendance: seed.expectedAttendance,
      actualAttendance: seed.actualAttendance,
      localMessage: seed.localMessage,
      postShowWindowMinutes: seed.postShowWindowMinutes,
      isDemo: true,
    });
  }
  counts.events = eventSeeds.length;

  /* ---------------------------------------------------------------- *
   * Event themes
   *
   * Detroit demonstrates the override level: it inherits the Signal Decay palette but
   * swaps the accent and supplies its own city artwork.
   * ---------------------------------------------------------------- */

  await db.insert(eventThemes).values({
    eventId: "evt_atlas_detroit",
    cityArtworkUrl: demoEventCityImage("evt_atlas_detroit") ?? THE_DEGENS_DEMO_ASSETS.cityDetroit,
    accent: THE_DEGENS.palette.accentSecondary,
    accentForeground: "#0B0B0C",
    showMessaging: "One night. One print run. Nothing restocked.",
  });

  await db.insert(eventThemes).values({
    eventId: "evt_nova_nashville",
    cityArtworkUrl: generateCityArtwork("nova-nashville", "Nashville", NOVA_KESTREL.palette),
  });

  await db.insert(eventThemes).values({
    eventId: "evt_marisol_brooklyn",
    cityArtworkUrl: generateCityArtwork("marisol-brooklyn", "Brooklyn", MARISOL_REYES.palette),
  });

  await db.insert(eventThemes).values({
    eventId: "evt_low_austin",
    cityArtworkUrl: generateCityArtwork("low-austin", "Austin", LOW_COUNTRY.palette),
  });

  /* ---------------------------------------------------------------- *
   * QR verification tokens
   * ---------------------------------------------------------------- */

  const tokenByEvent = new Map<string, string>();
  for (const seed of eventSeeds) {
    const token = generateEventToken();
    const id = `evk_${seed.id}`;
    tokenByEvent.set(seed.id, token);

    await db.insert(eventVerificationTokens).values({
      id,
      eventId: seed.id,
      token,
      active: true,
      expiresAt: new Date(seed.endsAt.getTime() + 12 * HOUR),
      isDemo: true,
    });
  }

  /* ---------------------------------------------------------------- *
   * Users, roles and artist memberships
   * ---------------------------------------------------------------- */

  const passwordHash = hashPassword(DEMO_PASSWORD);

  const primaryFanId = demoUserId("fan_scott");
  await db.insert(users).values({
    id: primaryFanId,
    email: PRIMARY_FAN_EMAIL,
    displayName: "Scott Weller",
    passwordHash,
    onboardingCompletedAt: now,
    isDemo: true,
  });
  await db.insert(userRoles).values({ userId: primaryFanId, role: "fan" });
  await db.insert(fanPreferences).values({
    userId: primaryFanId,
    apparelSize: "L",
    preferredCategories: ["apparel", "print", "music"],
    shippingName: "Scott Weller",
    shippingLine1: "418 Cass Avenue",
    shippingLine2: "Apt 12",
    shippingCity: "Detroit",
    shippingRegion: "MI",
    shippingPostalCode: "48226",
    shippingCountry: "US",
    notifyDrops: true,
    notifyAnniversary: true,
    notifyShowNews: true,
  });

  const relationshipFanId = demoUserId("fan_jordan");
  await db.insert(users).values({
    id: relationshipFanId,
    email: DEMO_RELATIONSHIP_FAN_EMAIL,
    displayName: "Jordan Ellis",
    passwordHash,
    onboardingCompletedAt: now,
    isDemo: true,
  });
  await db.insert(userRoles).values({ userId: relationshipFanId, role: "fan" });
  await db.insert(fanPreferences).values({
    userId: relationshipFanId,
    apparelSize: "M",
    shippingName: "Jordan Ellis",
    shippingLine1: "1200 Woodward Avenue",
    shippingCity: "Detroit",
    shippingRegion: "MI",
    shippingPostalCode: "48226",
    shippingCountry: "US",
    notifyDrops: true,
    notifyAnniversary: true,
    notifyShowNews: true,
  });

  const teamAccounts = [
    {
      id: demoUserId("team_degens"),
      email: "marcus@thedegens.example",
      name: "Marcus Vale",
      artistId: THE_DEGENS.id,
      role: "management" as const,
      canPublish: true,
    },
    {
      id: demoUserId("team_nova"),
      email: "dana@novakestrel.example",
      name: "Dana Okafor",
      artistId: NOVA_KESTREL.id,
      role: "merch_manager" as const,
      canPublish: true,
    },
    {
      id: demoUserId("team_marisol"),
      email: "elena@marisolreyes.example",
      name: "Elena Vasquez",
      artistId: MARISOL_REYES.id,
      role: "merch_manager" as const,
      canPublish: true,
    },
    {
      id: demoUserId("team_low"),
      email: "priya@thelowcountry.example",
      name: "Priya Nair",
      artistId: LOW_COUNTRY.id,
      role: "tour_manager" as const,
      canPublish: false,
    },
  ];

  for (const account of teamAccounts) {
    await db.insert(users).values({
      id: account.id,
      email: account.email,
      displayName: account.name,
      passwordHash,
      onboardingCompletedAt: now,
      isDemo: true,
    });
    await db.insert(userRoles).values({ userId: account.id, role: "artist_member" });
    await db.insert(artistMembers).values({
      artistId: account.artistId,
      userId: account.id,
      role: account.role,
      canPublish: account.canPublish,
      isDemo: true,
    });
  }

  const adminId = demoUserId("admin");
  await db.insert(users).values({
    id: adminId,
    email: "admin@rollingga.example",
    displayName: "Rolling GA Admin",
    passwordHash,
    onboardingCompletedAt: now,
    isDemo: true,
  });
  await db.insert(userRoles).values({ userId: adminId, role: "rga_admin" });

  const opsId = demoUserId("ops");
  await db.insert(users).values({
    id: opsId,
    email: "ops@rollingga.example",
    displayName: "Jordan Pike",
    passwordHash,
    onboardingCompletedAt: now,
    isDemo: true,
  });
  await db.insert(userRoles).values({ userId: opsId, role: "fulfillment_operator" });

  // A crowd, so the Studio dashboard and CRM read from real rows rather than constants.
  const crowdIds: string[] = [];
  for (let i = 0; i < 180; i++) {
    const id = demoUserId(`crowd_${String(i).padStart(3, "0")}`);
    const first = FAN_FIRST_NAMES[i % FAN_FIRST_NAMES.length];
    const last = FAN_LAST_NAMES[(i * 7) % FAN_LAST_NAMES.length];

    await db.insert(users).values({
      id,
      email: `${first.toLowerCase()}.${last.toLowerCase()}.${i}@example.com`,
      displayName: `${first} ${last}`,
      passwordHash,
      onboardingCompletedAt: now,
      isDemo: true,
    });
    await db.insert(userRoles).values({ userId: id, role: "fan" });

    const place = US_CITIES_FOR_SHIPPING[i % US_CITIES_FOR_SHIPPING.length];
    await db.insert(fanPreferences).values({
      userId: id,
      apparelSize: rng.pick(["S", "M", "L", "XL", "XXL"]),
      shippingName: `${first} ${last}`,
      shippingLine1: `${rng.randInt(100, 9800)} ${rng.pick(["Grand", "Michigan", "Woodward", "Cass", "Elm"])} Street`,
      shippingCity: place.city,
      shippingRegion: place.region,
      shippingPostalCode: place.postal,
      shippingCountry: place.region === "ON" ? "CA" : "US",
      notifyDrops: rng.randBool(0.8),
      notifyAnniversary: rng.randBool(0.6),
      notifyShowNews: rng.randBool(0.45),
    });

    crowdIds.push(id);
  }
  counts.users = 1 + 1 + teamAccounts.length + 2 + crowdIds.length;

  /* ---------------------------------------------------------------- *
   * Products, variants and inventory
   * ---------------------------------------------------------------- */

  const catalog: { artist: ArtistDefinition; items: ProductDefinition[]; tourId: string }[] = [
    { artist: THE_DEGENS, items: THE_DEGENS_PRODUCTS, tourId: tourIds.signalDecay },
    { artist: NOVA_KESTREL, items: NOVA_KESTREL_PRODUCTS, tourId: tourIds.goldHour },
    { artist: LOW_COUNTRY, items: LOW_COUNTRY_PRODUCTS, tourId: tourIds.riverSessions },
    { artist: MARISOL_REYES, items: MARISOL_PRODUCTS, tourId: tourIds.tenderNight },
  ];

  const variantsByProduct = new Map<string, { id: string; size: string | null }[]>();
  let productCount = 0;

  for (const group of catalog) {
    for (const item of group.items) {
      const staticImage = demoProductImage(item.id);
      const image =
        staticImage ??
        generateProductShot(item.id, item.name, item.category, group.artist.palette);
      const eventId = item.eventKey ? eventByKey.get(item.eventKey)?.id ?? null : null;

      await db.insert(products).values({
        id: item.id,
        artistId: group.artist.id,
        tourId: item.tourKey ? group.tourId : null,
        eventId,
        slug: item.slug,
        name: item.name,
        tagline: item.tagline,
        story: item.story,
        category: item.category,
        accessType: item.accessType as ProductAccessType,
        basePriceCents: item.priceCents,
        unitCostCents: item.costCents,
        sku: `${group.artist.slug.toUpperCase().replace(/-/g, "")}-${item.slug.toUpperCase().replace(/-/g, "-").slice(0, 22)}`,
        images: [image],
        producedQuantity: item.producedQuantity ?? null,
        isDemo: true,
      });
      productCount++;

      const sizes = item.sizes ?? [null];
      const created: { id: string; size: string | null }[] = [];

      sizes.forEach((size, index) => {
        const variantId = `${item.id}_v${index}`;
        created.push({ id: variantId, size });
      });

      for (const [index, variant] of created.entries()) {
        await db.insert(productVariants).values({
          id: variant.id,
          productId: item.id,
          sku: `${item.slug.toUpperCase().replace(/-/g, "")}-${variant.size ?? "OS"}`,
          size: variant.size,
          displayOrder: index,
          isDemo: true,
        });

        // Middle sizes carry deeper stock, and the run is thinner at the extremes.
        const sizeFactor = variant.size === "M" || variant.size === "L" ? 1 : 0.62;
        const onHand = Math.round((item.stockPerVariant ?? 100) * sizeFactor);

        await db.insert(inventory).values({
          variantId: variant.id,
          onHand,
          reserved: 0,
          reorderPoint: Math.max(6, Math.round(onHand * 0.12)),
        });
      }

      variantsByProduct.set(item.id, created);
    }
  }
  counts.products = productCount;

  /* ---------------------------------------------------------------- *
   * Bundles
   * ---------------------------------------------------------------- */

  await db.insert(bundles).values({
    id: "bnd_detroit_drop",
    artistId: THE_DEGENS.id,
    tourId: tourIds.signalDecay,
    eventId: "evt_atlas_detroit",
    slug: "complete-your-detroit-drop",
    name: "Complete Your Detroit Drop",
    description:
      "The three things that only existed for one night in Detroit, priced as one piece rather than three purchases.",
    bundlePriceCents: 8900,
    accessType: "event_specific",
    isDemo: true,
  });

  const bundleLines = [
    { productId: "prd_av_detroit_tee", variantId: null },
    { productId: "prd_av_detroit_poster", variantId: "prd_av_detroit_poster_v0" },
    { productId: "prd_av_detroit_pin", variantId: "prd_av_detroit_pin_v0" },
  ];

  for (const [index, line] of bundleLines.entries()) {
    await db.insert(bundleItems).values({
      id: `bni_detroit_${index}`,
      bundleId: "bnd_detroit_drop",
      productId: line.productId,
      variantId: line.variantId,
      quantity: 1,
      displayOrder: index,
    });
  }

  /* ---------------------------------------------------------------- *
   * Audience segments
   * ---------------------------------------------------------------- */

  const segments = [
    {
      id: "aud_detroit_attendees",
      artistId: THE_DEGENS.id,
      name: "Verified Detroit attendees",
      description: "Anyone with a verified credential for the Ironworks show.",
      ruleKind: "event_attendees" as const,
      params: { eventId: "evt_atlas_detroit" },
    },
    {
      id: "aud_signal_decay_tour",
      artistId: THE_DEGENS.id,
      name: "All Signal Decay attendees",
      description: "Verified at any show on the current tour.",
      ruleKind: "tour_attendees" as const,
      params: { tourId: tourIds.signalDecay },
    },
    {
      id: "aud_repeat_attendees",
      artistId: THE_DEGENS.id,
      name: "Repeat attendees",
      description: "Two or more verified Degens shows.",
      ruleKind: "repeat_attendees" as const,
      params: { minShows: 2 },
    },
    {
      id: "aud_prior_purchasers",
      artistId: THE_DEGENS.id,
      name: "Previous purchasers",
      description: "Has bought at least once.",
      ruleKind: "previous_purchasers" as const,
      params: {},
    },
    {
      id: "aud_nashville_attendees",
      artistId: NOVA_KESTREL.id,
      name: "Verified Nashville attendees",
      ruleKind: "event_attendees" as const,
      params: { eventId: "evt_nova_nashville" },
      description: "Cedar & Vine, tonight.",
    },
    {
      id: "aud_brooklyn_attendees",
      artistId: MARISOL_REYES.id,
      name: "Verified Brooklyn attendees",
      ruleKind: "event_attendees" as const,
      params: { eventId: "evt_marisol_brooklyn" },
      description: "Warehouse Nine, tonight.",
    },
    {
      id: "aud_austin_attendees",
      artistId: LOW_COUNTRY.id,
      name: "Austin — one year ago",
      ruleKind: "event_attendees" as const,
      params: { eventId: "evt_low_austin" },
      description: "Verified at Riverbend Yard on this night last year.",
    },
  ];

  for (const segment of segments) {
    await db.insert(audienceSegments).values({ ...segment, isDemo: true });
  }

  /* ---------------------------------------------------------------- *
   * Drops
   * ---------------------------------------------------------------- */

  const detroit = eventByKey.get("atlas-detroit")!;
  const nashville = eventByKey.get("nova-nashville")!;
  const brooklyn = eventByKey.get("marisol-brooklyn")!;
  const austin = eventByKey.get("low-austin")!;
  const toronto = eventByKey.get("atlas-toronto")!;

  const dropDefs = [
    {
      id: "drp_signal_decay_preview",
      artistId: THE_DEGENS.id,
      tourId: tourIds.signalDecay,
      eventId: null,
      slug: "signal-decay-preview",
      title: "Signal Decay",
      description: "The tour run. Available to anyone, at every date.",
      audienceSegmentId: null,
      startsAt: new Date(now.getTime() - 30 * DAY),
      endsAt: null,
      status: "live" as const,
      displayPriority: 10,
      exclusivityType: "standard" as const,
      artworkKey: "signal-decay-preview",
      artworkTitle: "Signal Decay",
      products: ["prd_av_tour_tee", "prd_av_hoodie", "prd_av_vinyl", "prd_av_cap", "prd_av_pin", "prd_av_skateboard"],
      quantityLimit: null,
      anniversaryOfEventId: null,
      palette: THE_DEGENS.palette,
    },
    {
      id: "drp_detroit_tonight",
      artistId: THE_DEGENS.id,
      tourId: tourIds.signalDecay,
      eventId: detroit.id,
      slug: "detroit-tonight",
      title: "Tonight in Detroit",
      description:
        "Printed for this room only. Verified attendees can buy it; nobody else ever will.",
      audienceSegmentId: "aud_detroit_attendees",
      startsAt: detroit.doorsAt,
      endsAt: new Date(detroit.endsAt.getTime() + 8 * HOUR),
      status: "live" as const,
      displayPriority: 80,
      exclusivityType: "standard" as const,
      artworkKey: "detroit-tonight",
      artworkTitle: "Detroit",
      products: ["prd_av_detroit_poster", "prd_av_detroit_pin"],
      quantityLimit: null,
      anniversaryOfEventId: null,
      palette: THE_DEGENS.palette,
    },
    {
      id: "drp_detroit_encore",
      artistId: THE_DEGENS.id,
      tourId: tourIds.signalDecay,
      eventId: detroit.id,
      slug: "detroit-encore",
      title: "Encore Drop",
      description:
        "Opened from the side of the stage during the encore. It closes when the timer does.",
      audienceSegmentId: "aud_detroit_attendees",
      startsAt: new Date(detroit.startsAt.getTime() + 75 * MINUTE),
      endsAt: new Date(detroit.startsAt.getTime() + 75 * MINUTE + 42 * MINUTE + 18_000),
      status: "live" as const,
      displayPriority: 100,
      exclusivityType: "flash" as const,
      artworkKey: "detroit-encore",
      artworkTitle: "Encore",
      products: ["prd_av_detroit_tee"],
      quantityLimit: 500,
      anniversaryOfEventId: null,
      palette: THE_DEGENS.palette,
    },
    {
      id: "drp_detroit_anniversary",
      artistId: THE_DEGENS.id,
      tourId: tourIds.signalDecay,
      eventId: detroit.id,
      slug: "detroit-one-year",
      title: "Detroit Attendee Drop",
      description:
        "The anniversary hoodie for verified Ironworks attendees — eligibility is the credential itself.",
      audienceSegmentId: "aud_detroit_attendees",
      startsAt: new Date(detroit.endsAt.getTime() + 90 * DAY),
      endsAt: new Date(detroit.endsAt.getTime() + 97 * DAY),
      status: "live" as const,
      displayPriority: 95,
      exclusivityType: "anniversary" as const,
      artworkKey: "detroit-anniversary",
      artworkTitle: "Detroit",
      products: ["prd_av_detroit_anniversary_hoodie"],
      quantityLimit: 300,
      anniversaryOfEventId: detroit.id,
      palette: THE_DEGENS.palette,
    },
    {
      id: "drp_toronto_preshow",
      artistId: THE_DEGENS.id,
      tourId: tourIds.signalDecay,
      eventId: toronto.id,
      slug: "toronto-preview",
      title: "Toronto Preview",
      description: "Browse it now. It unlocks at the show.",
      audienceSegmentId: "aud_detroit_attendees",
      startsAt: new Date(now.getTime() - 2 * DAY),
      endsAt: new Date(toronto.endsAt.getTime() + 8 * HOUR),
      status: "live" as const,
      displayPriority: 40,
      exclusivityType: "standard" as const,
      artworkKey: "toronto-preview",
      artworkTitle: "Toronto",
      products: ["prd_av_toronto_tee"],
      quantityLimit: null,
      anniversaryOfEventId: null,
      palette: THE_DEGENS.palette,
    },
    {
      id: "drp_nashville_postshow",
      artistId: NOVA_KESTREL.id,
      tourId: tourIds.goldHour,
      eventId: nashville.id,
      slug: "nashville-post-show",
      title: "Nashville, After",
      description:
        "The attendee store stays open for a few hours after the room empties. Then it closes for good.",
      audienceSegmentId: "aud_nashville_attendees",
      startsAt: nashville.endsAt,
      endsAt: new Date(nashville.endsAt.getTime() + 12 * HOUR),
      status: "live" as const,
      displayPriority: 70,
      exclusivityType: "post_show" as const,
      artworkKey: "nashville-post-show",
      artworkTitle: "Nashville",
      products: ["prd_nk_nashville_tee", "prd_nk_scarf", "prd_nk_nashville_poster"],
      quantityLimit: null,
      anniversaryOfEventId: null,
      palette: NOVA_KESTREL.palette,
    },
    {
      id: "drp_gold_hour_standard",
      artistId: NOVA_KESTREL.id,
      tourId: tourIds.goldHour,
      eventId: null,
      slug: "gold-hour",
      title: "Gold Hour",
      description: "The tour collection.",
      audienceSegmentId: null,
      startsAt: new Date(now.getTime() - 45 * DAY),
      endsAt: null,
      status: "live" as const,
      displayPriority: 20,
      exclusivityType: "standard" as const,
      artworkKey: "gold-hour-drop",
      artworkTitle: "Gold Hour",
      products: ["prd_nk_tee", "prd_nk_book", "prd_nk_single", "prd_nk_hat", "prd_nk_tote", "prd_nk_poster", "prd_nk_necklace"],
      quantityLimit: null,
      anniversaryOfEventId: null,
      palette: NOVA_KESTREL.palette,
    },
    {
      id: "drp_austin_anniversary",
      artistId: LOW_COUNTRY.id,
      tourId: tourIds.riverSessions,
      eventId: austin.id,
      slug: "austin-one-year",
      title: "One Year Ago Tonight",
      description:
        "A letterpress print struck for the people who were standing at Riverbend Yard on this night last year. Eligibility is the credential itself.",
      audienceSegmentId: "aud_austin_attendees",
      startsAt: new Date(now.getTime() - 6 * HOUR),
      endsAt: new Date(now.getTime() + 3 * DAY),
      status: "live" as const,
      displayPriority: 90,
      exclusivityType: "anniversary" as const,
      artworkKey: "austin-anniversary",
      artworkTitle: "Austin",
      products: ["prd_lc_austin_print"],
      quantityLimit: 200,
      anniversaryOfEventId: austin.id,
      palette: LOW_COUNTRY.palette,
    },
    {
      id: "drp_river_sessions",
      artistId: LOW_COUNTRY.id,
      tourId: tourIds.riverSessions,
      eventId: null,
      slug: "river-sessions",
      title: "River Sessions",
      description: "Everything from the record.",
      audienceSegmentId: null,
      startsAt: new Date(now.getTime() - 200 * DAY),
      endsAt: null,
      status: "live" as const,
      displayPriority: 15,
      exclusivityType: "standard" as const,
      artworkKey: "river-sessions-drop",
      artworkTitle: "River Sessions",
      products: ["prd_lc_tee", "prd_lc_vinyl", "prd_lc_tote", "prd_lc_bandana", "prd_lc_cap", "prd_lc_notebook"],
      quantityLimit: null,
      anniversaryOfEventId: null,
      palette: LOW_COUNTRY.palette,
    },
    {
      id: "drp_tender_night_standard",
      artistId: MARISOL_REYES.id,
      tourId: tourIds.tenderNight,
      eventId: null,
      slug: "a-tender-night",
      title: "A Tender Night",
      description: "The tour collection.",
      audienceSegmentId: null,
      startsAt: new Date(now.getTime() - 45 * DAY),
      endsAt: null,
      status: "live" as const,
      displayPriority: 20,
      exclusivityType: "standard" as const,
      artworkKey: "tender-night-drop",
      artworkTitle: "A Tender Night",
      products: [
        "prd_mr_tee",
        "prd_mr_hoodie",
        "prd_mr_hat",
        "prd_mr_print",
        "prd_mr_vinyl",
        "prd_mr_tote",
        "prd_mr_7inch",
        "prd_mr_necklace",
      ],
      quantityLimit: null,
      anniversaryOfEventId: null,
      palette: MARISOL_REYES.palette,
    },
    {
      id: "drp_brooklyn_postshow",
      artistId: MARISOL_REYES.id,
      tourId: tourIds.tenderNight,
      eventId: brooklyn.id,
      slug: "brooklyn-post-show",
      title: "Brooklyn, After",
      description:
        "The attendee store stays open for a few hours after the room empties. Then it closes for good.",
      audienceSegmentId: "aud_brooklyn_attendees",
      startsAt: brooklyn.endsAt,
      endsAt: new Date(brooklyn.endsAt.getTime() + 12 * HOUR),
      status: "live" as const,
      displayPriority: 70,
      exclusivityType: "post_show" as const,
      artworkKey: "brooklyn-post-show",
      artworkTitle: "Brooklyn",
      products: ["prd_mr_city_tee", "prd_mr_scarf", "prd_mr_print"],
      quantityLimit: null,
      anniversaryOfEventId: null,
      palette: MARISOL_REYES.palette,
    },
    {
      id: "drp_brooklyn_encore",
      artistId: MARISOL_REYES.id,
      tourId: tourIds.tenderNight,
      eventId: brooklyn.id,
      slug: "brooklyn-encore",
      title: "Encore Drop",
      description:
        "Opened from the side of the stage during the encore. It closes when the timer does.",
      audienceSegmentId: "aud_brooklyn_attendees",
      startsAt: new Date(brooklyn.startsAt.getTime() + 75 * MINUTE),
      endsAt: new Date(brooklyn.startsAt.getTime() + 75 * MINUTE + 42 * MINUTE + 18_000),
      status: "live" as const,
      displayPriority: 100,
      exclusivityType: "flash" as const,
      artworkKey: "brooklyn-encore",
      artworkTitle: "Encore",
      products: ["prd_mr_city_tee"],
      quantityLimit: 300,
      anniversaryOfEventId: null,
      palette: MARISOL_REYES.palette,
    },
    {
      id: "drp_chicago_scheduled",
      artistId: THE_DEGENS.id,
      tourId: tourIds.signalDecay,
      eventId: eventByKey.get("atlas-chicago")!.id,
      slug: "chicago-scheduled",
      title: "Chicago Drop",
      description: "Scheduled to open when doors open at The Foundry.",
      audienceSegmentId: "aud_signal_decay_tour",
      startsAt: eventByKey.get("atlas-chicago")!.doorsAt,
      endsAt: new Date(eventByKey.get("atlas-chicago")!.endsAt.getTime() + 8 * HOUR),
      status: "scheduled" as const,
      displayPriority: 30,
      exclusivityType: "standard" as const,
      artworkKey: "chicago-scheduled",
      artworkTitle: "Chicago",
      products: ["prd_av_returning_print"],
      quantityLimit: null,
      anniversaryOfEventId: null,
      palette: THE_DEGENS.palette,
    },
  ];

  for (const drop of dropDefs) {
    await db.insert(drops).values({
      id: drop.id,
      artistId: drop.artistId,
      tourId: drop.tourId,
      eventId: drop.eventId,
      slug: drop.slug,
      title: drop.title,
      description: drop.description,
      artworkUrl:
        drop.artistId === THE_DEGENS.id
          ? (theDegensDropPoster(drop.artworkKey) ??
            generatePoster(drop.artworkKey, drop.artworkTitle, drop.title, drop.palette))
          : generatePoster(drop.artworkKey, drop.artworkTitle, drop.title, drop.palette),
      audienceSegmentId: drop.audienceSegmentId,
      quantityLimit: drop.quantityLimit,
      quantitySold: 0,
      startsAt: drop.startsAt,
      endsAt: drop.endsAt,
      status: drop.status,
      displayPriority: drop.displayPriority,
      notificationsEnabled: drop.exclusivityType !== "standard",
      exclusivityType: drop.exclusivityType,
      anniversaryOfEventId: drop.anniversaryOfEventId,
      publishedAt: drop.status === "live" ? drop.startsAt : null,
      isDemo: true,
    });

    for (const [index, productId] of drop.products.entries()) {
      await db.insert(dropProducts).values({
        dropId: drop.id,
        productId,
        displayOrder: index,
      });
    }
  }
  counts.drops = dropDefs.length;

  /* ---------------------------------------------------------------- *
   * Shipping options
   *
   * Three different strategies across three artists, none of them hard-coded in code.
   * ---------------------------------------------------------------- */

  const shippingDefs = [
    {
      id: "shp_atlas_standard",
      artistId: THE_DEGENS.id,
      name: "Standard",
      speed: "standard" as const,
      carrier: null,
      carrierCostCents: 1180,
      baseCustomerChargeCents: 1180,
      strategy: "artist_subsidized" as const,
      subsidyCents: 400,
      freeThresholdCents: null,
      deliveryMinDays: 3,
      deliveryMaxDays: 6,
      displayOrder: 0,
    },
    {
      id: "shp_atlas_expedited",
      artistId: THE_DEGENS.id,
      name: "Expedited",
      speed: "expedited" as const,
      carrier: null,
      carrierCostCents: 2450,
      baseCustomerChargeCents: 2450,
      strategy: "fan_pays_full" as const,
      subsidyCents: 0,
      freeThresholdCents: null,
      deliveryMinDays: 1,
      deliveryMaxDays: 2,
      displayOrder: 1,
    },
    {
      id: "shp_nova_standard",
      artistId: NOVA_KESTREL.id,
      name: "Standard",
      speed: "standard" as const,
      carrier: null,
      carrierCostCents: 1040,
      baseCustomerChargeCents: 1040,
      strategy: "free_above_threshold" as const,
      subsidyCents: 0,
      freeThresholdCents: 7500,
      deliveryMinDays: 4,
      deliveryMaxDays: 8,
      displayOrder: 0,
    },
    {
      id: "shp_low_standard",
      artistId: LOW_COUNTRY.id,
      name: "Standard",
      speed: "standard" as const,
      carrier: null,
      carrierCostCents: 990,
      baseCustomerChargeCents: 990,
      strategy: "fan_pays_full" as const,
      subsidyCents: 0,
      freeThresholdCents: null,
      deliveryMinDays: 4,
      deliveryMaxDays: 9,
      displayOrder: 0,
    },
    {
      id: "shp_marisol_standard",
      artistId: MARISOL_REYES.id,
      name: "Standard",
      speed: "standard" as const,
      carrier: null,
      carrierCostCents: 1090,
      baseCustomerChargeCents: 1090,
      strategy: "fan_pays_full" as const,
      subsidyCents: 0,
      freeThresholdCents: null,
      deliveryMinDays: 4,
      deliveryMaxDays: 9,
      displayOrder: 0,
    },
    {
      id: "shp_detroit_promo",
      artistId: THE_DEGENS.id,
      eventId: detroit.id,
      name: "Tonight only — shipping on us",
      speed: "standard" as const,
      carrier: null,
      carrierCostCents: 1180,
      baseCustomerChargeCents: 0,
      strategy: "promotional_free" as const,
      subsidyCents: 1180,
      freeThresholdCents: null,
      deliveryMinDays: 3,
      deliveryMaxDays: 6,
      displayOrder: -1,
    },
  ];

  for (const option of shippingDefs) {
    await db.insert(shippingOptions).values({ ...option, isDemo: true });
  }

  /* ---------------------------------------------------------------- *
   * Verified attendance
   *
   * The primary fan is deliberately NOT verified at the live Detroit show: that is the
   * step the demo walks through. Everything before it is already on the credential.
   * ---------------------------------------------------------------- */

  const primaryFanEventKeys = [
    "marisol-brooklyn",
    "low-austin",
    ...historicalPlan.map((_, index) => `history-${index}`),
  ];

  for (const key of primaryFanEventKeys) {
    const seed = eventByKey.get(key)!;
    await db.insert(verifiedAttendance).values({
      userId: primaryFanId,
      eventId: seed.id,
      method: seed.startsAt.getTime() > now.getTime() - 60 * DAY ? "event_qr" : "geofence",
      verifiedAt: new Date(seed.startsAt.getTime() + 45 * MINUTE),
      tokenId: `evk_${seed.id}`,
      isDemo: true,
    });
  }
  counts.primaryFanShows = primaryFanEventKeys.length;

  // The crowd at tonight's Detroit show, plus history on the same tour.
  const detroitAttendees = crowdIds.slice(0, 150);
  for (const userId of detroitAttendees) {
    await db.insert(verifiedAttendance).values({
      userId,
      eventId: detroit.id,
      method: rng.randBool(0.72) ? "event_qr" : "geofence",
      verifiedAt: new Date(detroit.doorsAt.getTime() + rng.randInt(5, 170) * MINUTE),
      tokenId: `evk_${detroit.id}`,
      isDemo: true,
    });
  }
  counts.detroitVerified = detroitAttendees.length;

  await db.insert(verifiedAttendance).values({
    userId: relationshipFanId,
    eventId: detroit.id,
    method: "event_qr",
    verifiedAt: new Date(detroit.doorsAt.getTime() + 45 * MINUTE),
    tokenId: `evk_${detroit.id}`,
    isDemo: true,
  });
  counts.detroitVerified += 1;

  for (const userId of crowdIds.slice(0, 96)) {
    await db.insert(verifiedAttendance).values({
      userId,
      eventId: "evt_history_0",
      method: "geofence",
      verifiedAt: new Date(eventByKey.get("history-0")!.startsAt.getTime() + 30 * MINUTE),
      isDemo: true,
    });
  }

  for (const userId of crowdIds.slice(120, 172)) {
    await db.insert(verifiedAttendance).values({
      userId,
      eventId: brooklyn.id,
      method: "event_qr",
      verifiedAt: new Date(brooklyn.doorsAt.getTime() + rng.randInt(10, 120) * MINUTE),
      tokenId: `evk_${brooklyn.id}`,
      isDemo: true,
    });
  }

  for (const userId of crowdIds.slice(40, 104)) {
    await db.insert(verifiedAttendance).values({
      userId,
      eventId: austin.id,
      method: "geofence",
      verifiedAt: new Date(austin.startsAt.getTime() + 40 * MINUTE),
      isDemo: true,
    });
  }

  /* ---------------------------------------------------------------- *
   * Artist consents
   *
   * Only a subset of attendees connect with the artist. That gap is the point: the
   * Studio's Live dashboard shows attendance, but the CRM only ever shows these rows.
   * ---------------------------------------------------------------- */

  const consentTypes = ["drops", "anniversary", "show_news", "attendee_offers"] as const;

  // The primary fan is connected to Marisol Reyes and The Low Country, but has not yet
  // agreed to hear from The Degens — so the post-verification prompt has something to ask.
  for (const type of consentTypes) {
    if (type === "drops") continue;
    await db.insert(artistConsents).values({
      userId: primaryFanId,
      artistId: MARISOL_REYES.id,
      consentType: type,
      status: "granted",
      source: "post_verification_prompt",
      grantedAt: new Date(brooklyn.endsAt.getTime() - 30 * MINUTE),
      isDemo: true,
    });
  }

  for (const type of ["drops", "anniversary"] as const) {
    await db.insert(artistConsents).values({
      userId: primaryFanId,
      artistId: LOW_COUNTRY.id,
      consentType: type,
      status: "granted",
      source: "post_verification_prompt",
      grantedAt: new Date(austin.endsAt.getTime()),
      isDemo: true,
    });
  }

  // A withdrawn consent, so the permission centre has a real revoked row to show.
  await db.insert(artistConsents).values({
    userId: primaryFanId,
    artistId: MARISOL_REYES.id,
    consentType: "drops",
    status: "withdrawn",
    source: "permission_center",
    grantedAt: new Date(now.getTime() - 400 * DAY),
    revokedAt: new Date(now.getTime() - 120 * DAY),
    isDemo: true,
  });

  let consentCount = 6;
  for (const [index, userId] of detroitAttendees.entries()) {
    if (!rng.randBool(0.62)) continue;
    const granted = rng.pickMany(consentTypes, rng.randInt(1, 4));

    for (const type of granted) {
      await db.insert(artistConsents).values({
        userId,
        artistId: THE_DEGENS.id,
        consentType: type,
        status: "granted",
        source: index % 5 === 0 ? "drop_unlock" : "post_verification_prompt",
        grantedAt: new Date(detroit.doorsAt.getTime() + rng.randInt(20, 180) * MINUTE),
        isDemo: true,
      });
      consentCount++;
    }
  }

  for (const type of consentTypes) {
    await db.insert(artistConsents).values({
      userId: relationshipFanId,
      artistId: THE_DEGENS.id,
      consentType: type,
      status: "granted",
      source: "post_verification_prompt",
      grantedAt: new Date(detroit.startsAt.getTime() + 80 * MINUTE),
      isDemo: true,
    });
    consentCount++;
  }

  for (const userId of crowdIds.slice(120, 160)) {
    await db.insert(artistConsents).values({
      userId,
      artistId: NOVA_KESTREL.id,
      consentType: "drops",
      status: "granted",
      source: "post_verification_prompt",
      grantedAt: new Date(nashville.endsAt.getTime() - 20 * MINUTE),
      isDemo: true,
    });
    consentCount++;
  }
  counts.consents = consentCount;

  /* ---------------------------------------------------------------- *
   * Orders
   * ---------------------------------------------------------------- */

  let orderSequence = 1000;
  const orderStatusPlan = [
    "paid",
    "allocated",
    "picking",
    "packed",
    "ready_to_ship",
    "shipped",
    "delivered",
    "exception",
  ] as const;

  async function placeOrder(opts: {
    userId: string;
    artistId: string;
    eventId: string | null;
    status: (typeof orderStatusPlan)[number] | "delivered" | "cancelled" | "returned";
    placedAt: Date;
    lines: { productId: string; variantId: string; quantity: number; dropId?: string }[];
    shippingOptionId: string;
    isDemo?: boolean;
    commerceSource?: "generic" | "event_scoped";
  }) {
    const lineRows: {
      productId: string;
      variantId: string;
      quantity: number;
      dropId?: string;
      unitPriceCents: number;
      unitCostCents: number | null;
      name: string;
      size: string | null;
      image: string | null;
    }[] = [];

    for (const line of opts.lines) {
      const [product] = await db
        .select({
          name: products.name,
          basePriceCents: products.basePriceCents,
          unitCostCents: products.unitCostCents,
          images: products.images,
        })
        .from(products)
        .where(eq(products.id, line.productId));

      const variant = variantsByProduct.get(line.productId)?.find((v) => v.id === line.variantId);

      lineRows.push({
        ...line,
        unitPriceCents: product.basePriceCents,
        unitCostCents: product.unitCostCents,
        name: product.name,
        size: variant?.size ?? null,
        image: product.images?.[0] ?? null,
      });
    }

    const subtotal = lineRows.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);

    const [shipping] = await db
      .select()
      .from(shippingOptions)
      .where(eq(shippingOptions.id, opts.shippingOptionId));

    const { customerChargeCents, artistSubsidyCents } = applyShippingStrategy(shipping, subtotal);
    const tax = Math.round(subtotal * 0.06);
    const total = subtotal + tax + customerChargeCents;

    const orderId = `ord_demo_${orderSequence}`;
    const [prefs] = await db
      .select()
      .from(fanPreferences)
      .where(eq(fanPreferences.userId, opts.userId));

    await db.insert(orders).values({
      id: orderId,
      orderNumber: generateOrderNumber(orderSequence++),
      userId: opts.userId,
      artistId: opts.artistId,
      eventId: opts.eventId,
      commerceSource: opts.commerceSource ?? (opts.eventId ? "event_scoped" : "generic"),
      status: opts.status,
      subtotalCents: subtotal,
      taxCents: tax,
      shippingCarrierCostCents: shipping.carrierCostCents,
      shippingCustomerChargeCents: customerChargeCents,
      shippingArtistSubsidyCents: artistSubsidyCents,
      totalCents: total,
      shippingOptionId: shipping.id,
      shippingMethodLabel: shipping.name,
      estimatedDeliveryFrom: new Date(opts.placedAt.getTime() + shipping.deliveryMinDays * DAY),
      estimatedDeliveryTo: new Date(opts.placedAt.getTime() + shipping.deliveryMaxDays * DAY),
      shippingName: prefs?.shippingName ?? null,
      shippingLine1: prefs?.shippingLine1 ?? null,
      shippingLine2: prefs?.shippingLine2 ?? null,
      shippingCity: prefs?.shippingCity ?? null,
      shippingRegion: prefs?.shippingRegion ?? null,
      shippingPostalCode: prefs?.shippingPostalCode ?? null,
      shippingCountry: prefs?.shippingCountry ?? null,
      paymentProvider: "development",
      paymentMethodKind: "dev_test",
      paymentReference: `dev_${orderId}`,
      placedAt: opts.placedAt,
      isDemo: true,
    });

    for (const line of lineRows) {
      await db.insert(orderItems).values({
        orderId,
        productId: line.productId,
        variantId: line.variantId,
        dropId: line.dropId ?? null,
        nameSnapshot: line.name,
        sizeSnapshot: line.size,
        imageSnapshot: line.image,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
        totalCents: line.unitPriceCents * line.quantity,
        unitCostCents: line.unitCostCents,
      });
    }

    if (["shipped", "delivered", "exception", "returned"].includes(opts.status)) {
      await db.insert(shipments).values({
        orderId,
        carrier: null,
        service: shipping.name,
        status:
          opts.status === "delivered"
            ? "delivered"
            : opts.status === "exception"
              ? "exception"
              : "in_transit",
        // No carrier is integrated, so no label was ever actually purchased.
        labelPurchased: false,
        shippedAt: new Date(opts.placedAt.getTime() + 1 * DAY),
        deliveredAt:
          opts.status === "delivered" ? new Date(opts.placedAt.getTime() + 4 * DAY) : null,
        exceptionReason:
          opts.status === "exception" ? "Address could not be validated by the carrier." : null,
        isDemo: true,
      });
    }

    return orderId;
  }

  // The primary fan's history: something bought at Nashville, and an older order.
  await placeOrder({
    userId: primaryFanId,
    artistId: NOVA_KESTREL.id,
    eventId: nashville.id,
    status: "paid",
    placedAt: new Date(nashville.endsAt.getTime() - 40 * MINUTE),
    lines: [
      { productId: "prd_nk_nashville_tee", variantId: "prd_nk_nashville_tee_v2", quantity: 1 },
    ],
    shippingOptionId: "shp_nova_standard",
  });

  await placeOrder({
    userId: primaryFanId,
    artistId: LOW_COUNTRY.id,
    eventId: austin.id,
    status: "delivered",
    placedAt: new Date(austin.endsAt.getTime() + 20 * MINUTE),
    lines: [
      { productId: "prd_lc_tee", variantId: "prd_lc_tee_v2", quantity: 1 },
      { productId: "prd_lc_vinyl", variantId: "prd_lc_vinyl_v0", quantity: 1 },
    ],
    shippingOptionId: "shp_low_standard",
  });

  await placeOrder({
    userId: primaryFanId,
    artistId: MARISOL_REYES.id,
    eventId: "evt_history_2",
    status: "delivered",
    placedAt: new Date(eventByKey.get("history-2")!.endsAt.getTime() + 3 * HOUR),
    lines: [{ productId: "prd_mr_print", variantId: "prd_mr_print_v0", quantity: 1 }],
    shippingOptionId: "shp_marisol_standard",
  });

  // Tonight's orders in Detroit, spread across the fulfillment pipeline.
  let detroitOrders = 0;
  for (const [index, userId] of detroitAttendees.entries()) {
    if (!rng.randBool(0.42)) continue;

    const status = orderStatusPlan[index % orderStatusPlan.length];
    const buysTee = rng.randBool(0.65);
    const teeVariants = variantsByProduct.get("prd_av_detroit_tee")!;

    const lines = buysTee
      ? [
          {
            productId: "prd_av_detroit_tee",
            variantId: rng.pick(teeVariants).id,
            quantity: 1,
            dropId: "drp_detroit_encore",
          },
        ]
      : [
          {
            productId: "prd_av_detroit_poster",
            variantId: "prd_av_detroit_poster_v0",
            quantity: 1,
            dropId: "drp_detroit_tonight",
          },
        ];

    if (rng.randBool(0.3)) {
      lines.push({
        productId: "prd_av_pin",
        variantId: "prd_av_pin_v0",
        quantity: 1,
        dropId: "drp_signal_decay_preview",
      });
    }

    await placeOrder({
      userId,
      artistId: THE_DEGENS.id,
      eventId: detroit.id,
      status,
      placedAt: new Date(detroit.doorsAt.getTime() + rng.randInt(30, 200) * MINUTE),
      lines,
      shippingOptionId: rng.randBool(0.7) ? "shp_detroit_promo" : "shp_atlas_standard",
    });
    detroitOrders++;
  }
  counts.orders = detroitOrders + 3;

  const jordanTeeVariant = variantsByProduct.get("prd_av_detroit_tee")![0];
  const jordanHoodieVariant = variantsByProduct.get("prd_av_detroit_anniversary_hoodie")![0];

  await placeOrder({
    userId: relationshipFanId,
    artistId: THE_DEGENS.id,
    eventId: detroit.id,
    status: "delivered",
    placedAt: new Date(detroit.startsAt.getTime() + 80 * MINUTE),
    lines: [
      {
        productId: "prd_av_detroit_tee",
        variantId: jordanTeeVariant.id,
        quantity: 1,
        dropId: "drp_detroit_encore",
      },
    ],
    shippingOptionId: "shp_detroit_promo",
    commerceSource: "event_scoped",
  });

  await placeOrder({
    userId: relationshipFanId,
    artistId: THE_DEGENS.id,
    eventId: detroit.id,
    status: "delivered",
    placedAt: new Date(detroit.endsAt.getTime() + 90 * DAY + 2 * HOUR),
    lines: [
      {
        productId: "prd_av_detroit_anniversary_hoodie",
        variantId: jordanHoodieVariant.id,
        quantity: 1,
        dropId: "drp_detroit_anniversary",
      },
    ],
    shippingOptionId: "shp_atlas_standard",
    commerceSource: "event_scoped",
  });
  counts.orders += 2;

  // Brooklyn A Tender Night — artist studio guided demo commerce story.
  const brooklynAttendees = crowdIds.slice(120, 172);
  let brooklynOrders = 0;

  for (const [index, userId] of brooklynAttendees.entries()) {
    if (!rng.randBool(0.78)) continue;
    await db.insert(artistConsents).values({
      userId,
      artistId: MARISOL_REYES.id,
      consentType: "attendee_offers",
      status: "granted",
      source: "post_verification_prompt",
      grantedAt: new Date(brooklyn.endsAt.getTime() + rng.randInt(5, 90) * MINUTE),
      isDemo: true,
    });
    counts.consents++;
  }

  for (const [index, userId] of brooklynAttendees.entries()) {
    if (!rng.randBool(0.55)) continue;

    const productIds = ["prd_mr_tee", "prd_mr_hoodie", "prd_mr_hat", "prd_mr_print"] as const;
    const productId = rng.pick([...productIds]);
    const variantId = rng.pick(variantsByProduct.get(productId)!).id;

    await placeOrder({
      userId,
      artistId: MARISOL_REYES.id,
      eventId: brooklyn.id,
      status: rng.randBool(0.6) ? "paid" : "allocated",
      placedAt: new Date(brooklyn.doorsAt.getTime() + rng.randInt(40, 180) * MINUTE),
      lines: [
        {
          productId,
          variantId,
          quantity: 1,
          dropId: index % 3 === 0 ? "drp_brooklyn_encore" : "drp_tender_night_standard",
        },
      ],
      shippingOptionId: "shp_marisol_standard",
      commerceSource: "event_scoped",
    });
    brooklynOrders++;
  }

  await placeOrder({
    userId: primaryFanId,
    artistId: MARISOL_REYES.id,
    eventId: brooklyn.id,
    status: "paid",
    placedAt: new Date(brooklyn.startsAt.getTime() + 85 * MINUTE),
    lines: [
      {
        productId: "prd_mr_tee",
        variantId: rng.pick(variantsByProduct.get("prd_mr_tee")!).id,
        quantity: 1,
        dropId: "drp_tender_night_standard",
      },
    ],
    shippingOptionId: "shp_marisol_standard",
    commerceSource: "event_scoped",
  });
  brooklynOrders++;

  await placeOrder({
    userId: primaryFanId,
    artistId: MARISOL_REYES.id,
    eventId: brooklyn.id,
    status: "delivered",
    placedAt: new Date(brooklyn.endsAt.getTime() + 3 * DAY),
    lines: [
      {
        productId: "prd_mr_city_tee",
        variantId: rng.pick(variantsByProduct.get("prd_mr_city_tee")!).id,
        quantity: 1,
        dropId: "drp_brooklyn_postshow",
      },
    ],
    shippingOptionId: "shp_marisol_standard",
    commerceSource: "event_scoped",
  });
  brooklynOrders++;

  for (const userId of brooklynAttendees.slice(0, 18)) {
    if (!rng.randBool(0.45)) continue;
    await placeOrder({
      userId,
      artistId: MARISOL_REYES.id,
      eventId: brooklyn.id,
      status: "paid",
      placedAt: new Date(brooklyn.endsAt.getTime() + rng.randInt(1, 20) * DAY),
      lines: [
        {
          productId: "prd_mr_city_tee",
          variantId: rng.pick(variantsByProduct.get("prd_mr_city_tee")!).id,
          quantity: 1,
          dropId: "drp_brooklyn_postshow",
        },
      ],
      shippingOptionId: "shp_marisol_standard",
      commerceSource: "event_scoped",
    });
    brooklynOrders++;
  }

  counts.orders += brooklynOrders;

  // Nashville post-show orders, so the recently-ended state has real sales behind it.
  for (const userId of crowdIds.slice(120, 148)) {
    await placeOrder({
      userId,
      artistId: NOVA_KESTREL.id,
      eventId: nashville.id,
      status: rng.randBool(0.5) ? "paid" : "allocated",
      placedAt: new Date(nashville.endsAt.getTime() + rng.randInt(5, 100) * MINUTE),
      lines: [
        {
          productId: "prd_nk_nashville_tee",
          variantId: rng.pick(variantsByProduct.get("prd_nk_nashville_tee")!).id,
          quantity: 1,
          dropId: "drp_nashville_postshow",
        },
      ],
      shippingOptionId: "shp_nova_standard",
    });
    counts.orders++;
  }

  await recomputeDropSales(db);
  await recomputeInventoryReservations(db);
  await recomputeLifetimeSpend(db);

  /* ---------------------------------------------------------------- *
   * Event content
   * ---------------------------------------------------------------- */

  const contentRows = [
    {
      eventId: detroit.id,
      kind: "artist_message" as const,
      title: "From the band",
      body: "Detroit has been the loudest room on this tour twice running. Tonight we are playing the one we retired in 2024.",
      attendeesOnly: false,
      displayOrder: 0,
    },
    {
      eventId: detroit.id,
      kind: "setlist" as const,
      title: "Tonight's setlist",
      body: "Cold Open · Signal Decay · Hollow State · Ninety Nine Percent · Static Field · Nothing Left To Jam · [encore] Ironworks",
      attendeesOnly: true,
      displayOrder: 1,
    },
    {
      eventId: nashville.id,
      kind: "thank_you" as const,
      title: "Thank you, Nashville",
      body: "You sang the bridge louder than we did. The attendee store is open for a few more hours.",
      attendeesOnly: false,
      displayOrder: 0,
    },
    {
      eventId: nashville.id,
      kind: "photo" as const,
      title: "From the pit",
      body: "Three frames from the second song, before anybody's phone was up.",
      attendeesOnly: true,
      displayOrder: 1,
    },
    {
      eventId: austin.id,
      kind: "artist_message" as const,
      title: "One year on",
      body: "Riverbend Yard was the show that made us finish the record. Thank you for being quiet in all the right places.",
      attendeesOnly: true,
      displayOrder: 0,
    },
    {
      eventId: toronto.id,
      kind: "artist_message" as const,
      title: "Before Toronto",
      body: "Doors at seven. The Toronto print will unlock for anyone who verifies inside the room.",
      attendeesOnly: false,
      displayOrder: 0,
    },
  ];

  for (const row of contentRows) {
    await db.insert(eventContent).values({ ...row, publishedAt: now, isDemo: true });
  }

  /* ---------------------------------------------------------------- *
   * Campaigns
   *
   * Nothing is marked `sent`, because no email or SMS provider is configured. The
   * in-app campaign is the only one that could actually have been delivered.
   * ---------------------------------------------------------------- */

  const campaignDefs = [
    {
      id: "cmp_detroit_unlock",
      artistId: THE_DEGENS.id,
      kind: "show_unlock" as const,
      title: "Detroit — you're in",
      body: "Your credential is live. The Detroit-only print run is now purchasable.",
      channels: ["in_app"] as const,
      status: "sent" as const,
      eventId: detroit.id,
      dropId: "drp_detroit_tonight",
      sentAt: detroit.doorsAt,
      queuedAt: null,
      queuedReason: null,
      segmentId: "aud_detroit_attendees",
    },
    {
      id: "cmp_detroit_encore",
      artistId: THE_DEGENS.id,
      kind: "flash_drop" as const,
      title: "Encore drop is open",
      body: "Detroit Encore Tee. Verified attendees only. It closes with the timer.",
      channels: ["in_app", "email"] as const,
      status: "queued" as const,
      eventId: detroit.id,
      dropId: "drp_detroit_encore",
      sentAt: null,
      queuedAt: new Date(now.getTime() - 7 * MINUTE),
      queuedReason: "No email provider is configured for this environment.",
      segmentId: "aud_detroit_attendees",
    },
    {
      id: "cmp_toronto_preview",
      artistId: THE_DEGENS.id,
      kind: "pre_show_preview" as const,
      title: "Toronto, nine days out",
      body: "Have a look at what unlocks at Harbourline Hall.",
      channels: ["in_app", "email"] as const,
      status: "scheduled" as const,
      eventId: toronto.id,
      dropId: "drp_toronto_preshow",
      sentAt: null,
      queuedAt: null,
      queuedReason: null,
      segmentId: "aud_signal_decay_tour",
    },
    {
      id: "cmp_nashville_thanks",
      artistId: NOVA_KESTREL.id,
      kind: "post_show_message" as const,
      title: "Thank you, Nashville",
      body: "Your attendee store is open for a few more hours.",
      channels: ["in_app"] as const,
      status: "sent" as const,
      eventId: nashville.id,
      dropId: "drp_nashville_postshow",
      sentAt: nashville.endsAt,
      queuedAt: null,
      queuedReason: null,
      segmentId: "aud_nashville_attendees",
    },
    {
      id: "cmp_austin_anniversary",
      artistId: LOW_COUNTRY.id,
      kind: "anniversary_drop" as const,
      title: "One year ago tonight",
      body: "You were at Riverbend Yard. A Austin anniversary print has been unlocked for you.",
      channels: ["in_app", "email"] as const,
      status: "queued" as const,
      eventId: austin.id,
      dropId: "drp_austin_anniversary",
      sentAt: null,
      queuedAt: new Date(now.getTime() - 6 * HOUR),
      queuedReason: "No email provider is configured for this environment.",
      segmentId: "aud_austin_attendees",
    },
    {
      id: "cmp_chicago_draft",
      artistId: THE_DEGENS.id,
      kind: "product_alert" as const,
      title: "Chicago: back for a second time?",
      body: "Draft. Needs the print approved before this goes anywhere.",
      channels: ["in_app"] as const,
      status: "draft" as const,
      eventId: eventByKey.get("atlas-chicago")!.id,
      dropId: "drp_chicago_scheduled",
      sentAt: null,
      queuedAt: null,
      queuedReason: null,
      segmentId: "aud_repeat_attendees",
    },
  ];

  for (const campaign of campaignDefs) {
    await db.insert(campaigns).values({
      id: campaign.id,
      artistId: campaign.artistId,
      kind: campaign.kind,
      title: campaign.title,
      body: campaign.body,
      channels: [...campaign.channels],
      status: campaign.status,
      eventId: campaign.eventId,
      dropId: campaign.dropId,
      sentAt: campaign.sentAt,
      queuedAt: campaign.queuedAt,
      queuedReason: campaign.queuedReason,
      createdBy: campaign.artistId === THE_DEGENS.id ? demoUserId("team_degens") : null,
      isDemo: true,
    });

    await db.insert(campaignAudiences).values({
      campaignId: campaign.id,
      audienceSegmentId: campaign.segmentId,
      computedAt: null,
    });
  }
  counts.campaigns = campaignDefs.length;

  return Object.entries(counts)
    .map(([key, value]) => `${value} ${key}`)
    .join(", ");
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

async function insertTour(
  db: Db,
  opts: {
    id: string;
    artist: ArtistDefinition;
    slug: string;
    name: string;
    year: number;
    postShowWindowMinutes: number;
    subsidyCents?: number;
    freeShippingThresholdCents?: number;
  },
) {
  await db.insert(tours).values({
    id: opts.id,
    artistId: opts.artist.id,
    slug: opts.slug,
    name: opts.name,
    year: opts.year,
    logoUrl:
      opts.artist.id === THE_DEGENS.id && opts.slug === "signal-decay"
        ? THE_DEGENS_DEMO_ASSETS.logo
        : generateWordmark(`${opts.name} tour`, opts.artist.palette),
    heroImageUrl:
      opts.artist.id === THE_DEGENS.id && opts.slug === "signal-decay"
        ? THE_DEGENS_DEMO_ASSETS.tourHero
        : generatePoster(
            `${opts.artist.slug}-${opts.slug}`,
            opts.name,
            `${opts.artist.name} · ${opts.year}`,
            opts.artist.palette,
          ),
    artworkUrl:
      opts.artist.id === THE_DEGENS.id && opts.slug === "signal-decay"
        ? THE_DEGENS_DEMO_ASSETS.tourHero
        : generatePoster(
            `${opts.artist.slug}-${opts.slug}-art`,
            opts.name,
            opts.artist.name,
            opts.artist.palette,
          ),
    postShowWindowMinutes: opts.postShowWindowMinutes,
    shippingStrategy: opts.freeShippingThresholdCents
      ? "free_above_threshold"
      : opts.subsidyCents
        ? "artist_subsidized"
        : "fan_pays_full",
    freeShippingThresholdCents: opts.freeShippingThresholdCents ?? null,
    shippingSubsidyCents: opts.subsidyCents ?? 0,
    isDemo: true,
  });
}

function applyShippingStrategy(
  option: {
    strategy: string;
    baseCustomerChargeCents: number;
    carrierCostCents: number;
    subsidyCents: number;
    freeThresholdCents: number | null;
  },
  subtotalCents: number,
): { customerChargeCents: number; artistSubsidyCents: number } {
  switch (option.strategy) {
    case "promotional_free":
      return { customerChargeCents: 0, artistSubsidyCents: option.carrierCostCents };
    case "free_above_threshold":
      if (option.freeThresholdCents != null && subtotalCents >= option.freeThresholdCents) {
        return { customerChargeCents: 0, artistSubsidyCents: option.carrierCostCents };
      }
      return { customerChargeCents: option.baseCustomerChargeCents, artistSubsidyCents: 0 };
    case "artist_subsidized": {
      const charge = Math.max(0, option.baseCustomerChargeCents - option.subsidyCents);
      return {
        customerChargeCents: charge,
        artistSubsidyCents: option.baseCustomerChargeCents - charge,
      };
    }
    default:
      return { customerChargeCents: option.baseCustomerChargeCents, artistSubsidyCents: 0 };
  }
}

/** Brings `drops.quantity_sold` in line with the order rows the seed just created. */
async function recomputeDropSales(db: Db) {
  await db.execute(sql`
    update drops set quantity_sold = coalesce((
      select sum(oi.quantity) from order_items oi
      join orders o on o.id = oi.order_id
      where oi.drop_id = drops.id and o.status not in ('cancelled', 'pending')
    ), 0)
  `);
}

/** Reserves stock for every order that has not shipped yet. */
async function recomputeInventoryReservations(db: Db) {
  await db.execute(sql`
    update inventory set reserved = coalesce((
      select sum(oi.quantity) from order_items oi
      join orders o on o.id = oi.order_id
      where oi.variant_id = inventory.variant_id
        and o.status in ('paid', 'allocated', 'picking', 'packed', 'ready_to_ship')
    ), 0)
  `);
}

async function recomputeLifetimeSpend(db: Db) {
  await db.execute(sql`
    update fan_preferences set lifetime_spend_cents = coalesce((
      select sum(o.total_cents) from orders o
      where o.user_id = fan_preferences.user_id
        and o.status not in ('cancelled', 'pending', 'returned')
    ), 0)
  `);
}
