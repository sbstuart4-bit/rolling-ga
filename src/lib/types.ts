/**
 * Cross-cutting types shared by client and server code.
 *
 * Row types are inferred from the Drizzle schema in `src/db/schema`. This file holds
 * the literal unions those columns are constrained to, so client components can reason
 * about them without importing anything that pulls in the database driver.
 */

export type StatusLevel = "green" | "yellow" | "red";

export interface TrendPoint {
  label: string;
  value: number;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

/* ------------------------------------------------------------------ *
 * Identity & access
 * ------------------------------------------------------------------ */

export const PLATFORM_ROLES = ["fan", "artist_member", "rga_admin", "fulfillment_operator"] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const ARTIST_MEMBER_ROLES = [
  "management",
  "merch_manager",
  "tour_manager",
  "ecommerce",
] as const;
export type ArtistMemberRole = (typeof ARTIST_MEMBER_ROLES)[number];

export const ROLE_LABELS: Record<PlatformRole, string> = {
  fan: "Fan",
  artist_member: "Artist Team",
  rga_admin: "Rolling GA Admin",
  fulfillment_operator: "Fulfillment Operator",
};

/* ------------------------------------------------------------------ *
 * Events
 * ------------------------------------------------------------------ */

/**
 * Derived from event timestamps rather than stored, so an event can never sit in a
 * stale state because a scheduled job did not run.
 */
export const EVENT_STATES = ["upcoming", "live", "recently_ended", "archived"] as const;
export type EventState = (typeof EVENT_STATES)[number];

export const EVENT_STATE_LABELS: Record<EventState, string> = {
  upcoming: "Upcoming",
  live: "Live now",
  recently_ended: "Recently ended",
  archived: "Archived",
};

export const VERIFICATION_METHODS = [
  "event_qr",
  "geofence",
  "staff_override",
  "ticket_barcode",
  "ticketmaster",
  "axs",
  "nfc",
  "wallet",
] as const;
export type VerificationMethod = (typeof VERIFICATION_METHODS)[number];

export const VERIFICATION_METHOD_LABELS: Record<VerificationMethod, string> = {
  event_qr: "Event QR",
  geofence: "Location confirmed",
  staff_override: "Confirmed by venue staff",
  ticket_barcode: "Ticket barcode",
  ticketmaster: "Ticketmaster",
  axs: "AXS",
  nfc: "NFC tap",
  wallet: "Mobile wallet",
};

/* ------------------------------------------------------------------ *
 * Commerce
 * ------------------------------------------------------------------ */

export const PRODUCT_ACCESS_TYPES = [
  "public",
  "verified_attendee",
  "event_specific",
  "tour_specific",
  "previous_attendee",
  "invite_vip",
  "scheduled",
] as const;
export type ProductAccessType = (typeof PRODUCT_ACCESS_TYPES)[number];

export const PRODUCT_ACCESS_LABELS: Record<ProductAccessType, string> = {
  public: "Open to everyone",
  verified_attendee: "Verified attendees only",
  event_specific: "This show only",
  tour_specific: "Tour attendees only",
  previous_attendee: "Returning attendees",
  invite_vip: "Invite only",
  scheduled: "Scheduled release",
};

export const PRODUCT_CATEGORIES = [
  "apparel",
  "headwear",
  "accessory",
  "collectible",
  "music",
  "print",
  "digital",
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const DROP_STATUSES = [
  "draft",
  "scheduled",
  "live",
  "sold_out",
  "ended",
  "archived",
] as const;
export type DropStatus = (typeof DROP_STATUSES)[number];

export const DROP_STATUS_LABELS: Record<DropStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  live: "Live",
  sold_out: "Sold out",
  ended: "Ended",
  archived: "Archived",
};

export const DROP_EXCLUSIVITY_TYPES = [
  "standard",
  "flash",
  "encore",
  "post_show",
  "anniversary",
] as const;
export type DropExclusivityType = (typeof DROP_EXCLUSIVITY_TYPES)[number];

export const DROP_EXCLUSIVITY_LABELS: Record<DropExclusivityType, string> = {
  standard: "Standard drop",
  flash: "Flash drop",
  encore: "Encore drop",
  post_show: "Post-show drop",
  anniversary: "Anniversary drop",
};

/**
 * Audience rule kinds. Each kind reads a specific parameter off `audience_segments.params`,
 * so new segmentation can be added without changing the drop or order tables.
 */
export const AUDIENCE_RULE_KINDS = [
  "all_users",
  "verified_attendees",
  "event_attendees",
  "tour_attendees",
  "previous_purchasers",
  "repeat_attendees",
  "fan_segment",
  "invite_list",
] as const;
export type AudienceRuleKind = (typeof AUDIENCE_RULE_KINDS)[number];

export const AUDIENCE_RULE_LABELS: Record<AudienceRuleKind, string> = {
  all_users: "All Rolling GA users",
  verified_attendees: "Any verified attendee",
  event_attendees: "Verified attendees of a specific show",
  tour_attendees: "Verified attendees on a tour",
  previous_purchasers: "Previous purchasers",
  repeat_attendees: "Repeat attendees",
  fan_segment: "Saved fan segment",
  invite_list: "Invite / VIP list",
};

export interface AudienceRuleParams {
  eventId?: string;
  tourId?: string;
  /** Minimum number of verified shows for `repeat_attendees`. */
  minShows?: number;
  /** Minimum lifetime spend in cents for `previous_purchasers`. */
  minLifetimeCents?: number;
  productCategory?: ProductCategory;
  apparelSize?: string;
  city?: string;
  userIds?: string[];
}

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "allocated",
  "picking",
  "packed",
  "ready_to_ship",
  "shipped",
  "delivered",
  "exception",
  "returned",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const COMMERCE_SOURCES = ["generic", "event_scoped"] as const;
export type CommerceSource = (typeof COMMERCE_SOURCES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  allocated: "Allocated",
  picking: "Picking",
  packed: "Packed",
  ready_to_ship: "Ready to ship",
  shipped: "Shipped",
  delivered: "Delivered",
  exception: "Exception",
  returned: "Returned",
  cancelled: "Cancelled",
};

/** Statuses an operator can move an order to, in the order they normally happen. */
export const ORDER_FULFILLMENT_FLOW: OrderStatus[] = [
  "paid",
  "allocated",
  "picking",
  "packed",
  "ready_to_ship",
  "shipped",
  "delivered",
];

export const ORDER_STATUS_TONE: Record<OrderStatus, StatusLevel> = {
  pending: "yellow",
  paid: "green",
  allocated: "green",
  picking: "green",
  packed: "green",
  ready_to_ship: "green",
  shipped: "green",
  delivered: "green",
  exception: "red",
  returned: "red",
  cancelled: "red",
};

/**
 * Shipping strategies. These decide how a carrier cost is split between the customer
 * and the artist; the three amounts are always stored separately on the order.
 */
export const SHIPPING_STRATEGIES = [
  "fan_pays_full",
  "artist_subsidized",
  "free_above_threshold",
  "promotional_free",
] as const;
export type ShippingStrategy = (typeof SHIPPING_STRATEGIES)[number];

export const SHIPPING_STRATEGY_LABELS: Record<ShippingStrategy, string> = {
  fan_pays_full: "Fan pays full shipping",
  artist_subsidized: "Artist subsidizes part of shipping",
  free_above_threshold: "Free shipping above a threshold",
  promotional_free: "Promotional free shipping",
};

export const SHIPPING_SPEEDS = ["standard", "expedited", "next_day"] as const;
export type ShippingSpeed = (typeof SHIPPING_SPEEDS)[number];

export const SHIPPING_SPEED_LABELS: Record<ShippingSpeed, string> = {
  standard: "Standard",
  expedited: "Expedited",
  next_day: "Next day",
};

export const PAYMENT_METHOD_KINDS = [
  "dev_test",
  "card",
  "apple_pay",
  "google_pay",
  "stored_token",
] as const;
export type PaymentMethodKind = (typeof PAYMENT_METHOD_KINDS)[number];

/* ------------------------------------------------------------------ *
 * Consent & campaigns
 * ------------------------------------------------------------------ */

export const CONSENT_TYPES = [
  "drops",
  "anniversary",
  "show_news",
  "attendee_offers",
] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];

export const CONSENT_TYPE_LABELS: Record<ConsentType, string> = {
  drops: "New drops",
  anniversary: "Anniversary releases",
  show_news: "Show news",
  attendee_offers: "Attendee-exclusive offers",
};

export const CONSENT_STATUSES = ["granted", "withdrawn"] as const;
export type ConsentStatus = (typeof CONSENT_STATUSES)[number];

export const CONSENT_SOURCES = [
  "post_verification_prompt",
  "permission_center",
  "checkout",
  "drop_unlock",
] as const;
export type ConsentSource = (typeof CONSENT_SOURCES)[number];

export const CONSENT_SOURCE_LABELS: Record<ConsentSource, string> = {
  post_verification_prompt: "After verifying attendance",
  permission_center: "Permission center",
  checkout: "Checkout",
  drop_unlock: "Unlocking a drop",
};

/** UI state for the post-show "Stay connected" prompt. */
export type StayConnectedState = "prompt" | "connected" | "dismissed";

export const CAMPAIGN_CHANNELS = ["in_app", "email", "sms"] as const;
export type CampaignChannel = (typeof CAMPAIGN_CHANNELS)[number];

export const CAMPAIGN_CHANNEL_LABELS: Record<CampaignChannel, string> = {
  in_app: "In-app",
  email: "Email",
  sms: "SMS",
};

/** Which consent a channel requires before a fan may be included in a send. */
export const CHANNEL_REQUIRED_CONSENT: Record<CampaignChannel, ConsentType | null> = {
  in_app: null,
  email: "show_news",
  sms: "show_news",
};

export const CAMPAIGN_KINDS = [
  "pre_show_preview",
  "show_unlock",
  "flash_drop",
  "post_show_message",
  "anniversary_drop",
  "product_alert",
] as const;
export type CampaignKind = (typeof CAMPAIGN_KINDS)[number];

export const CAMPAIGN_KIND_LABELS: Record<CampaignKind, string> = {
  pre_show_preview: "Pre-show preview",
  show_unlock: "Show unlock",
  flash_drop: "Flash drop",
  post_show_message: "Post-show message",
  anniversary_drop: "Anniversary drop",
  product_alert: "Product alert",
};

/**
 * `queued` means the campaign is ready but no provider is configured for the channel.
 * Nothing is ever marked `sent` unless a provider actually accepted it.
 */
export const CAMPAIGN_STATUSES = ["draft", "scheduled", "queued", "sent", "cancelled"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  queued: "Queued — provider not configured",
  sent: "Sent",
  cancelled: "Cancelled",
};

/* ------------------------------------------------------------------ *
 * Content & theming
 * ------------------------------------------------------------------ */

export const EVENT_CONTENT_KINDS = [
  "artist_message",
  "photo",
  "setlist",
  "video_link",
  "thank_you",
] as const;
export type EventContentKind = (typeof EVENT_CONTENT_KINDS)[number];

export const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export type ApparelSize = (typeof APPAREL_SIZES)[number];
