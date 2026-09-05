import "server-only";

import { cookies } from "next/headers";
import { FAN_SHOW_CONTEXT_COOKIE } from "@/lib/auth-cookies";

async function readFanShowSlug(): Promise<string | null> {
  try {
    const jar = await cookies();
    return jar.get(FAN_SHOW_CONTEXT_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

/** Event slug the fan last entered — scopes tab navigation to that artist world. */
export async function getFanShowContextSlug(): Promise<string | null> {
  return readFanShowSlug();
}

export async function setFanShowContextSlug(slug: string): Promise<void> {
  try {
    const jar = await cookies();
    jar.set(FAN_SHOW_CONTEXT_COOKIE, slug, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  } catch {
    // Ignore outside request scope (tests).
  }
}

export async function clearFanShowContextSlug(): Promise<void> {
  try {
    const jar = await cookies();
    jar.delete(FAN_SHOW_CONTEXT_COOKIE);
  } catch {
    // Ignore outside request scope (tests).
  }
}
