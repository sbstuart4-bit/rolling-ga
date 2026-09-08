import { index, integer, pgTable, text } from "drizzle-orm/pg-core";
import { cents, createdAt, isDemo, oneOf, timestampCol, updatedAt } from "./_shared";
import { events } from "./events";
import { VENUE_COMMISSION_TREATMENTS, type VenueCommissionTreatment } from "@/lib/show-economics/types";

export const eventShowEconomics = pgTable(
  "event_show_economics",
  {
    eventId: text("event_id")
      .primaryKey()
      .references(() => events.id, { onDelete: "cascade" }),
    platformFeeBasisPoints: cents("platform_fee_basis_points").notNull().default(500),
    digitalVenueCommissionTreatment: text("digital_venue_commission_treatment")
      .$type<VenueCommissionTreatment>()
      .notNull()
      .default("UNKNOWN"),
    digitalVenueCommissionPercent: cents("digital_venue_commission_percent"),
    physicalMerchGmvCents: cents("physical_merch_gmv_cents"),
    unitsBrought: integer("units_brought"),
    unitsSold: integer("units_sold"),
    stockoutCount: integer("stockout_count"),
    physicalVenueCommissionTreatment: text("physical_venue_commission_treatment")
      .$type<VenueCommissionTreatment>()
      .notNull()
      .default("UNKNOWN"),
    physicalVenueCommissionPercent: cents("physical_venue_commission_percent"),
    laborCostCents: cents("labor_cost_cents"),
    otherPhysicalCostCents: cents("other_physical_cost_cents"),
    physicalProductCostCents: cents("physical_product_cost_cents"),
    updatedAt: updatedAt(),
    createdAt: createdAt(),
    isDemo: isDemo(),
  },
  (t) => [
    index("event_show_economics_event_idx").on(t.eventId),
    oneOf(
      "event_show_economics_digital_venue_treatment_check",
      t.digitalVenueCommissionTreatment,
      VENUE_COMMISSION_TREATMENTS,
    ),
    oneOf(
      "event_show_economics_physical_venue_treatment_check",
      t.physicalVenueCommissionTreatment,
      VENUE_COMMISSION_TREATMENTS,
    ),
  ],
);

export type EventShowEconomicsRow = typeof eventShowEconomics.$inferSelect;
export type EventShowEconomicsInsert = typeof eventShowEconomics.$inferInsert;
