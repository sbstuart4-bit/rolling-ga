"use server";

import { ensureDevDatabaseReady } from "@/db/dev-bootstrap";
import { demoModeEnabled } from "@/lib/demo-mode";
import { getAuthContext } from "@/server/auth/session";
import { ensureGuidedDemoFromSearchParams, isScottDemoSession } from "./guided-demo-apply";

export type BootstrapGuidedDemoResult =
  | { ok: true }
  | { ok: false; error: string; redirectTo?: string };

export async function bootstrapGuidedDemoSessionAction(params: {
  guided: string;
  step: string;
  presenter?: string;
  autoplay?: string;
}): Promise<BootstrapGuidedDemoResult> {
  if (!demoModeEnabled()) {
    return { ok: false, error: "Demo mode is not enabled.", redirectTo: "/demo/guided?unavailable=1" };
  }

  await ensureDevDatabaseReady();

  try {
    const existing = await getAuthContext();
    if (existing && isScottDemoSession(existing)) {
      await ensureGuidedDemoFromSearchParams({
        guided: params.guided,
        step: params.step,
        presenter: params.presenter,
        autoplay: params.autoplay,
      });
      return { ok: true };
    }

    await ensureGuidedDemoFromSearchParams({
      guided: params.guided,
      step: params.step,
      presenter: params.presenter,
      autoplay: params.autoplay,
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes("not seeded")) {
      return {
        ok: false,
        error: "Demo fan Scott Weller is not in the production database.",
        redirectTo: "/demo/guided?unavailable=seed",
      };
    }

    const message =
      error instanceof Error ? error.message : "Could not start the guided demo.";
    return { ok: false, error: message };
  }
}
