--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "production_work" (
	"id" text PRIMARY KEY NOT NULL,
	"order_item_id" text NOT NULL,
	"order_id" text NOT NULL,
	"artist_id" text NOT NULL,
	"event_id" text,
	"product_id" text,
	"variant_id" text,
	"unit_index" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"requirement_mode" text DEFAULT 'on_demand' NOT NULL,
	"name_snapshot" text NOT NULL,
	"size_snapshot" text,
	"queued_at" timestamp NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "production_work" ADD CONSTRAINT "production_work_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "production_work" ADD CONSTRAINT "production_work_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "production_work" ADD CONSTRAINT "production_work_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "production_work" ADD CONSTRAINT "production_work_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "production_work" ADD CONSTRAINT "production_work_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "production_work" ADD CONSTRAINT "production_work_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "production_work_item_unit_unique" ON "production_work" USING btree ("order_item_id","unit_index");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_work_order_idx" ON "production_work" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_work_event_idx" ON "production_work" USING btree ("event_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_work_status_idx" ON "production_work" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "production_work_variant_idx" ON "production_work" USING btree ("variant_id");
--> statement-breakpoint
ALTER TABLE "production_work" ADD CONSTRAINT "production_work_status_check" CHECK ("status" IN ('queued', 'in_production', 'complete'));
--> statement-breakpoint
ALTER TABLE "production_work" ADD CONSTRAINT "production_work_mode_check" CHECK ("requirement_mode" IN ('on_demand', 'stocked'));
