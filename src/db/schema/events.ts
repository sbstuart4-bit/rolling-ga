import { index, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import {
  EVENT_CONTENT_KINDS,
  type EventContentKind,
  SHIPPING_STRATEGIES,
  type ShippingStrategy,
} from "@/lib/types";
import {
  boolCol,
  cents,
  coord,
  createdAt,
  isDemo,
  newId,
  oneOf,
  timestampCol,
  updatedAt,
} from "./_shared";

export const artists = pgTable(
  "artists",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("art")),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    bio: text("bio"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    isDemo: isDemo(),
  },
  (t) => [uniqueIndex("artists_slug_unique").on(t.slug)],
);

/**
 * Level 1 of the takeover cascade. Every colour is a CSS colour string so it can be
 * written straight into a custom property; nothing here is compiled into a stylesheet.
 */
export const artistBrand = pgTable("artist_brand", {
  artistId: text("artist_id")
    .primaryKey()
    .references(() => artists.id, { onDelete: "cascade" }),
  logoUrl: text("logo_url"),
  heroImageUrl: text("hero_image_url"),
  background: text("background"),
  surface: text("surface"),
  foreground: text("foreground"),
  mutedForeground: text("muted_foreground"),
  accent: text("accent"),
  accentForeground: text("accent_foreground"),
  accentSecondary: text("accent_secondary"),
  border: text("border"),
  /** Must match an id in the `ARTIST_FONTS` allowlist. */
  fontId: text("font_id"),
  /** Art-direction note shown to whoever uploads product photography. */
  merchPhotographyNote: text("merch_photography_note"),
  showMessaging: text("show_messaging"),
  updatedAt: updatedAt(),
});

export const venues = pgTable(
  "venues",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("ven")),
    name: text("name").notNull(),
    city: text("city").notNull(),
    region: text("region"),
    country: text("country").notNull().default("US"),
    lat: coord("lat").notNull(),
    lng: coord("lng").notNull(),
    timezone: text("timezone").notNull(),
    /** Radius used by the geofence verifier. Large venues and festival grounds need more. */
    geofenceRadiusMeters: cents("geofence_radius_meters").notNull().default(400),
    capacity: cents("capacity"),
    createdAt: createdAt(),
    isDemo: isDemo(),
  },
  (t) => [index("venues_city_idx").on(t.city)],
);

/** Level 2 of the takeover cascade, plus tour-wide commerce defaults. */
export const tours = pgTable(
  "tours",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("tor")),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    year: cents("year"),
    logoUrl: text("logo_url"),
    heroImageUrl: text("hero_image_url"),
    artworkUrl: text("artwork_url"),
    background: text("background"),
    surface: text("surface"),
    foreground: text("foreground"),
    mutedForeground: text("muted_foreground"),
    accent: text("accent"),
    accentForeground: text("accent_foreground"),
    accentSecondary: text("accent_secondary"),
    border: text("border"),
    fontId: text("font_id"),
    showMessaging: text("show_messaging"),
    /** How long the attendee-exclusive store stays open after a show ends. */
    postShowWindowMinutes: cents("post_show_window_minutes").notNull().default(480),
    shippingStrategy: text("shipping_strategy")
      .$type<ShippingStrategy>()
      .notNull()
      .default("fan_pays_full"),
    freeShippingThresholdCents: cents("free_shipping_threshold_cents"),
    shippingSubsidyCents: cents("shipping_subsidy_cents").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    isDemo: isDemo(),
  },
  (t) => [
    uniqueIndex("tours_artist_slug_unique").on(t.artistId, t.slug),
    index("tours_artist_idx").on(t.artistId),
    oneOf("tours_shipping_strategy_check", t.shippingStrategy, SHIPPING_STRATEGIES),
  ],
);

export const events = pgTable(
  "events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("evt")),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    tourId: text("tour_id")
      .notNull()
      .references(() => tours.id, { onDelete: "cascade" }),
    venueId: text("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "restrict" }),
    /** Human-readable and shareable, e.g. `the-degens-signal-decay-detroit-2027`. */
    slug: text("slug").notNull(),
    title: text("title"),
    doorsAt: timestampCol("doors_at"),
    startsAt: timestampCol("starts_at").notNull(),
    endsAt: timestampCol("ends_at").notNull(),
    timezone: text("timezone").notNull(),
    expectedAttendance: cents("expected_attendance"),
    /** Entered by the tour manager or supplied by a ticketing integration. Never invented. */
    actualAttendance: cents("actual_attendance"),
    localMessage: text("local_message"),
    /** Overrides the tour's window when set. */
    postShowWindowMinutes: cents("post_show_window_minutes"),
    verificationOpensAt: timestampCol("verification_opens_at"),
    verificationClosesAt: timestampCol("verification_closes_at"),
    cancelled: boolCol("cancelled").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    isDemo: isDemo(),
  },
  (t) => [
    uniqueIndex("events_slug_unique").on(t.slug),
    index("events_artist_idx").on(t.artistId),
    index("events_tour_idx").on(t.tourId),
    index("events_venue_idx").on(t.venueId),
    index("events_starts_at_idx").on(t.startsAt),
  ],
);

/** Level 3 of the takeover cascade. Only the fields a city actually overrides. */
export const eventThemes = pgTable("event_themes", {
  eventId: text("event_id")
    .primaryKey()
    .references(() => events.id, { onDelete: "cascade" }),
  cityArtworkUrl: text("city_artwork_url"),
  heroImageUrl: text("hero_image_url"),
  logoUrl: text("logo_url"),
  background: text("background"),
  surface: text("surface"),
  foreground: text("foreground"),
  mutedForeground: text("muted_foreground"),
  accent: text("accent"),
  accentForeground: text("accent_foreground"),
  accentSecondary: text("accent_secondary"),
  border: text("border"),
  fontId: text("font_id"),
  showMessaging: text("show_messaging"),
  updatedAt: updatedAt(),
});

/**
 * A rotating token behind each event's QR code. Rotating rather than using the event
 * slug means a leaked photo of the code can be invalidated without changing the URL
 * fans already have.
 */
export const eventVerificationTokens = pgTable(
  "event_verification_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("evk")),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    active: boolCol("active").notNull().default(true),
    issuedAt: createdAt(),
    expiresAt: timestampCol("expires_at"),
    rotatedFromId: text("rotated_from_id"),
    isDemo: isDemo(),
  },
  (t) => [
    uniqueIndex("event_verification_tokens_token_unique").on(t.token),
    index("event_verification_tokens_event_idx").on(t.eventId),
  ],
);

export const eventContent = pgTable(
  "event_content",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("ecn")),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    kind: text("kind").$type<EventContentKind>().notNull(),
    title: text("title"),
    body: text("body"),
    mediaUrl: text("media_url"),
    /** `attendees` content is withheld from anyone without a verified_attendance row. */
    attendeesOnly: boolCol("attendees_only").notNull().default(false),
    displayOrder: cents("display_order").notNull().default(0),
    publishedAt: timestampCol("published_at"),
    createdAt: createdAt(),
    isDemo: isDemo(),
  },
  (t) => [
    index("event_content_event_idx").on(t.eventId),
    oneOf("event_content_kind_check", t.kind, EVENT_CONTENT_KINDS),
  ],
);
