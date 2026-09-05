"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertUser } from "@/server/auth/guards";
import { getAuthContext } from "@/server/auth/session";
import {
  dismissStayConnectedPrompt,
  grantStayConnected,
  withdrawArtistConnection,
} from "@/server/consent/service";

export interface ConsentActionState {
  ok?: boolean;
  error?: string;
}

const artistConsentSchema = z.object({
  artistId: z.string().min(1),
  eventSlug: z.string().min(1).optional(),
});

function revalidateConsentPaths(eventSlug?: string) {
  revalidatePath("/profile/connections");
  if (eventSlug) revalidatePath(`/event/${eventSlug}`);
}

export async function optInStayConnectedAction(
  _prev: ConsentActionState,
  formData: FormData,
): Promise<ConsentActionState> {
  const ctx = await getAuthContext();
  assertUser(ctx);

  const parsed = artistConsentSchema.safeParse({ artistId: formData.get("artistId") });
  if (!parsed.success) return { error: "Invalid request." };

  await grantStayConnected(ctx.userId, parsed.data.artistId);
  revalidateConsentPaths(parsed.data.eventSlug);
  return { ok: true };
}

export async function dismissStayConnectedAction(
  _prev: ConsentActionState,
  formData: FormData,
): Promise<ConsentActionState> {
  const ctx = await getAuthContext();
  assertUser(ctx);

  const parsed = artistConsentSchema.safeParse({ artistId: formData.get("artistId") });
  if (!parsed.success) return { error: "Invalid request." };

  await dismissStayConnectedPrompt(ctx.userId, parsed.data.artistId);
  revalidateConsentPaths(parsed.data.eventSlug);
  return { ok: true };
}

export async function disconnectArtistAction(formData: FormData): Promise<void> {
  const ctx = await getAuthContext();
  assertUser(ctx);

  const parsed = artistConsentSchema.safeParse({ artistId: formData.get("artistId") });
  if (!parsed.success) return;

  await withdrawArtistConnection(ctx.userId, parsed.data.artistId);
  revalidatePath("/profile/connections");
}
