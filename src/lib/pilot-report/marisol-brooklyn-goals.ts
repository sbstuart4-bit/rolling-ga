import { MARISOL_BROOKLYN_EVENT_ID } from "@/lib/demo-user-ids";
import type { PilotGoalDefinition } from "./types";

/**
 * Demo pilot goals for Marisol Brooklyn — defined before results, compared at report time.
 * Targets are demo assumptions, not retroactive success criteria.
 */
export const MARISOL_BROOKLYN_PILOT_GOALS: Omit<PilotGoalDefinition, "eventId">[] = [
  {
    id: "pg_brooklyn_digital_adoption",
    metricKey: "digital_adoption_rate",
    label: "Digital merch adoption",
    category: "digital_merch_adoption",
    direction: "higher",
    targetValue: 0.35,
    unit: "ratio",
    note: "Purchasing fans ÷ verified attendees",
  },
  {
    id: "pg_brooklyn_connected_fans",
    metricKey: "connected_fans",
    label: "Connected fans",
    category: "connected_fans",
    direction: "higher",
    targetValue: 28,
    unit: "count",
    note: "Fans who opted in from this show",
  },
  {
    id: "pg_brooklyn_post_show_gmv",
    metricKey: "post_show_gmv_cents",
    label: "Post-show GMV",
    category: "post_show_commerce",
    direction: "higher",
    targetValue: 4_500_00,
    unit: "cents",
    note: "Observed post-show commerce attributed to Brooklyn",
  },
  {
    id: "pg_brooklyn_activated_revenue",
    metricKey: "activated_post_show_gmv_cents",
    label: "Activated post-show revenue",
    category: "activated_revenue",
    direction: "higher",
    targetValue: 2_800_00,
    unit: "cents",
    note: "GMV from Brooklyn Encore activation drop",
  },
  {
    id: "pg_brooklyn_delivery_promise",
    metricKey: "delivery_promise_rate",
    label: "Delivery promise rate",
    category: "delivery_promise",
    direction: "higher",
    targetValue: 0.9,
    unit: "ratio",
    note: "Delivered within promise ÷ delivered orders",
  },
  {
    id: "pg_brooklyn_repeat_purchasers",
    metricKey: "repeat_purchasers",
    label: "Repeat purchasers",
    category: "connected_fans",
    direction: "higher",
    targetValue: 12,
    unit: "count",
    note: "Fans with multiple qualifying orders from this show cohort",
  },
];

export const MARISOL_BROOKLYN_PILOT_GOALS_WITH_EVENT: PilotGoalDefinition[] =
  MARISOL_BROOKLYN_PILOT_GOALS.map((goal) => ({
    ...goal,
    eventId: MARISOL_BROOKLYN_EVENT_ID,
  }));
