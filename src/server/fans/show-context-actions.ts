"use server";

import { setFanShowContextSlug } from "@/server/fans/show-context";

/** Called from event layout so /drops and other tabs stay in the artist takeover. */
export async function markFanShowContextAction(slug: string): Promise<void> {
  if (!slug) return;
  await setFanShowContextSlug(slug);
}
