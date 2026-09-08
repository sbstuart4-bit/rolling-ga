ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "fulfillment_status" text;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "promised_delivery_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "actual_delivered_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "fulfillment_received_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "production_started_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "fulfillment_packed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "fulfillment_shipped_at" timestamp with time zone;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_fulfillment_exceptions" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"is_demo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "order_fulfillment_exceptions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "order_fulfillment_exceptions_type_check" CHECK ("type" IN ('production_delay', 'address_issue', 'item_unavailable', 'carrier_delay', 'delivery_failed', 'other')),
	CONSTRAINT "order_fulfillment_exceptions_status_check" CHECK ("status" IN ('open', 'resolved'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_fulfillment_exceptions_order_idx" ON "order_fulfillment_exceptions" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_fulfillment_status_idx" ON "orders" USING btree ("fulfillment_status");
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_fulfillment_status_check";
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_fulfillment_status_check" CHECK ("fulfillment_status" IS NULL OR "fulfillment_status" IN ('received', 'production', 'packed', 'shipped', 'delivered', 'exception'));
