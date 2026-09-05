-- Event-scoped commerce attribution for carts, checkout, and reporting.

ALTER TABLE "cart_items" ADD COLUMN "source_event_id" text;
--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_source_event_id_events_id_fk" FOREIGN KEY ("source_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "cart_items_source_event_idx" ON "cart_items" USING btree ("source_event_id");
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "commerce_source" text DEFAULT 'generic' NOT NULL;
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_commerce_source_check" CHECK ("commerce_source" IN ('generic', 'event_scoped'));
--> statement-breakpoint
CREATE INDEX "orders_commerce_source_idx" ON "orders" USING btree ("commerce_source");
