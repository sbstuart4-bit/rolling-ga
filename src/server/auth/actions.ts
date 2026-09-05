"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { fanPreferences, userRoles, users } from "@/db/schema";
import { credentialProvider } from "./credentials";
import { assertUser } from "./guards";
import { hashPassword } from "./password";
import { demoModeEnabled } from "@/lib/demo-mode";
import {
  createSession,
  destroySession,
  getAuthContext,
  pruneExpiredSessions,
  setActiveArtist,
} from "./session";

export interface SignInState {
  error?: string;
}

const signInSchema = z.object({
  email: z.string().trim().min(1, "Enter your email.").email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
  next: z.string().optional(),
});

/**
 * Only relative paths are accepted as a post-sign-in destination, so a crafted link
 * cannot bounce someone to another origin after authenticating.
 */
function safeRedirectTarget(next: string | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export async function signInAction(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const result = await credentialProvider.authenticate(parsed.data.email, parsed.data.password);
  if (!result.ok || !result.userId) {
    // Deliberately identical for unknown accounts and wrong passwords.
    return { error: "That email and password combination was not recognised." };
  }

  await pruneExpiredSessions();
  await createSession(result.userId);
  redirect(safeRedirectTarget(parsed.data.next));
}

export interface SignUpState {
  error?: string;
}

const signUpSchema = z.object({
  displayName: z.string().trim().min(1, "Tell us your name.").max(80),
  email: z.string().trim().min(1, "Enter your email.").email("Enter a valid email."),
  password: z.string().min(8, "Use at least 8 characters."),
  next: z.string().optional(),
});

/**
 * Creates a new fan account and immediately signs them in. The fan is redirected into
 * `/onboarding` rather than straight to `/` — `onboardingCompletedAt` stays null until
 * they finish the wizard, and every fan-facing page checks that column.
 */
export async function signUpAction(_prev: SignUpState, formData: FormData): Promise<SignUpState> {
  const parsed = signUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const email = parsed.data.email.toLowerCase();

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return { error: "An account with that email already exists. Try signing in instead." };
  }

  // The database generates the uuid, so the identifier is never invented client-side.
  const [created] = await db
    .insert(users)
    .values({
      email,
      displayName: parsed.data.displayName,
      passwordHash: hashPassword(parsed.data.password),
      onboardingCompletedAt: null,
    })
    .returning({ id: users.id });
  const userId = created.id;
  await db.insert(userRoles).values({ userId, role: "fan" });
  await db.insert(fanPreferences).values({ userId });

  await pruneExpiredSessions();
  await createSession(userId);

  const target = safeRedirectTarget(parsed.data.next);
  redirect(`/onboarding${target !== "/" ? `?next=${encodeURIComponent(target)}` : ""}`);
}

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect(demoModeEnabled() ? "/demo" : "/sign-in");
}

export async function switchArtistAction(formData: FormData): Promise<void> {
  const ctx = await getAuthContext();
  assertUser(ctx);

  const artistId = String(formData.get("artistId") ?? "");
  const membership = ctx.memberships.find((m) => m.artistId === artistId);
  if (!membership && !ctx.roles.includes("rga_admin")) return;

  await setActiveArtist(ctx.sessionId, artistId || null);
  redirect("/studio");
}
