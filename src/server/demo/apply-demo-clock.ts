import "server-only";

import type { DemoShowDefinition } from "@/lib/demo-scenario/shows";
import type { DemoTimePhase } from "@/lib/demo-scenario/types";
import { resolveTimePhaseDate } from "@/lib/demo-scenario/time-phases";
import { persistDemoClockOffset, setDemoClockToDate } from "./clock";

/** In-memory clock only — safe to call from layouts (no cookie writes). */
export function applyDemoClockForPhaseInMemory(
  show: DemoShowDefinition,
  timePhase: DemoTimePhase,
): void {
  setDemoClockToDate(resolveTimePhaseDate(show, timePhase));
}

/** Single absolute-date clock path for guided demo, demo board, and persona walkthroughs. */
export async function applyDemoClockForPhase(
  show: DemoShowDefinition,
  timePhase: DemoTimePhase,
): Promise<void> {
  applyDemoClockForPhaseInMemory(show, timePhase);
  await persistDemoClockOffset();
}
