import "server-only";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { demoModeEnabled } from "@/lib/demo-mode";
import {
  GUIDED_DEMO_ENTRY_HEADER,
  parseGuidedDemoQuery,
} from "@/lib/guided-demo-entry";
import { getAuthContext } from "@/server/auth/session";
import { applyGuidedStepState, loadGuidedStepContext } from "./guided-demo-apply";
import { getGuidedDemoSession } from "./guided-demo-state";

/**
 * Establish the seeded Scott Weller demo session when an anonymous visitor arrives
 * on a guided-demo fan route (marketing CTA redirect or refresh with guided cookies).
 */
export async function bootstrapGuidedDemoAuthIfNeeded(): Promise<void> {
  if (!demoModeEnabled()) return;
  if (await getAuthContext()) return;

  const guidedSession = await getGuidedDemoSession();
  if (guidedSession) {
    const ctx = await loadGuidedStepContext(guidedSession.journeyId, guidedSession.step, {
      autoplay: guidedSession.autoplay,
      presenter: guidedSession.presenter,
    });
    if (ctx) {
      try {
        await applyGuidedStepState(ctx);
      } catch (error) {
        if (error instanceof Error && error.message.includes("not seeded")) {
          redirect("/demo/guided?unavailable=seed");
        }
        throw error;
      }
    }
    return;
  }

  const headerStore = await headers();
  const guidedEntry = headerStore.get(GUIDED_DEMO_ENTRY_HEADER);
  if (!guidedEntry) return;

  let parsed: ReturnType<typeof parseGuidedDemoQuery>;
  try {
    parsed = parseGuidedDemoQuery(new URL(guidedEntry, "http://local").searchParams);
  } catch {
    return;
  }
  if (!parsed) return;

  const ctx = await loadGuidedStepContext(parsed.journeyId, parsed.step, {
    presenter: parsed.presenter,
    autoplay: parsed.autoplay,
  });
  if (!ctx) return;

  try {
    await applyGuidedStepState(ctx);
  } catch (error) {
    if (error instanceof Error && error.message.includes("not seeded")) {
      redirect("/demo/guided?unavailable=seed");
    }
    throw error;
  }
}
