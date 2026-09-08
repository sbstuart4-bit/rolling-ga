import { index, integer, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import {
  PRODUCTION_REQUIREMENT_MODES,
  PRODUCTION_WORK_STATUSES,
  type ProductionRequirementMode,
  type ProductionWorkStatus,
} from "@/lib/types";
import { createdAt, isDemo, newId, oneOf, timestampCol } from "./_shared";
import { artists, events } from "./events";
import { products, productVariants } from "./catalog";
import { orderItems, orders } from "./commerce";

/**
 * Unit-level production demand — one row per physical unit requiring production.
 * Order-level fulfillment status (Phase 5) rolls up from aggregate production state.
 */
export const productionWork = pgTable(
  "production_work",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("pwk")),
    orderItemId: text("order_item_id")
      .notNull()
      .references(() => orderItems.id, { onDelete: "cascade" }),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    eventId: text("event_id").references(() => events.id, { onDelete: "set null" }),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: text("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    /** 0-based index within the order line quantity. */
    unitIndex: integer("unit_index").notNull().default(0),
    status: text("status").$type<ProductionWorkStatus>().notNull().default("queued"),
    requirementMode: text("requirement_mode")
      .$type<ProductionRequirementMode>()
      .notNull()
      .default("on_demand"),
    nameSnapshot: text("name_snapshot").notNull(),
    sizeSnapshot: text("size_snapshot"),
    queuedAt: timestampCol("queued_at").notNull(),
    startedAt: timestampCol("started_at"),
    completedAt: timestampCol("completed_at"),
    createdAt: createdAt(),
    isDemo: isDemo(),
  },
  (t) => [
    uniqueIndex("production_work_item_unit_unique").on(t.orderItemId, t.unitIndex),
    index("production_work_order_idx").on(t.orderId),
    index("production_work_event_idx").on(t.eventId),
    index("production_work_status_idx").on(t.status),
    index("production_work_variant_idx").on(t.variantId),
    oneOf("production_work_status_check", t.status, PRODUCTION_WORK_STATUSES),
    oneOf("production_work_mode_check", t.requirementMode, PRODUCTION_REQUIREMENT_MODES),
  ],
);
