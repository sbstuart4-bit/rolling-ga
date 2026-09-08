import { index, integer, pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, isDemo, oneOf, timestampCol, updatedAt } from "./_shared";
import { events } from "./events";

const PILOT_GOAL_DIRECTIONS = ["higher", "lower"] as const;
const PILOT_GOAL_UNITS = ["cents", "count", "ratio"] as const;
const PILOT_GOAL_CATEGORIES = [
  "digital_merch_adoption",
  "connected_fans",
  "post_show_commerce",
  "activated_revenue",
  "delivery_promise",
] as const;

export const eventPilotGoals = pgTable(
  "event_pilot_goals",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    metricKey: text("metric_key").notNull(),
    label: text("label").notNull(),
    category: text("category").notNull(),
    direction: text("direction").notNull(),
    targetValue: integer("target_value").notNull(),
    unit: text("unit").notNull(),
    note: text("note"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    isDemo: isDemo(),
  },
  (t) => [
    index("event_pilot_goals_event_idx").on(t.eventId),
    oneOf("event_pilot_goals_direction_check", t.direction, PILOT_GOAL_DIRECTIONS),
    oneOf("event_pilot_goals_unit_check", t.unit, PILOT_GOAL_UNITS),
    oneOf("event_pilot_goals_category_check", t.category, PILOT_GOAL_CATEGORIES),
  ],
);

export type EventPilotGoalRow = typeof eventPilotGoals.$inferSelect;
