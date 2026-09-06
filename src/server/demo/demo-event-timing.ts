import type { DemoScenario } from "@/lib/demo-scenario/types";
import { getDemoShowByEventId } from "@/lib/demo-scenario/shows";
import { timingStateForDemoPhase } from "@/lib/fan-experience/access-state";
import {
  postShowWindowMinutes,
  resolveEventState,
  type EventStateResult,
  type EventTiming,
} from "@/lib/event-state";

type TimedEvent = EventTiming & {
  tourWindowMinutes: number;
};

/**
 * Fan-facing event timing. When a demo scenario applies to this show, use the
 * scenario phase (doors open = live) instead of raw timestamps — doorsAt is
 * before startsAt but venue merch should already be unlocked.
 */
export function resolveDemoAwareEventTiming(
  event: TimedEvent,
  scenario: DemoScenario | null,
  eventId: string,
  now: Date,
): EventStateResult {
  const show = scenario ? getDemoShowByEventId(eventId) : null;
  if (scenario && show && show.eventId === eventId && show.key === scenario.showKey) {
    const state = timingStateForDemoPhase(scenario.timePhase);
    const windowMinutes = postShowWindowMinutes(event, event.tourWindowMinutes);
    const postShowClosesAt = new Date(event.endsAt.getTime() + windowMinutes * 60_000);
    const nowMs = now.getTime();

    return {
      state,
      postShowClosesAt: state === "archived" ? null : postShowClosesAt,
      msUntilStart: event.startsAt.getTime() - nowMs,
      msUntilPostShowClose: state === "recently_ended" ? postShowClosesAt.getTime() - nowMs : null,
    };
  }

  return resolveEventState(event, event.tourWindowMinutes, now);
}
