import "server-only";
import { cache } from "react";
import type { ResolvedTheme } from "@/lib/theme";
import { enrichResolvedTheme } from "@/lib/demo-theme-assets";
import { resolveEventTheme } from "@/server/theme/resolve";
import { hasVerifiedAttendance } from "@/server/verification/service";
import { demoNow } from "@/server/demo/clock";
import { resolveDemoAwareEventTiming } from "@/server/demo/demo-event-timing";
import { getPersistedDemoScenario } from "@/server/demo/scenario-state";
import { resolveEventFanExperience } from "@/server/demo/scenario-access";
import type { FanExperienceState } from "@/lib/fan-experience/access-state";
import { hasEarnedCredential } from "@/lib/fan-experience/access-state";
import {
  getEventBySlug,
  verificationWindowFor,
  type EventRow,
} from "./queries";

export interface EventPageContext {
  event: EventRow;
  timing: import("@/lib/event-state").EventStateResult;
  theme: ResolvedTheme;
  fanExperience: FanExperienceState;
  verification: { opensAt: Date; closesAt: Date; open: boolean };
}

/** @deprecated Use fanExperience.credential === "earned". */
export function isVerifiedAttendeeFromContext(page: EventPageContext): boolean {
  return hasEarnedCredential(page.fanExperience);
}

/**
 * Everything a show surface needs, loaded once per request.
 *
 * The layout, the page and its children all need the same show, theme and verification
 * status; `cache` means asking for it repeatedly costs one set of queries.
 */
export const loadEventPage = cache(
  async (slug: string, userId: string): Promise<EventPageContext | null> => {
    const event = await getEventBySlug(slug);
    if (!event) return null;

    const [rawTheme, realVerified, demoScenario] = await Promise.all([
      resolveEventTheme(event.id),
      hasVerifiedAttendance(userId, event.id),
      getPersistedDemoScenario(),
    ]);

    const now = demoNow();
    const timing = resolveDemoAwareEventTiming(event, demoScenario, event.id, now);
    const fanExperience = resolveEventFanExperience(
      event.id,
      demoScenario,
      realVerified,
      timing.state,
    );

    const theme = enrichResolvedTheme(rawTheme, {
      artistId: event.artistId,
      eventId: event.id,
      tourId: event.tourId,
    });

    const window = verificationWindowFor(event);

    return {
      event,
      timing,
      theme,
      fanExperience,
      verification: {
        ...window,
        open: !event.cancelled && now >= window.opensAt && now <= window.closesAt,
      },
    };
  },
);
