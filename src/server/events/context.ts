import "server-only";
import { cache } from "react";
import type { ResolvedTheme } from "@/lib/theme";
import { resolveEventTheme } from "@/server/theme/resolve";
import { hasVerifiedAttendance } from "@/server/verification/service";
import { demoNow } from "@/server/demo/clock";
import {
  getEventBySlug,
  verificationWindowFor,
  withTiming,
  type EventRow,
} from "./queries";

export interface EventPageContext {
  event: EventRow;
  timing: ReturnType<typeof withTiming>["timing"];
  theme: ResolvedTheme;
  isVerifiedAttendee: boolean;
  verification: { opensAt: Date; closesAt: Date; open: boolean };
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

    const [theme, isVerifiedAttendee] = await Promise.all([
      resolveEventTheme(event.id),
      hasVerifiedAttendance(userId, event.id),
    ]);

    const now = demoNow();
    const window = verificationWindowFor(event);

    return {
      event,
      timing: withTiming(event, now).timing,
      theme,
      isVerifiedAttendee,
      verification: {
        ...window,
        open: !event.cancelled && now >= window.opensAt && now <= window.closesAt,
      },
    };
  },
);
