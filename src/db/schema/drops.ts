import { index, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import {
  AUDIENCE_RULE_KINDS,
  type AudienceRuleKind,
  type AudienceRuleParams,
  DROP_EXCLUSIVITY_TYPES,
  DROP_STATUSES,
  type DropExclusivityType,
  type DropStatus,
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
import { products } from "./catalog";
import { artists, events, tours } from "./events";

/**
 * A reusable audience rule. Keeping the rule kind and its parameters in their own table
 * means new segmentation can be added by introducing a kind, without altering drops,
 * campaigns, or anything that targets an audience.
 */
export const audienceSegments = pgTable(
  "audience_segments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("aud")),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    ruleKind: text("rule_kind").$type<AudienceRuleKind>().notNull(),
    params: jsonCol<AudienceRuleParams>("params"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    isDemo: isDemo(),
  },
  (t) => [
    index("audience_segments_artist_idx").on(t.artistId),
    oneOf("audience_segments_rule_kind_check", t.ruleKind, AUDIENCE_RULE_KINDS),
  ],
);

export const drops = pgTable(
  "drops",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("drp")),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    tourId: text("tour_id").references(() => tours.id, { onDelete: "set null" }),
    eventId: text("event_id").references(() => events.id, { onDelete: "set null" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    artworkUrl: text("artwork_url"),
    audienceSegmentId: text("audience_segment_id").references(() => audienceSegments.id, {
      onDelete: "set null",
    }),
    /** Total units across the drop, independent of per-variant inventory. Null means uncapped. */
    quantityLimit: cents("quantity_limit"),
    quantitySold: cents("quantity_sold").notNull().default(0),
    /**
     * Authoritative server timestamps. Countdown UI derives from these plus a measured
     * client clock offset, and eligibility is always rechecked against them server-side.
     */
    startsAt: timestampCol("starts_at").notNull(),
    endsAt: timestampCol("ends_at"),
    status: text("status").$type<DropStatus>().notNull().default("draft"),
    displayPriority: cents("display_priority").notNull().default(0),
    notificationsEnabled: boolCol("notifications_enabled").notNull().default(false),
    exclusivityType: text("exclusivity_type")
      .$type<DropExclusivityType>()
      .notNull()
      .default("standard"),
    /**
     * For anniversary drops: the historic event whose verified attendees are eligible.
     * Eligibility reads verified_attendance rather than any derived audience list.
     */
    anniversaryOfEventId: text("anniversary_of_event_id").references(() => events.id, {
      onDelete: "set null",
    }),
    publishedAt: timestampCol("published_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    isDemo: isDemo(),
  },
  (t) => [
    uniqueIndex("drops_artist_slug_unique").on(t.artistId, t.slug),
    index("drops_artist_idx").on(t.artistId),
    index("drops_event_idx").on(t.eventId),
    index("drops_status_idx").on(t.status),
    index("drops_window_idx").on(t.startsAt, t.endsAt),
    oneOf("drops_status_check", t.status, DROP_STATUSES),
    oneOf("drops_exclusivity_type_check", t.exclusivityType, DROP_EXCLUSIVITY_TYPES),
  ],
);

export const dropProducts = pgTable(
  "drop_products",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("dpr")),
    dropId: text("drop_id")
      .notNull()
      .references(() => drops.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    /** Overrides the product's base price for the duration of the drop. */
    dropPriceCents: cents("drop_price_cents"),
    displayOrder: cents("display_order").notNull().default(0),
  },
  (t) => [
    uniqueIndex("drop_products_drop_product_unique").on(t.dropId, t.productId),
    index("drop_products_drop_idx").on(t.dropId),
    index("drop_products_product_idx").on(t.productId),
  ],
);
