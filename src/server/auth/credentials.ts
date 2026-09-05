import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "./password";

export interface CredentialResult {
  ok: boolean;
  userId?: string;
  /** A machine-readable reason. Never surfaced verbatim to the sign-in form. */
  reason?: "unknown_user" | "bad_password" | "provider_unavailable";
}

/**
 * Authentication is behind an interface so a real identity provider (SSO, magic link,
 * passkeys) can be added without touching session handling or any authorization code.
 */
export interface CredentialProvider {
  readonly id: string;
  authenticate(email: string, password: string): Promise<CredentialResult>;
}

/** Email plus scrypt-hashed password held in the application's own `users` table. */
export const passwordCredentialProvider: CredentialProvider = {
  id: "password",
  async authenticate(email, password) {
    const [user] = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);

    if (!user) return { ok: false, reason: "unknown_user" };
    if (!verifyPassword(password, user.passwordHash)) {
      return { ok: false, reason: "bad_password" };
    }
    return { ok: true, userId: user.id };
  },
};

export const credentialProvider: CredentialProvider = passwordCredentialProvider;
