import type { ExperienceAccessState, FanExperienceState } from "./access-state";
import { formatDateTime, formatEventDate } from "@/lib/format";
import type { EventState } from "@/lib/types";

export interface NowNextAction {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  emphasis: boolean;
  showCta: boolean;
}

export function liveNowNextEyebrow(
  access: ExperienceAccessState,
  timingState: EventState,
): string {
  if (access === "live_unlocked" || timingState === "live") return "Live now";
  if (access === "postshow_open") return "Just ended";
  if (access === "history_only" || timingState === "archived") return "Your show";
  return "Upcoming";
}

/** LIVE = NOW/NEXT card copy derived only from canonical fanExperience.access. */
export function resolveNowNextAction(input: {
  access: ExperienceAccessState;
  slug: string;
  artistName: string;
  city: string;
  startsAt: Date;
  timezone: string;
  teaserMessage?: string;
  timingState: EventState;
  postShowClosesAt?: Date | null;
  artistSlug?: string;
}): NowNextAction {
  const {
    access,
    slug,
    artistName,
    city,
    startsAt,
    timezone,
    teaserMessage,
    timingState,
    postShowClosesAt,
    artistSlug,
  } = input;

  const eyebrow = liveNowNextEyebrow(access, timingState);

  if (access === "discover_only") {
    return {
      eyebrow,
      title: "Discover the show",
      body:
        teaserMessage ??
        `${formatEventDate(startsAt, timezone)} in ${city}. Merch opens closer to show night.`,
      href: `/event/${slug}`,
      cta: "",
      emphasis: false,
      showCta: false,
    };
  }

  if (access === "live_unlocked") {
    return {
      eyebrow,
      title: "You're in the room",
      body: "Tonight's show exclusives are unlocked. Shop without the merch line.",
      href: `/event/${slug}/shop`,
      cta: "Open tonight's shop",
      emphasis: true,
      showCta: true,
    };
  }

  if (access === "postshow_open") {
    return {
      eyebrow,
      title: "Thank you for being there",
      body: `Your ${city} credential is live. Complete your collection while the post-show store is open.`,
      href: `/event/${slug}`,
      cta: "View post-show hub",
      emphasis: true,
      showCta: true,
    };
  }

  if (access === "history_only") {
    return {
      eyebrow,
      title: "You were there",
      body: `Your ${city} credential and show history live in My Shows.`,
      href: `/event/${slug}/credential`,
      cta: "View your credential",
      emphasis: false,
      showCta: true,
    };
  }

  // preview_locked
  if (timingState === "upcoming") {
    return {
      eyebrow,
      title: "Locked until you're inside",
      body: `${formatEventDate(startsAt, timezone)} in ${city}. Preview what's waiting — show exclusives unlock when you're inside the venue.`,
      href: `/event/${slug}/shop`,
      cta: "Preview the merch",
      emphasis: false,
      showCta: true,
    };
  }

  return {
    eyebrow,
    title: "This one's closed",
    body: postShowClosesAt
      ? `${city} closed ${formatDateTime(postShowClosesAt, timezone)}.`
      : `${formatEventDate(startsAt, timezone)} in ${city} has been archived.`,
    href: artistSlug ? `/artist/${artistSlug}` : `/event/${slug}`,
    cta: artistSlug ? `See ${artistName}'s upcoming shows` : "View the show",
    emphasis: false,
    showCta: true,
  };
}

export function productAccessLabelForExperience(fanExperience: FanExperienceState): string {
  switch (fanExperience.access) {
    case "live_unlocked":
      return "Inside the venue tonight";
    case "postshow_open":
      return "Attendees only";
    case "history_only":
      return "Show exclusive — history";
    case "preview_locked":
      return "Available at the show";
    default:
      return "Coming soon";
  }
}

export function scenarioFanIsGoing(fanExperience: FanExperienceState): boolean {
  return fanExperience.experience?.relationshipTreatment?.startsWith("Coming to") ?? false;
}
