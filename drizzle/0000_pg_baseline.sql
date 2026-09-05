CREATE TABLE "artist_members" (
	"id" text PRIMARY KEY NOT NULL,
	"artist_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"can_publish" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "artist_members_role_check" CHECK ("role" IN ('management', 'merch_manager', 'tour_manager', 'ecommerce'))
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"active_artist_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_role_check" CHECK ("role" IN ('fan', 'artist_member', 'rga_admin', 'fulfillment_operator'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artist_brand" (
	"artist_id" text PRIMARY KEY NOT NULL,
	"logo_url" text,
	"hero_image_url" text,
	"background" text,
	"surface" text,
	"foreground" text,
	"muted_foreground" text,
	"accent" text,
	"accent_foreground" text,
	"accent_secondary" text,
	"border" text,
	"font_id" text,
	"merch_photography_note" text,
	"show_messaging" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_content" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"kind" text NOT NULL,
	"title" text,
	"body" text,
	"media_url" text,
	"attendees_only" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "event_content_kind_check" CHECK ("kind" IN ('artist_message', 'photo', 'setlist', 'video_link', 'thank_you'))
);
--> statement-breakpoint
CREATE TABLE "event_themes" (
	"event_id" text PRIMARY KEY NOT NULL,
	"city_artwork_url" text,
	"hero_image_url" text,
	"logo_url" text,
	"background" text,
	"surface" text,
	"foreground" text,
	"muted_foreground" text,
	"accent" text,
	"accent_foreground" text,
	"accent_secondary" text,
	"border" text,
	"font_id" text,
	"show_messaging" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_verification_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"token" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"rotated_from_id" text,
	"is_demo" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"artist_id" text NOT NULL,
	"tour_id" text NOT NULL,
	"venue_id" text NOT NULL,
	"slug" text NOT NULL,
	"title" text,
	"doors_at" timestamp with time zone,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"timezone" text NOT NULL,
	"expected_attendance" integer,
	"actual_attendance" integer,
	"local_message" text,
	"post_show_window_minutes" integer,
	"verification_opens_at" timestamp with time zone,
	"verification_closes_at" timestamp with time zone,
	"cancelled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tours" (
	"id" text PRIMARY KEY NOT NULL,
	"artist_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"year" integer,
	"logo_url" text,
	"hero_image_url" text,
	"artwork_url" text,
	"background" text,
	"surface" text,
	"foreground" text,
	"muted_foreground" text,
	"accent" text,
	"accent_foreground" text,
	"accent_secondary" text,
	"border" text,
	"font_id" text,
	"show_messaging" text,
	"post_show_window_minutes" integer DEFAULT 480 NOT NULL,
	"shipping_strategy" text DEFAULT 'fan_pays_full' NOT NULL,
	"free_shipping_threshold_cents" integer,
	"shipping_subsidy_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "tours_shipping_strategy_check" CHECK ("shipping_strategy" IN ('fan_pays_full', 'artist_subsidized', 'free_above_threshold', 'promotional_free'))
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"region" text,
	"country" text DEFAULT 'US' NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"timezone" text NOT NULL,
	"geofence_radius_meters" integer DEFAULT 400 NOT NULL,
	"capacity" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artist_consents" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"artist_id" text NOT NULL,
	"consent_type" text NOT NULL,
	"status" text NOT NULL,
	"source" text NOT NULL,
	"granted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "artist_consents_consent_type_check" CHECK ("consent_type" IN ('drops', 'anniversary', 'show_news', 'attendee_offers')),
	CONSTRAINT "artist_consents_status_check" CHECK ("status" IN ('granted', 'withdrawn')),
	CONSTRAINT "artist_consents_source_check" CHECK ("source" IN ('post_verification_prompt', 'permission_center', 'checkout', 'drop_unlock'))
);
--> statement-breakpoint
CREATE TABLE "fan_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"apparel_size" text,
	"preferred_categories" jsonb,
	"shipping_name" text,
	"shipping_line1" text,
	"shipping_line2" text,
	"shipping_city" text,
	"shipping_region" text,
	"shipping_postal_code" text,
	"shipping_country" text,
	"shipping_phone" text,
	"notify_drops" boolean DEFAULT true NOT NULL,
	"notify_anniversary" boolean DEFAULT true NOT NULL,
	"notify_show_news" boolean DEFAULT false NOT NULL,
	"personalized_recommendations" boolean DEFAULT true NOT NULL,
	"lifetime_spend_cents" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text,
	"user_id" uuid,
	"method" text NOT NULL,
	"succeeded" boolean NOT NULL,
	"failure_reason" text,
	"client_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "verification_attempts_method_check" CHECK ("method" IN ('event_qr', 'geofence', 'staff_override', 'ticket_barcode', 'ticketmaster', 'axs', 'nfc', 'wallet'))
);
--> statement-breakpoint
CREATE TABLE "verified_attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" text NOT NULL,
	"method" text NOT NULL,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"token_id" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "verified_attendance_method_check" CHECK ("method" IN ('event_qr', 'geofence', 'staff_override', 'ticket_barcode', 'ticketmaster', 'axs', 'nfc', 'wallet'))
);
--> statement-breakpoint
CREATE TABLE "bundle_items" (
	"id" text PRIMARY KEY NOT NULL,
	"bundle_id" text NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bundles" (
	"id" text PRIMARY KEY NOT NULL,
	"artist_id" text NOT NULL,
	"tour_id" text,
	"event_id" text,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"bundle_price_cents" integer NOT NULL,
	"access_type" text DEFAULT 'public' NOT NULL,
	"available_from" timestamp with time zone,
	"available_until" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "bundles_access_type_check" CHECK ("access_type" IN ('public', 'verified_attendee', 'event_specific', 'tour_specific', 'previous_attendee', 'invite_vip', 'scheduled'))
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"variant_id" text PRIMARY KEY NOT NULL,
	"on_hand" integer DEFAULT 0 NOT NULL,
	"reserved" integer DEFAULT 0 NOT NULL,
	"reorder_point" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"sku" text NOT NULL,
	"size" text,
	"color" text,
	"price_delta_cents" integer DEFAULT 0 NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"artist_id" text NOT NULL,
	"tour_id" text,
	"event_id" text,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tagline" text,
	"story" text,
	"category" text NOT NULL,
	"access_type" text DEFAULT 'public' NOT NULL,
	"available_from" timestamp with time zone,
	"available_until" timestamp with time zone,
	"base_price_cents" integer NOT NULL,
	"unit_cost_cents" integer,
	"sku" text NOT NULL,
	"images" jsonb,
	"produced_quantity" integer,
	"is_digital" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "products_category_check" CHECK ("category" IN ('apparel', 'headwear', 'accessory', 'collectible', 'music', 'print', 'digital')),
	CONSTRAINT "products_access_type_check" CHECK ("access_type" IN ('public', 'verified_attendee', 'event_specific', 'tour_specific', 'previous_attendee', 'invite_vip', 'scheduled'))
);
--> statement-breakpoint
CREATE TABLE "audience_segments" (
	"id" text PRIMARY KEY NOT NULL,
	"artist_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"rule_kind" text NOT NULL,
	"params" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "audience_segments_rule_kind_check" CHECK ("rule_kind" IN ('all_users', 'verified_attendees', 'event_attendees', 'tour_attendees', 'previous_purchasers', 'repeat_attendees', 'fan_segment', 'invite_list'))
);
--> statement-breakpoint
CREATE TABLE "drop_products" (
	"id" text PRIMARY KEY NOT NULL,
	"drop_id" text NOT NULL,
	"product_id" text NOT NULL,
	"drop_price_cents" integer,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drops" (
	"id" text PRIMARY KEY NOT NULL,
	"artist_id" text NOT NULL,
	"tour_id" text,
	"event_id" text,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"artwork_url" text,
	"audience_segment_id" text,
	"quantity_limit" integer,
	"quantity_sold" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"status" text DEFAULT 'draft' NOT NULL,
	"display_priority" integer DEFAULT 0 NOT NULL,
	"notifications_enabled" boolean DEFAULT false NOT NULL,
	"exclusivity_type" text DEFAULT 'standard' NOT NULL,
	"anniversary_of_event_id" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "drops_status_check" CHECK ("status" IN ('draft', 'scheduled', 'live', 'sold_out', 'ended', 'archived')),
	CONSTRAINT "drops_exclusivity_type_check" CHECK ("exclusivity_type" IN ('standard', 'flash', 'encore', 'post_show', 'anniversary'))
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" text PRIMARY KEY NOT NULL,
	"cart_id" text NOT NULL,
	"product_id" text,
	"variant_id" text,
	"bundle_id" text,
	"drop_id" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"bundle_selections" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "carts_status_check" CHECK ("status" IN ('active', 'converted', 'abandoned'))
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text,
	"variant_id" text,
	"bundle_id" text,
	"drop_id" text,
	"name_snapshot" text NOT NULL,
	"size_snapshot" text,
	"image_snapshot" text,
	"quantity" integer NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"unit_cost_cents" integer
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"user_id" uuid NOT NULL,
	"artist_id" text NOT NULL,
	"event_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"tax_cents" integer DEFAULT 0 NOT NULL,
	"shipping_carrier_cost_cents" integer DEFAULT 0 NOT NULL,
	"shipping_customer_charge_cents" integer DEFAULT 0 NOT NULL,
	"shipping_artist_subsidy_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"shipping_option_id" text,
	"shipping_method_label" text,
	"estimated_delivery_from" timestamp with time zone,
	"estimated_delivery_to" timestamp with time zone,
	"shipping_name" text,
	"shipping_line1" text,
	"shipping_line2" text,
	"shipping_city" text,
	"shipping_region" text,
	"shipping_postal_code" text,
	"shipping_country" text,
	"payment_provider" text,
	"payment_method_kind" text,
	"payment_reference" text,
	"placed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "orders_status_check" CHECK ("status" IN ('pending', 'paid', 'allocated', 'picking', 'packed', 'ready_to_ship', 'shipped', 'delivered', 'exception', 'returned', 'cancelled')),
	CONSTRAINT "orders_payment_method_kind_check" CHECK ("payment_method_kind" IN ('dev_test', 'card', 'apple_pay', 'google_pay', 'stored_token'))
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"carrier" text,
	"service" text,
	"tracking_number" text,
	"tracking_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"label_purchased" boolean DEFAULT false NOT NULL,
	"carrier_reference" text,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"exception_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "shipments_status_check" CHECK ("status" IN ('pending', 'label_required', 'in_transit', 'delivered', 'exception'))
);
--> statement-breakpoint
CREATE TABLE "shipping_options" (
	"id" text PRIMARY KEY NOT NULL,
	"artist_id" text,
	"tour_id" text,
	"event_id" text,
	"name" text NOT NULL,
	"speed" text DEFAULT 'standard' NOT NULL,
	"carrier" text,
	"service" text,
	"carrier_cost_cents" integer NOT NULL,
	"base_customer_charge_cents" integer NOT NULL,
	"strategy" text DEFAULT 'fan_pays_full' NOT NULL,
	"free_threshold_cents" integer,
	"subsidy_cents" integer DEFAULT 0 NOT NULL,
	"delivery_min_days" integer DEFAULT 3 NOT NULL,
	"delivery_max_days" integer DEFAULT 7 NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "shipping_options_speed_check" CHECK ("speed" IN ('standard', 'expedited', 'next_day')),
	CONSTRAINT "shipping_options_strategy_check" CHECK ("strategy" IN ('fan_pays_full', 'artist_subsidized', 'free_above_threshold', 'promotional_free'))
);
--> statement-breakpoint
CREATE TABLE "campaign_audiences" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"audience_segment_id" text,
	"rule_kind" text,
	"params" jsonb,
	"estimated_reach" integer,
	"consented_reach" integer,
	"computed_at" timestamp with time zone,
	CONSTRAINT "campaign_audiences_rule_kind_check" CHECK ("rule_kind" IN ('all_users', 'verified_attendees', 'event_attendees', 'tour_attendees', 'previous_purchasers', 'repeat_attendees', 'fan_segment', 'invite_list'))
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"artist_id" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"channels" jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"event_id" text,
	"drop_id" text,
	"scheduled_at" timestamp with time zone,
	"queued_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"queued_reason" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "campaigns_kind_check" CHECK ("kind" IN ('pre_show_preview', 'show_unlock', 'flash_drop', 'post_show_message', 'anniversary_drop', 'product_alert')),
	CONSTRAINT "campaigns_status_check" CHECK ("status" IN ('draft', 'scheduled', 'queued', 'sent', 'cancelled'))
);
--> statement-breakpoint
ALTER TABLE "artist_members" ADD CONSTRAINT "artist_members_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_members" ADD CONSTRAINT "artist_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_brand" ADD CONSTRAINT "artist_brand_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_content" ADD CONSTRAINT "event_content_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_themes" ADD CONSTRAINT "event_themes_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_verification_tokens" ADD CONSTRAINT "event_verification_tokens_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tours" ADD CONSTRAINT "tours_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_consents" ADD CONSTRAINT "artist_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_consents" ADD CONSTRAINT "artist_consents_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fan_preferences" ADD CONSTRAINT "fan_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_attempts" ADD CONSTRAINT "verification_attempts_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_attempts" ADD CONSTRAINT "verification_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verified_attendance" ADD CONSTRAINT "verified_attendance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verified_attendance" ADD CONSTRAINT "verified_attendance_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verified_attendance" ADD CONSTRAINT "verified_attendance_token_id_event_verification_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."event_verification_tokens"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_bundle_id_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."bundles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundles" ADD CONSTRAINT "bundles_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundles" ADD CONSTRAINT "bundles_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundles" ADD CONSTRAINT "bundles_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audience_segments" ADD CONSTRAINT "audience_segments_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drop_products" ADD CONSTRAINT "drop_products_drop_id_drops_id_fk" FOREIGN KEY ("drop_id") REFERENCES "public"."drops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drop_products" ADD CONSTRAINT "drop_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drops" ADD CONSTRAINT "drops_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drops" ADD CONSTRAINT "drops_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drops" ADD CONSTRAINT "drops_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drops" ADD CONSTRAINT "drops_audience_segment_id_audience_segments_id_fk" FOREIGN KEY ("audience_segment_id") REFERENCES "public"."audience_segments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drops" ADD CONSTRAINT "drops_anniversary_of_event_id_events_id_fk" FOREIGN KEY ("anniversary_of_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_bundle_id_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."bundles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_drop_id_drops_id_fk" FOREIGN KEY ("drop_id") REFERENCES "public"."drops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_bundle_id_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."bundles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_drop_id_drops_id_fk" FOREIGN KEY ("drop_id") REFERENCES "public"."drops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_option_id_shipping_options_id_fk" FOREIGN KEY ("shipping_option_id") REFERENCES "public"."shipping_options"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_options" ADD CONSTRAINT "shipping_options_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_options" ADD CONSTRAINT "shipping_options_tour_id_tours_id_fk" FOREIGN KEY ("tour_id") REFERENCES "public"."tours"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_options" ADD CONSTRAINT "shipping_options_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_audiences" ADD CONSTRAINT "campaign_audiences_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_audiences" ADD CONSTRAINT "campaign_audiences_audience_segment_id_audience_segments_id_fk" FOREIGN KEY ("audience_segment_id") REFERENCES "public"."audience_segments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_drop_id_drops_id_fk" FOREIGN KEY ("drop_id") REFERENCES "public"."drops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "artist_members_artist_user_unique" ON "artist_members" USING btree ("artist_id","user_id");--> statement-breakpoint
CREATE INDEX "artist_members_artist_idx" ON "artist_members" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "artist_members_user_idx" ON "artist_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_roles_user_role_unique" ON "user_roles" USING btree ("user_id","role");--> statement-breakpoint
CREATE INDEX "user_roles_user_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "artists_slug_unique" ON "artists" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "event_content_event_idx" ON "event_content" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_verification_tokens_token_unique" ON "event_verification_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "event_verification_tokens_event_idx" ON "event_verification_tokens" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "events_slug_unique" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "events_artist_idx" ON "events" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "events_tour_idx" ON "events" USING btree ("tour_id");--> statement-breakpoint
CREATE INDEX "events_venue_idx" ON "events" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "events_starts_at_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tours_artist_slug_unique" ON "tours" USING btree ("artist_id","slug");--> statement-breakpoint
CREATE INDEX "tours_artist_idx" ON "tours" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "venues_city_idx" ON "venues" USING btree ("city");--> statement-breakpoint
CREATE UNIQUE INDEX "artist_consents_user_artist_type_unique" ON "artist_consents" USING btree ("user_id","artist_id","consent_type");--> statement-breakpoint
CREATE INDEX "artist_consents_artist_status_idx" ON "artist_consents" USING btree ("artist_id","status");--> statement-breakpoint
CREATE INDEX "artist_consents_user_idx" ON "artist_consents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_attempts_user_idx" ON "verification_attempts" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "verification_attempts_client_idx" ON "verification_attempts" USING btree ("client_hash","created_at");--> statement-breakpoint
CREATE INDEX "verification_attempts_event_idx" ON "verification_attempts" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "verified_attendance_user_event_unique" ON "verified_attendance" USING btree ("user_id","event_id");--> statement-breakpoint
CREATE INDEX "verified_attendance_user_idx" ON "verified_attendance" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verified_attendance_event_idx" ON "verified_attendance" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "verified_attendance_verified_at_idx" ON "verified_attendance" USING btree ("verified_at");--> statement-breakpoint
CREATE INDEX "bundle_items_bundle_idx" ON "bundle_items" USING btree ("bundle_id");--> statement-breakpoint
CREATE INDEX "bundle_items_product_idx" ON "bundle_items" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bundles_artist_slug_unique" ON "bundles" USING btree ("artist_id","slug");--> statement-breakpoint
CREATE INDEX "bundles_artist_idx" ON "bundles" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "bundles_event_idx" ON "bundles" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "inventory_on_hand_idx" ON "inventory" USING btree ("on_hand");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_sku_unique" ON "product_variants" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "product_variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_artist_slug_unique" ON "products" USING btree ("artist_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "products_sku_unique" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "products_artist_idx" ON "products" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "products_event_idx" ON "products" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "products_tour_idx" ON "products" USING btree ("tour_id");--> statement-breakpoint
CREATE INDEX "products_access_type_idx" ON "products" USING btree ("access_type");--> statement-breakpoint
CREATE INDEX "audience_segments_artist_idx" ON "audience_segments" USING btree ("artist_id");--> statement-breakpoint
CREATE UNIQUE INDEX "drop_products_drop_product_unique" ON "drop_products" USING btree ("drop_id","product_id");--> statement-breakpoint
CREATE INDEX "drop_products_drop_idx" ON "drop_products" USING btree ("drop_id");--> statement-breakpoint
CREATE INDEX "drop_products_product_idx" ON "drop_products" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "drops_artist_slug_unique" ON "drops" USING btree ("artist_id","slug");--> statement-breakpoint
CREATE INDEX "drops_artist_idx" ON "drops" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "drops_event_idx" ON "drops" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "drops_status_idx" ON "drops" USING btree ("status");--> statement-breakpoint
CREATE INDEX "drops_window_idx" ON "drops" USING btree ("starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "cart_items_cart_idx" ON "cart_items" USING btree ("cart_id");--> statement-breakpoint
CREATE INDEX "cart_items_variant_idx" ON "cart_items" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "carts_user_status_idx" ON "carts" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "order_items_variant_idx" ON "order_items" USING btree ("variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_number_unique" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_artist_idx" ON "orders" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "orders_event_idx" ON "orders" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_placed_at_idx" ON "orders" USING btree ("placed_at");--> statement-breakpoint
CREATE INDEX "shipments_order_idx" ON "shipments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "shipments_status_idx" ON "shipments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "shipping_options_artist_idx" ON "shipping_options" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "shipping_options_event_idx" ON "shipping_options" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "shipping_options_tour_idx" ON "shipping_options" USING btree ("tour_id");--> statement-breakpoint
CREATE INDEX "campaign_audiences_campaign_idx" ON "campaign_audiences" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaigns_artist_idx" ON "campaigns" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "campaigns_status_idx" ON "campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "campaigns_event_idx" ON "campaigns" USING btree ("event_id");