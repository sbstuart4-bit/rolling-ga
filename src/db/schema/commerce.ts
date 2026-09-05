import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import {
  ORDER_STATUSES,
  type OrderStatus,
  PAYMENT_METHOD_KINDS,
  type PaymentMethodKind,
  COMMERCE_SOURCES,
  type CommerceSource,
  SHIPPING_SPEEDS,
  SHIPPING_STRATEGIES,
  type ShippingSpeed,
  type ShippingStrategy,
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
import { bundles, products, productVariants } from "./catalog";
import { drops } from "./drops";
import { artists, events, tours } from "./events";
import { users } from "./identity";

const CART_STATUSES = ["active", "converted", "abandoned"] as const;
type CartStatus = (typeof CART_STATUSES)[number];

const SHIPMENT_STATUSES = [
  "pending",
  "label_required",
  "in_transit",
  "delivered",
  "exception",
] as const;
type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const carts = pgTable(
  "carts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("crt")),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** The show the cart was opened from; drives eligibility and post-purchase attribution. */
    eventId: text("event_id").references(() => events.id, { onDelete: "set null" }),
    status: text("status").$type<CartStatus>().notNull().default("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("carts_user_status_idx").on(t.userId, t.status),
    oneOf("carts_status_check", t.status, CART_STATUSES),
  ],
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("cri")),
    cartId: text("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id, { onDelete: "cascade" }),
    variantId: text("variant_id").references(() => productVariants.id, { onDelete: "cascade" }),
    bundleId: text("bundle_id").references(() => bundles.id, { onDelete: "cascade" }),
    /** Records which drop the item was added from, so expiry can invalidate the line. */
    dropId: text("drop_id").references(() => drops.id, { onDelete: "set null" }),
    /** The show this line was added from; used for attribution when cart context changes. */
    sourceEventId: text("source_event_id").references(() => events.id, { onDelete: "set null" }),
    quantity: cents("quantity").notNull().default(1),
    /** Price captured at add-to-cart time; re-validated against the server at checkout. */
    unitPriceCents: cents("unit_price_cents").notNull(),
    /** Bundle lines store their chosen variants here, keyed by bundle item id. */
    bundleSelections: jsonCol<Record<string, string>>("bundle_selections"),
    addedAt: createdAt(),
  },
  (t) => [
    index("cart_items_cart_idx").on(t.cartId),
    index("cart_items_variant_idx").on(t.variantId),
    index("cart_items_source_event_idx").on(t.sourceEventId),
  ],
);

/**
 * A shipping choice offered at checkout. The three money columns are kept apart so the
 * artist can subsidise delivery without the real carrier cost being lost, and so
 * nothing is ever hard-coded: every amount here is configured per artist, tour, or event.
 */
export const shippingOptions = pgTable(
  "shipping_options",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("shp")),
    artistId: text("artist_id").references(() => artists.id, { onDelete: "cascade" }),
    tourId: text("tour_id").references(() => tours.id, { onDelete: "cascade" }),
    eventId: text("event_id").references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    speed: text("speed").$type<ShippingSpeed>().notNull().default("standard"),
    /** The intended carrier. Only surfaced to fans once a shipment actually uses it. */
    carrier: text("carrier"),
    service: text("service"),
    /** What the carrier charges the artist. */
    carrierCostCents: cents("carrier_cost_cents").notNull(),
    /** What the fan is asked to pay before any strategy is applied. */
    baseCustomerChargeCents: cents("base_customer_charge_cents").notNull(),
    strategy: text("strategy").$type<ShippingStrategy>().notNull().default("fan_pays_full"),
    /** Order subtotal above which shipping becomes free, for `free_above_threshold`. */
    freeThresholdCents: cents("free_threshold_cents"),
    /** Flat amount the artist absorbs, for `artist_subsidized`. */
    subsidyCents: cents("subsidy_cents").notNull().default(0),
    deliveryMinDays: cents("delivery_min_days").notNull().default(3),
    deliveryMaxDays: cents("delivery_max_days").notNull().default(7),
    displayOrder: cents("display_order").notNull().default(0),
    active: boolCol("active").notNull().default(true),
    createdAt: createdAt(),
    isDemo: isDemo(),
  },
  (t) => [
    index("shipping_options_artist_idx").on(t.artistId),
    index("shipping_options_event_idx").on(t.eventId),
    index("shipping_options_tour_idx").on(t.tourId),
    oneOf("shipping_options_speed_check", t.speed, SHIPPING_SPEEDS),
    oneOf("shipping_options_strategy_check", t.strategy, SHIPPING_STRATEGIES),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("ord")),
    orderNumber: text("order_number").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    /** Orders are single-artist, which is what makes tenant isolation tractable. */
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "restrict" }),
    /** Links the purchase to the show, so it appears on that My Shows record. */
    eventId: text("event_id").references(() => events.id, { onDelete: "set null" }),
    /** Whether the order originated from event-scoped commerce or generic browsing. */
    commerceSource: text("commerce_source")
      .$type<CommerceSource>()
      .notNull()
      .default("generic"),
    status: text("status").$type<OrderStatus>().notNull().default("pending"),
    subtotalCents: cents("subtotal_cents").notNull(),
    discountCents: cents("discount_cents").notNull().default(0),
    taxCents: cents("tax_cents").notNull().default(0),
    shippingCarrierCostCents: cents("shipping_carrier_cost_cents").notNull().default(0),
    shippingCustomerChargeCents: cents("shipping_customer_charge_cents").notNull().default(0),
    shippingArtistSubsidyCents: cents("shipping_artist_subsidy_cents").notNull().default(0),
    totalCents: cents("total_cents").notNull(),
    shippingOptionId: text("shipping_option_id").references(() => shippingOptions.id, {
      onDelete: "set null",
    }),
    /** Snapshot so a later configuration change cannot rewrite what the fan was told. */
    shippingMethodLabel: text("shipping_method_label"),
    estimatedDeliveryFrom: timestampCol("estimated_delivery_from"),
    estimatedDeliveryTo: timestampCol("estimated_delivery_to"),
    shippingName: text("shipping_name"),
    shippingLine1: text("shipping_line1"),
    shippingLine2: text("shipping_line2"),
    shippingCity: text("shipping_city"),
    shippingRegion: text("shipping_region"),
    shippingPostalCode: text("shipping_postal_code"),
    shippingCountry: text("shipping_country"),
    /** Which provider handled payment. Never any card data. */
    paymentProvider: text("payment_provider"),
    paymentMethodKind: text("payment_method_kind").$type<PaymentMethodKind>(),
    paymentReference: text("payment_reference"),
    placedAt: timestampCol("placed_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    isDemo: isDemo(),
  },
  (t) => [
    uniqueIndex("orders_number_unique").on(t.orderNumber),
    index("orders_user_idx").on(t.userId),
    index("orders_artist_idx").on(t.artistId),
    index("orders_event_idx").on(t.eventId),
    index("orders_commerce_source_idx").on(t.commerceSource),
    index("orders_status_idx").on(t.status),
    index("orders_placed_at_idx").on(t.placedAt),
    oneOf("orders_status_check", t.status, ORDER_STATUSES),
    oneOf("orders_commerce_source_check", t.commerceSource, COMMERCE_SOURCES),
    oneOf("orders_payment_method_kind_check", t.paymentMethodKind, PAYMENT_METHOD_KINDS),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("oit")),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: text("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    bundleId: text("bundle_id").references(() => bundles.id, { onDelete: "set null" }),
    dropId: text("drop_id").references(() => drops.id, { onDelete: "set null" }),
    /** Names and sizes are snapshotted so a historic order always reads correctly. */
    nameSnapshot: text("name_snapshot").notNull(),
    sizeSnapshot: text("size_snapshot"),
    imageSnapshot: text("image_snapshot"),
    quantity: cents("quantity").notNull(),
    unitPriceCents: cents("unit_price_cents").notNull(),
    totalCents: cents("total_cents").notNull(),
    /** Copied from the product so contribution profit survives later cost changes. */
    unitCostCents: cents("unit_cost_cents"),
  },
  (t) => [
    index("order_items_order_idx").on(t.orderId),
    index("order_items_product_idx").on(t.productId),
    index("order_items_variant_idx").on(t.variantId),
  ],
);

export const shipments = pgTable(
  "shipments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("shm")),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    carrier: text("carrier"),
    service: text("service"),
    trackingNumber: text("tracking_number"),
    trackingUrl: text("tracking_url"),
    status: text("status").$type<ShipmentStatus>().notNull().default("pending"),
    /**
     * False until a carrier API actually returns a label. No carrier is integrated, so
     * this stays false and the UI says a label is still required rather than implying
     * a handoff that never happened.
     */
    labelPurchased: boolCol("label_purchased").notNull().default(false),
    carrierReference: text("carrier_reference"),
    shippedAt: timestampCol("shipped_at"),
    deliveredAt: timestampCol("delivered_at"),
    exceptionReason: text("exception_reason"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    isDemo: isDemo(),
  },
  (t) => [
    index("shipments_order_idx").on(t.orderId),
    index("shipments_status_idx").on(t.status),
    oneOf("shipments_status_check", t.status, SHIPMENT_STATUSES),
  ],
);
