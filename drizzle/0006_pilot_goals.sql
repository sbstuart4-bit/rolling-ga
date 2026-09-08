CREATE TABLE IF NOT EXISTS "event_pilot_goals" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"metric_key" text NOT NULL,
	"label" text NOT NULL,
	"category" text NOT NULL,
	"direction" text NOT NULL,
	"target_value" integer NOT NULL,
	"unit" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "event_pilot_goals_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "event_pilot_goals_direction_check" CHECK ("direction" IN ('higher', 'lower')),
	CONSTRAINT "event_pilot_goals_unit_check" CHECK ("unit" IN ('cents', 'count', 'ratio')),
	CONSTRAINT "event_pilot_goals_category_check" CHECK ("category" IN ('digital_merch_adoption', 'connected_fans', 'post_show_commerce', 'activated_revenue', 'delivery_promise'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_pilot_goals_event_idx" ON "event_pilot_goals" USING btree ("event_id");
