import { index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import {
  AUDIENCE_RULE_KINDS,
  type AudienceRuleKind,
  type AudienceRuleParams,
  CAMPAIGN_KINDS,
  CAMPAIGN_STATUSES,
  type CampaignChannel,
  type CampaignKind,
  type CampaignStatus,
} from "@/lib/types";
import { cents, createdAt, isDemo, jsonCol, newId, oneOf, timestampCol, updatedAt } from "./_shared";
import { audienceSegments, drops } from "./drops";
import { artists, events } from "./events";
import { users } from "./identity";

export const campaigns = pgTable(
  "campaigns",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("cmp")),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    kind: text("kind").$type<CampaignKind>().notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    channels: jsonCol<CampaignChannel[]>("channels").notNull(),
    status: text("status").$type<CampaignStatus>().notNull().default("draft"),
    eventId: text("event_id").references(() => events.id, { onDelete: "set null" }),
    dropId: text("drop_id").references(() => drops.id, { onDelete: "set null" }),
    scheduledAt: timestampCol("scheduled_at"),
    /** Set when a campaign is released but no provider exists for its channels. */
    queuedAt: timestampCol("queued_at"),
    /** Only ever set by a provider that actually accepted the send. */
    sentAt: timestampCol("sent_at"),
    /** Why the campaign is sitting in `queued` rather than `sent`. */
    queuedReason: text("queued_reason"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    isDemo: isDemo(),
  },
  (t) => [
    index("campaigns_artist_idx").on(t.artistId),
    index("campaigns_status_idx").on(t.status),
    index("campaigns_event_idx").on(t.eventId),
    oneOf("campaigns_kind_check", t.kind, CAMPAIGN_KINDS),
    oneOf("campaigns_status_check", t.status, CAMPAIGN_STATUSES),
  ],
);

export const campaignAudiences = pgTable(
  "campaign_audiences",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("cma")),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    audienceSegmentId: text("audience_segment_id").references(() => audienceSegments.id, {
      onDelete: "set null",
    }),
    /** Inline rule for one-off targeting that does not warrant a saved segment. */
    ruleKind: text("rule_kind").$type<AudienceRuleKind>(),
    params: jsonCol<AudienceRuleParams>("params"),
    /** Everyone the rule matches. */
    estimatedReach: cents("estimated_reach"),
    /** The subset that has also granted the consent each channel requires. */
    consentedReach: cents("consented_reach"),
    computedAt: timestampCol("computed_at"),
  },
  (t) => [
    index("campaign_audiences_campaign_idx").on(t.campaignId),
    oneOf("campaign_audiences_rule_kind_check", t.ruleKind, AUDIENCE_RULE_KINDS),
  ],
);
