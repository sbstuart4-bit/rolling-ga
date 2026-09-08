ALTER TABLE "order_fulfillment_exceptions" DROP CONSTRAINT IF EXISTS "order_fulfillment_exceptions_status_check";
--> statement-breakpoint
ALTER TABLE "order_fulfillment_exceptions" ADD CONSTRAINT "order_fulfillment_exceptions_status_check" CHECK ("status" IN ('open', 'in_progress', 'resolved'));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fulfillment_exception_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"exception_id" text NOT NULL,
	"action_type" text NOT NULL,
	"note" text,
	"actor_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fulfillment_exception_actions" ADD CONSTRAINT "fulfillment_exception_actions_exception_id_order_fulfillment_exceptions_id_fk" FOREIGN KEY ("exception_id") REFERENCES "public"."order_fulfillment_exceptions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "fulfillment_exception_actions" ADD CONSTRAINT "fulfillment_exception_actions_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fulfillment_exception_actions_exception_idx" ON "fulfillment_exception_actions" USING btree ("exception_id");
