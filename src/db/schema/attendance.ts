import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import {
  CONSENT_SOURCES,
  CONSENT_STATUSES,
  CONSENT_TYPES,
  type ConsentSource,
  type ConsentStatus,
  type ConsentType,
  type ProductCategory,
  VERIFICATION_METHODS,
  type VerificationMethod,
} from "@/lib/types";
import {
  boolCol,
  cents,
  createdAt,
  isDemo,
  jsonCol,
  newId,
  oneOf,
  timestampCol,
  updatedAt,
} from "./_shared";
import { artists, events, eventVerificationTokens } from "./events";
import { users } from "./identity";

/**
 * The permanent record that a person was at a show, and the root of the entire
 * credential, eligibility and anniversary model.
 *
 * The unique index on (user_id, event_id) is what makes duplicate credentials
 * impossible; it is a database guarantee rather than an application check.
 *
 * Deliberately absent: the coordinates used to verify. They are checked once against
 * the venue geofence and discarded.
 */
export const verifiedAttendance = pgTable(
  "verified_attendance",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("vat")),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    method: text("method").$type<VerificationMethod>().notNull(),
    verifiedAt: timestampCol("verified_at").notNull().defaultNow(),
    tokenId: text("token_id").references(() => eventVerificationTokens.id, { onDelete: "set null" }),
    isDemo: isDemo(),
  },
  (t) => [
    uniqueIndex("verified_attendance_user_event_unique").on(t.userId, t.eventId),
    index("verified_attendance_user_idx").on(t.userId),
    index("verified_attendance_event_idx").on(t.eventId),
    index("verified_attendance_verified_at_idx").on(t.verifiedAt),
    oneOf("verified_attendance_method_check", t.method, VERIFICATION_METHODS),
  ],
);

/**
 * Every verification attempt, successful or not. Used to rate-limit a user or client
 * so a leaked QR token cannot be replayed at volume.
 */
export const verificationAttempts = pgTable(
  "verification_attempts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("vta")),
    eventId: text("event_id").references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    method: text("method").$type<VerificationMethod>().notNull(),
    succeeded: boolCol("succeeded").notNull(),
    /** A machine-readable reason code, never a raw error or user coordinates. */
    failureReason: text("failure_reason"),
    /** Salted hash. The raw client address is never stored. */
    clientHash: text("client_hash"),
    createdAt: createdAt(),
  },
  (t) => [
    index("verification_attempts_user_idx").on(t.userId, t.createdAt),
    index("verification_attempts_client_idx").on(t.clientHash, t.createdAt),
    index("verification_attempts_event_idx").on(t.eventId),
    oneOf("verification_attempts_method_check", t.method, VERIFICATION_METHODS),
  ],
);

/**
 * The single gate on artist access to a fan. Without a `granted` row of the relevant
 * type, an artist cannot see the fan in the CRM or include them in a campaign, even
 * though the fan attended their show and bought their merch.
 */
export const artistConsents = pgTable(
  "artist_consents",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("con")),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    consentType: text("consent_type").$type<ConsentType>().notNull(),
    status: text("status").$type<ConsentStatus>().notNull(),
    source: text("source").$type<ConsentSource>().notNull(),
    grantedAt: timestampCol("granted_at"),
    revokedAt: timestampCol("revoked_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    isDemo: isDemo(),
  },
  (t) => [
    uniqueIndex("artist_consents_user_artist_type_unique").on(t.userId, t.artistId, t.consentType),
    index("artist_consents_artist_status_idx").on(t.artistId, t.status),
    index("artist_consents_user_idx").on(t.userId),
    oneOf("artist_consents_consent_type_check", t.consentType, CONSENT_TYPES),
    oneOf("artist_consents_status_check", t.status, CONSENT_STATUSES),
    oneOf("artist_consents_source_check", t.source, CONSENT_SOURCES),
  ],
);

/**
 * Optional fan-supplied preferences. The shipping address here is used to fulfil orders
 * and is explicitly not marketing data; artist-facing queries never read these columns.
 */
export const fanPreferences = pgTable("fan_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  apparelSize: text("apparel_size"),
  preferredCategories: jsonCol<ProductCategory[]>("preferred_categories"),
  shippingName: text("shipping_name"),
  shippingLine1: text("shipping_line1"),
  shippingLine2: text("shipping_line2"),
  shippingCity: text("shipping_city"),
  shippingRegion: text("shipping_region"),
  shippingPostalCode: text("shipping_postal_code"),
  shippingCountry: text("shipping_country"),
  shippingPhone: text("shipping_phone"),
  notifyDrops: boolCol("notify_drops").notNull().default(true),
  notifyAnniversary: boolCol("notify_anniversary").notNull().default(true),
  notifyShowNews: boolCol("notify_show_news").notNull().default(false),
  /** Opt-in to the "For You" row on the home screen, which reads permissioned activity. */
  personalizedRecommendations: boolCol("personalized_recommendations").notNull().default(true),
  lifetimeSpendCents: cents("lifetime_spend_cents").notNull().default(0),
  updatedAt: updatedAt(),
});
