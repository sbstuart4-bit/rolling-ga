"use server";

import { ensureGuidedDemoFromSearchParams } from "./guided-demo-apply";

export async function ensureGuidedDemoFromUrlAction(params: {
  guided: string;
  step: string;
  presenter?: string;
  autoplay?: string;
}): Promise<void> {
  await ensureGuidedDemoFromSearchParams({
    guided: params.guided,
    step: params.step,
    presenter: params.presenter,
    autoplay: params.autoplay,
  });
}
