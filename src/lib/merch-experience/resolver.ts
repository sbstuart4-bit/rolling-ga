import type { MerchExperiencePhase, MerchExperienceState, MerchVisibility, ShowExclusiveTreatment } from "./types";
import type { DemoShowDefinition } from "@/lib/demo-scenario/shows";

import { DEFAULT_POST_SHOW_WINDOW_MINUTES } from "@/lib/event-state";
import type {
  DemoFanHistory,
  DemoFanState,
  DemoLocationState,
  DemoMerchRule,
  DemoPurchaseHistory,
  DemoTimePhase,
} from "@/lib/demo-scenario/types";

export interface MerchExperienceInput {
  now: Date;
  show: DemoShowDefinition;
  timePhase: DemoTimePhase;
  fanState: DemoFanState;
  location: DemoLocationState;
  fanHistory: DemoFanHistory;
  purchaseHistory: DemoPurchaseHistory;
  merchRule: DemoMerchRule;
}

export type { MerchExperienceState } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function fanStateHasAttendanceCredential(fanState: DemoFanState): boolean {
  return fanState === "attended";
}

export function fanStateIsGoing(fanState: DemoFanState): boolean {
  return fanState === "going";
}

/** Venue presence unlocks live show merch — separate from attendance credential. */
export function isVenuePresenceActive(
  timePhase: DemoTimePhase,
  location: DemoLocationState,
): boolean {
  const livePhases: DemoTimePhase[] = [
    "doors_open",
    "pre_show",
    "between_acts",
    "headliner",
    "encore",
    "show_ended",
  ];
  return livePhases.includes(timePhase) && location === "inside_venue";
}

function relationshipMessage(
  fanState: DemoFanState,
  fanHistory: DemoFanHistory,
  artistName: string,
  city: string,
): string | null {
  if (fanState === "going") {
    return `Coming to ${city}`;
  }
  if (fanState === "returning_fan" || fanHistory !== "first_show") {
    if (fanHistory === "second_show") return "Welcome back · Show #2";
    if (fanHistory === "three_shows") return "Welcome back · Show #3";
    if (fanHistory === "five_shows") return "5 shows · 3 cities";
    if (fanHistory === "ten_shows") return "10 shows · Connected fan";
  }
  if (fanHistory === "first_show" && fanState === "unknown") {
    return `First time seeing ${artistName}`;
  }
  return null;
}

function resolvePhaseFromTime(
  show: DemoShowDefinition,
  timePhase: DemoTimePhase,
  now: Date,
): MerchExperiencePhase {
  const postShowClose = new Date(
    show.endsAt.getTime() + DEFAULT_POST_SHOW_WINDOW_MINUTES * 60_000,
  );

  if (timePhase === "t_plus_2" || timePhase === "t_plus_7" || timePhase === "t_plus_30") {
    return "post_archived";
  }
  if (timePhase === "t_plus_1") return "post_day_1";
  if (timePhase === "show_ended") return "show_ended_attended";
  if (timePhase === "encore") return "encore";
  if (timePhase === "headliner") return "live_headliner";
  if (
    timePhase === "doors_open" ||
    timePhase === "pre_show" ||
    timePhase === "between_acts"
  ) {
    return "live_inside";
  }
  if (timePhase === "show_day_morning" || timePhase === "t_minus_3_hours") {
    return "show_day_outside";
  }
  if (timePhase === "t_minus_1") return "pre_tminus_1";
  if (timePhase === "t_minus_7" || timePhase === "t_minus_14") {
    return timePhase === "t_minus_14" ? "pre_mid" : "pre_late";
  }
  if (timePhase === "t_minus_30") return "pre_early";

  // Fallback from timestamps if phase is unknown
  if (now.getTime() > postShowClose.getTime() + DAY_MS) return "post_archived";
  if (now.getTime() > show.endsAt.getTime() + DAY_MS) return "post_day_1";
  if (now.getTime() > show.endsAt.getTime()) return "show_ended_attended";
  if (now.getTime() >= show.doorsAt.getTime()) return "live_inside";
  return "pre_late";
}

function applyMerchRuleOverride(
  rule: DemoMerchRule,
  base: MerchExperienceState,
): MerchExperienceState {
  if (rule === "auto") return base;

  const overridden: MerchExperienceState = {
    ...base,
    merchOverrideActive: true,
    reason: `Manual merch override: ${rule.replace(/_/g, " ")}.`,
  };

  switch (rule) {
    case "teaser":
      return {
        ...overridden,
        showExclusiveVisibility: "teaser",
        showExclusiveTreatment: "teaser",
        showExclusivePurchasable: false,
        primaryMessage: `Something exclusive is coming to ${base.primaryMessage.includes("Detroit") ? "Detroit" : "this city"}.`,
      };
    case "visible_locked":
      return {
        ...overridden,
        showExclusiveVisibility: "visible",
        showExclusiveTreatment: "visible_locked",
        showExclusivePurchasable: false,
        primaryMessage: "Unlocks at the show",
      };
    case "unlocked":
      return {
        ...overridden,
        showExclusiveVisibility: "visible",
        showExclusiveTreatment: "unlocked",
        showExclusivePurchasable: true,
        primaryMessage: "You're here · Tonight's drop is unlocked",
      };
    case "live_drop":
      return {
        ...overridden,
        liveDropVisible: true,
        liveDropPurchasable: true,
        showExclusiveTreatment: "live_drop",
        primaryMessage: "Just unlocked · Available to fans here tonight",
      };
    case "last_chance":
      return {
        ...overridden,
        showExclusiveTreatment: "last_chance",
        showExclusivePurchasable: base.hasAttendanceCredential,
        primaryMessage: "Last chance · 24 hours left",
      };
    case "closed":
      return {
        ...overridden,
        showExclusiveTreatment: "closed",
        showExclusivePurchasable: false,
        primaryMessage: "Show exclusive — closed",
      };
    default:
      return overridden;
  }
}

/**
 * Central merch-experience resolver for the demo scenario engine.
 * Fan-facing pages read this state rather than scattering time checks in components.
 */
export function resolveMerchExperience(input: MerchExperienceInput): MerchExperienceState {
  const {
    now,
    show,
    timePhase,
    fanState,
    location,
    fanHistory,
    merchRule,
  } = input;

  const hasAttendanceCredential = fanStateHasAttendanceCredential(fanState);
  const holdsShowCredential = hasAttendanceCredential;
  const venuePresenceActive = isVenuePresenceActive(timePhase, location);
  const phase = resolvePhaseFromTime(show, timePhase, now);
  const relationshipTreatment = relationshipMessage(
    fanState,
    fanHistory,
    show.artistName,
    show.city,
  );

  let state: MerchExperienceState = {
    phase,
    coreMerchVisible: true,
    coreMerchPurchasable: true,
    showExclusiveVisibility: "hidden",
    showExclusiveTreatment: "hidden",
    showExclusivePurchasable: false,
    liveDropVisible: false,
    liveDropPurchasable: false,
    relationshipTreatment,
    primaryMessage: "",
    reason: "",
    merchOverrideActive: false,
    hasAttendanceCredential,
    venuePresenceActive,
    holdsShowCredential,
  };

  switch (phase) {
    case "pre_early":
      state.coreMerchVisible = false;
      state.coreMerchPurchasable = false;
      state.showExclusiveVisibility = "teaser";
      state.showExclusiveTreatment = "teaser";
      state.primaryMessage = `Something exclusive is coming to ${show.city}.`;
      state.reason =
        "T-30: discover the show only — no merch yet; exclusives teased.";
      break;

    case "pre_mid":
      state.coreMerchVisible = true;
      state.coreMerchPurchasable = true;
      state.showExclusiveVisibility = "visible";
      state.showExclusiveTreatment = "visible_locked";
      state.primaryMessage = "Available at the show";
      state.reason =
        "T-14 to T-8: core tour merch opens; selected show exclusives visible but locked.";
      break;

    case "pre_late":
      state.showExclusiveVisibility = "visible";
      state.showExclusiveTreatment = "visible_locked";
      state.primaryMessage = "Unlocks at the show";
      state.reason = "T-7 to T-2: show exclusives fully visible but locked.";
      break;

    case "pre_tminus_1":
      state.showExclusiveVisibility = "visible";
      state.showExclusiveTreatment = "visible_locked";
      state.primaryMessage = "Unlocks tomorrow";
      state.reason = "T-1: full collection visible so fans can plan before arriving.";
      break;

    case "show_day_outside":
      state.showExclusiveVisibility = "visible";
      state.showExclusiveTreatment = "visible_locked";
      state.primaryMessage = "Unlocks at the show";
      state.reason =
        "Show day before venue: exclusives visible but venue presence has not been established.";
      break;

    case "live_inside":
      state.showExclusiveVisibility = "visible";
      if (venuePresenceActive) {
        state.showExclusiveTreatment = "unlocked";
        state.showExclusivePurchasable = true;
        state.primaryMessage = "You're here · Tonight's drop is unlocked";
        state.reason =
          "Doors open with inside-venue presence: show exclusives unlocked and purchasable.";
      } else {
        state.showExclusiveTreatment = "visible_locked";
        state.primaryMessage = "Unlocks at the show";
        state.reason =
          "Live window but outside venue: show exclusives remain locked.";
      }
      break;

    case "live_headliner":
      state.showExclusiveVisibility = "visible";
      if (venuePresenceActive) {
        state.showExclusiveTreatment = "unlocked";
        state.showExclusivePurchasable = true;
        state.primaryMessage = "Tonight";
        state.reason =
          "Headliner: merch stays available without aggressive merchandising.";
      } else {
        state.showExclusiveTreatment = "visible_locked";
        state.primaryMessage = "Unlocks at the show";
        state.reason = "Headliner outside venue: exclusives remain locked.";
      }
      break;

    case "encore":
      state.showExclusiveVisibility = "visible";
      if (venuePresenceActive && show.hasEncoreDrop) {
        state.liveDropVisible = true;
        state.liveDropPurchasable = true;
        state.showExclusiveTreatment = "live_drop";
        state.showExclusivePurchasable = true;
        state.primaryMessage = "Just unlocked · Available to fans here tonight";
        state.reason = "Encore live drop for fans inside the venue.";
      } else if (venuePresenceActive) {
        state.showExclusiveTreatment = "unlocked";
        state.showExclusivePurchasable = true;
        state.primaryMessage = "Tonight's drop";
        state.reason = "Encore window with venue presence; no configured encore drop.";
      } else {
        state.showExclusiveTreatment = "visible_locked";
        state.primaryMessage = "Unlocks at the show";
        state.reason = "Encore outside venue: exclusives remain locked.";
      }
      break;

    case "show_ended_attended":
      state.showExclusiveVisibility = "visible";
      if (holdsShowCredential || venuePresenceActive) {
        state.showExclusiveTreatment = "unlocked";
        state.showExclusivePurchasable = true;
        state.primaryMessage = holdsShowCredential ? "You were there" : "You're here · Tonight's drop is unlocked";
        state.reason = holdsShowCredential
          ? "Show ended: qualified attendees can still purchase while transitioning to history."
          : "Show ended with venue presence before credential is issued.";
      } else {
        state.showExclusiveTreatment = "visible_locked";
        state.primaryMessage = "Unlocks at the show";
        state.reason = "Show ended without attendance credential.";
      }
      break;

    case "post_day_1":
      state.showExclusiveVisibility = "visible";
      if (holdsShowCredential) {
        state.showExclusiveTreatment = "last_chance";
        state.showExclusivePurchasable = true;
        state.primaryMessage = "Last chance · 24 hours left";
        state.reason =
          "T+1 with attendance: attendee-only last-chance purchasing window.";
      } else {
        state.showExclusiveTreatment = "visible_locked";
        state.showExclusivePurchasable = false;
        state.primaryMessage = "Show exclusive — attendees only";
        state.reason =
          "T+1 without attendance: non-attendees cannot access attendee-only merch.";
      }
      break;

    case "post_day_2":
    case "post_archived":
      state.showExclusiveVisibility = "visible";
      state.showExclusivePurchasable = false;
      if (holdsShowCredential) {
        state.showExclusiveTreatment = "history_only";
        state.primaryMessage = "Show exclusive — closed";
        state.reason =
          "Attendee history: product remains evidence of the show, not an active SKU.";
      } else {
        state.showExclusiveTreatment = "closed";
        state.primaryMessage = "Show exclusive — closed";
        state.reason =
          "T+2 onward: show exclusives visible in history but not purchasable.";
      }
      break;
  }

  // "I'm Going" never creates attendance or unlocks venue merch
  if (fanStateIsGoing(fanState)) {
    state.hasAttendanceCredential = false;
    if (!venuePresenceActive) {
      state.showExclusivePurchasable = false;
      state.liveDropPurchasable = false;
      if (state.showExclusiveTreatment === "unlocked" || state.showExclusiveTreatment === "live_drop") {
        state.showExclusiveTreatment = "visible_locked";
        state.primaryMessage = fanState === "going" ? `Coming to ${show.city}` : state.primaryMessage;
      }
      state.reason +=
        " I'm Going is a pre-show signal — it does not unlock venue-exclusive merchandise or create attendance.";
    }
  }

  // Time alone never unlocks venue merch without inside-venue presence during live window
  if (
    !venuePresenceActive &&
    (phase === "live_inside" || phase === "live_headliner" || phase === "encore")
  ) {
    state.showExclusivePurchasable = false;
    state.liveDropPurchasable = false;
  }

  return applyMerchRuleOverride(merchRule, state);
}

/** Fan-facing lock label derived from experience state (never exposes internal terms). */
export function merchExperienceLockLabel(state: MerchExperienceState): string {
  switch (state.showExclusiveTreatment) {
    case "teaser":
      return "Coming soon";
    case "visible_locked":
      return state.primaryMessage || "Unlocks at the show";
    case "unlocked":
      return "Tonight";
    case "live_drop":
      return "Just unlocked";
    case "last_chance":
      return "Last chance";
    case "closed":
    case "history_only":
      return "Show exclusive — closed";
    default:
      return "Unlock at the show";
  }
}

/** Diagnostic label for /demo expected experience panel. */
export function merchExperienceDiagnosticLabel(state: MerchExperienceState): string {
  if (state.merchOverrideActive) {
    return `OVERRIDE · ${state.showExclusiveTreatment.replace(/_/g, " ").toUpperCase()}`;
  }
  switch (state.showExclusiveTreatment) {
    case "teaser":
      return "TEASER ONLY";
    case "visible_locked":
      return "VISIBLE + LOCKED";
    case "unlocked":
      return "UNLOCKED";
    case "live_drop":
      return "LIVE DROP";
    case "last_chance":
      return "LAST CHANCE";
    case "closed":
      return "CLOSED";
    case "history_only":
      return "HISTORY ONLY";
    default:
      return "CORE ONLY";
  }
}
