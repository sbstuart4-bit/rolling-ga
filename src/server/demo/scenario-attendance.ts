import "server-only";

import type { DemoScenario } from "@/lib/demo-scenario/types";
import { getDemoShow } from "@/lib/demo-scenario/shows";
import { fanStateHasAttendanceCredential, fanStateIsGoing } from "@/lib/merch-experience/resolver";

export interface AttendanceContext {
  attendedEventIds: string[];
  attendedTourIds: string[];
  attendedArtistIds: string[];
}

const PRIOR_SHOW_BY_ARTIST: Record<string, string[]> = {
  art_the_degens: ["evt_history_0"],
  art_nova_kestrel: ["evt_nova_nashville"],
  art_low_country: ["evt_low_austin"],
  art_marisol_reyes: ["evt_history_2", "evt_history_3"],
};

const TOUR_BY_ARTIST: Record<string, string> = {
  art_the_degens: "tor_signal_decay",
  art_nova_kestrel: "tor_gold_hour",
  art_low_country: "tor_river_sessions",
  art_marisol_reyes: "tor_violeta",
};

function priorShowsForHistory(
  artistId: string,
  fanHistory: DemoScenario["fanHistory"],
): string[] {
  const all = PRIOR_SHOW_BY_ARTIST[artistId] ?? [];
  const count =
    fanHistory === "first_show"
      ? 0
      : fanHistory === "second_show"
        ? 1
        : fanHistory === "three_shows"
          ? 2
          : fanHistory === "five_shows"
            ? 3
            : 4;
  return all.slice(0, count);
}

/**
 * Applies demo scenario fan state to real attendance without mutating the database.
 * "I'm Going" never creates attendance credentials.
 */
export function applyScenarioToAttendance(
  scenario: DemoScenario,
  real: AttendanceContext,
): AttendanceContext {
  const show = getDemoShow(scenario.showKey);
  if (!show) return real;

  const priorEventIds = priorShowsForHistory(show.artistId, scenario.fanHistory);
  const tourId = TOUR_BY_ARTIST[show.artistId];
  const hasPriorHistory = priorEventIds.length > 0;

  if (fanStateIsGoing(scenario.fanState)) {
    return {
      attendedEventIds: priorEventIds,
      attendedTourIds: hasPriorHistory && tourId ? [tourId] : [],
      attendedArtistIds: hasPriorHistory ? [show.artistId] : [],
    };
  }

  if (scenario.fanState === "unknown") {
    return {
      attendedEventIds: priorEventIds,
      attendedTourIds: hasPriorHistory && tourId ? [tourId] : [],
      attendedArtistIds: hasPriorHistory ? [show.artistId] : [],
    };
  }

  if (scenario.fanState === "at_venue") {
    return {
      attendedEventIds: priorEventIds,
      attendedTourIds: hasPriorHistory && tourId ? [tourId] : [],
      attendedArtistIds: hasPriorHistory || scenario.fanHistory !== "first_show" ? [show.artistId] : [],
    };
  }

  if (scenario.fanState === "returning_fan") {
    return {
      attendedEventIds: priorEventIds,
      attendedTourIds: tourId ? [tourId] : [],
      attendedArtistIds: [show.artistId],
    };
  }

  if (fanStateHasAttendanceCredential(scenario.fanState)) {
    return {
      attendedEventIds: [...new Set([...priorEventIds, show.eventId])],
      attendedTourIds: tourId ? [tourId] : [],
      attendedArtistIds: [show.artistId],
    };
  }

  return real;
}

/** Product ids simulated as purchased for demo UI treatment. */
export function scenarioPurchasedProductIds(scenario: DemoScenario): Set<string> {
  const show = getDemoShow(scenario.showKey);
  if (!show) return new Set();

  switch (scenario.purchaseHistory) {
    case "core_merch":
      return new Set([coreProductForArtist(show.artistId)]);
    case "show_exclusive":
      return new Set([exclusiveProductForArtist(show.artistId, show.key)]);
    case "multiple":
      return new Set([
        coreProductForArtist(show.artistId),
        exclusiveProductForArtist(show.artistId, show.key),
      ]);
    default:
      return new Set();
  }
}

function coreProductForArtist(artistId: string): string {
  switch (artistId) {
    case "art_the_degens":
      return "prd_av_tour_tee";
    case "art_nova_kestrel":
      return "prd_nk_tee";
    case "art_low_country":
      return "prd_lc_tee";
    case "art_marisol_reyes":
      return "prd_mr_tee";
    default:
      return "prd_av_tour_tee";
  }
}

function exclusiveProductForArtist(artistId: string, showKey: string): string {
  if (artistId === "art_the_degens" && showKey === "atlas-detroit") return "prd_av_detroit_tee";
  if (artistId === "art_nova_kestrel") return "prd_nk_nashville_tee";
  if (artistId === "art_low_country") return "prd_lc_austin_print";
  if (artistId === "art_marisol_reyes") return "prd_mr_print";
  return coreProductForArtist(artistId);
}
