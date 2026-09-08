ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "packing_started_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "ready_for_handoff_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "handed_to_carrier_at" timestamp with time zone;
