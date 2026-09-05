import { index, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import {
  PRODUCT_ACCESS_TYPES,
  PRODUCT_CATEGORIES,
  type ProductAccessType,
  type ProductCategory,
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
import { artists, events, tours } from "./events";

export const products = pgTable(
  "products",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("prd")),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    /** Set to restrict eligibility to one tour. */
    tourId: text("tour_id").references(() => tours.id, { onDelete: "set null" }),
    /** Set for city exclusives such as a Detroit-only tee. */
    eventId: text("event_id").references(() => events.id, { onDelete: "set null" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    /** The editorial line under the title, e.g. "For those who were there." */
    tagline: text("tagline"),
    story: text("story"),
    category: text("category").$type<ProductCategory>().notNull(),
    accessType: text("access_type").$type<ProductAccessType>().notNull().default("public"),
    /** Required when accessType is `scheduled`. */
    availableFrom: timestampCol("available_from"),
    availableUntil: timestampCol("available_until"),
    basePriceCents: cents("base_price_cents").notNull(),
    /** Unit cost. Present only where the artist has supplied it; drives contribution profit. */
    unitCostCents: cents("unit_cost_cents"),
    sku: text("sku").notNull(),
    images: jsonCol<string[]>("images"),
    /** The scarcity number shown to fans, e.g. "500 produced". */
    producedQuantity: cents("produced_quantity"),
    isDigital: boolCol("is_digital").notNull().default(false),
    active: boolCol("active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    isDemo: isDemo(),
  },
  (t) => [
    uniqueIndex("products_artist_slug_unique").on(t.artistId, t.slug),
    uniqueIndex("products_sku_unique").on(t.sku),
    index("products_artist_idx").on(t.artistId),
    index("products_event_idx").on(t.eventId),
    index("products_tour_idx").on(t.tourId),
    index("products_access_type_idx").on(t.accessType),
    oneOf("products_category_check", t.category, PRODUCT_CATEGORIES),
    oneOf("products_access_type_check", t.accessType, PRODUCT_ACCESS_TYPES),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("var")),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull(),
    /** Apparel size, or null for one-size products. */
    size: text("size"),
    color: text("color"),
    /** Added to the product's base price; usually 0, non-zero for extended sizes. */
    priceDeltaCents: cents("price_delta_cents").notNull().default(0),
    displayOrder: cents("display_order").notNull().default(0),
    active: boolCol("active").notNull().default(true),
    createdAt: createdAt(),
    isDemo: isDemo(),
  },
  (t) => [
    uniqueIndex("product_variants_sku_unique").on(t.sku),
    index("product_variants_product_idx").on(t.productId),
  ],
);

/**
 * Stock is tracked per variant. `reserved` covers units committed to unshipped orders,
 * so availability is always `onHand - reserved`.
 */
export const inventory = pgTable(
  "inventory",
  {
    variantId: text("variant_id")
      .primaryKey()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    onHand: cents("on_hand").notNull().default(0),
    reserved: cents("reserved").notNull().default(0),
    reorderPoint: cents("reorder_point").notNull().default(0),
    updatedAt: updatedAt(),
  },
  (t) => [index("inventory_on_hand_idx").on(t.onHand)],
);

/**
 * A bundle is an event collection, not a generic upsell: it is tied to a show or tour
 * and priced as a single artefact of that night.
 */
export const bundles = pgTable(
  "bundles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("bnd")),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    tourId: text("tour_id").references(() => tours.id, { onDelete: "set null" }),
    eventId: text("event_id").references(() => events.id, { onDelete: "set null" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    /** The bundle price. The saving is derived from the sum of its items. */
    bundlePriceCents: cents("bundle_price_cents").notNull(),
    accessType: text("access_type").$type<ProductAccessType>().notNull().default("public"),
    availableFrom: timestampCol("available_from"),
    availableUntil: timestampCol("available_until"),
    active: boolCol("active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    isDemo: isDemo(),
  },
  (t) => [
    uniqueIndex("bundles_artist_slug_unique").on(t.artistId, t.slug),
    index("bundles_artist_idx").on(t.artistId),
    index("bundles_event_idx").on(t.eventId),
    oneOf("bundles_access_type_check", t.accessType, PRODUCT_ACCESS_TYPES),
  ],
);

export const bundleItems = pgTable(
  "bundle_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("bni")),
    bundleId: text("bundle_id")
      .notNull()
      .references(() => bundles.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    /** Null when the fan chooses the variant (e.g. tee size) at add-to-cart time. */
    variantId: text("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    quantity: cents("quantity").notNull().default(1),
    displayOrder: cents("display_order").notNull().default(0),
  },
  (t) => [
    index("bundle_items_bundle_idx").on(t.bundleId),
    index("bundle_items_product_idx").on(t.productId),
  ],
);
