CREATE TABLE IF NOT EXISTS "event_show_economics" (
  "event_id" text PRIMARY KEY NOT NULL REFERENCES "events"("id") ON DELETE cascade,
  "platform_fee_basis_points" integer DEFAULT 500 NOT NULL,
  "digital_venue_commission_treatment" text DEFAULT 'UNKNOWN' NOT NULL,
  "digital_venue_commission_percent" integer,
  "physical_merch_gmv_cents" integer,
  "units_brought" integer,
  "units_sold" integer,
  "stockout_count" integer,
  "physical_venue_commission_treatment" text DEFAULT 'UNKNOWN' NOT NULL,
  "physical_venue_commission_percent" integer,
  "labor_cost_cents" integer,
  "other_physical_cost_cents" integer,
  "physical_product_cost_cents" integer,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "is_demo" boolean DEFAULT false NOT NULL,
  CONSTRAINT "event_show_economics_digital_venue_treatment_check" CHECK ("digital_venue_commission_treatment" IN ('INCLUDED', 'EXCLUDED', 'UNKNOWN')),
  CONSTRAINT "event_show_economics_physical_venue_treatment_check" CHECK ("physical_venue_commission_treatment" IN ('INCLUDED', 'EXCLUDED', 'UNKNOWN'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_show_economics_event_idx" ON "event_show_economics" ("event_id");
