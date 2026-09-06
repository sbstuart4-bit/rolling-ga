export type MerchExperiencePhase =
  | "pre_early"
  | "pre_mid"
  | "pre_late"
  | "pre_tminus_1"
  | "show_day_outside"
  | "live_inside"
  | "live_headliner"
  | "encore"
  | "show_ended_attended"
  | "post_day_1"
  | "post_day_2"
  | "post_archived";

export type MerchVisibility = "hidden" | "teaser" | "visible";

export type ShowExclusiveTreatment =
  | "hidden"
  | "teaser"
  | "visible_locked"
  | "unlocked"
  | "live_drop"
  | "last_chance"
  | "closed"
  | "history_only";

export interface MerchExperienceState {
  phase: MerchExperiencePhase;
  coreMerchVisible: boolean;
  coreMerchPurchasable: boolean;
  showExclusiveVisibility: MerchVisibility;
  showExclusiveTreatment: ShowExclusiveTreatment;
  showExclusivePurchasable: boolean;
  liveDropVisible: boolean;
  liveDropPurchasable: boolean;
  relationshipTreatment: string | null;
  primaryMessage: string;
  /** Diagnostic copy for /demo only. */
  reason: string;
  /** True when a manual merch override is active (not AUTO). */
  merchOverrideActive: boolean;
  /** True when fan has attendance credential for this show (not "I'm Going"). */
  hasAttendanceCredential: boolean;
  /** True when venue presence would unlock live show merch. */
  venuePresenceActive: boolean;
  /** True when fan holds a post-show credential (attended or returning fan after the show). */
  holdsShowCredential: boolean;
}
