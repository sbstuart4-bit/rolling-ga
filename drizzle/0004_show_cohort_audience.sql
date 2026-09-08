ALTER TABLE "audience_segments" DROP CONSTRAINT "audience_segments_rule_kind_check";
--> statement-breakpoint
ALTER TABLE "audience_segments" ADD CONSTRAINT "audience_segments_rule_kind_check" CHECK ("rule_kind" IN ('all_users', 'verified_attendees', 'event_attendees', 'tour_attendees', 'previous_purchasers', 'repeat_attendees', 'fan_segment', 'invite_list', 'show_cohort'));
