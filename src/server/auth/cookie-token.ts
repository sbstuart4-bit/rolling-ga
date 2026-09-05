import { createHmac, timingSafeEqual } from "node:crypto";
import { SESSION_COOKIE_NAME } from "@/lib/auth-cookies";

export { SESSION_COOKIE_NAME } from "@/lib/auth-cookies";
export const SESSION_TTL_DAYS = 30;

/**
 * In development the secret falls back to a fixed string so the app runs with no setup.
 * In production a missing secret is fatal rather than silently insecure.
 */
function sessionSecret(): string {
  const secret = process.env.ROLLING_GA_SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ROLLING_GA_SESSION_SECRET must be set to at least 16 characters in production.",
    );
  }
  return "rolling-ga-development-only-session-secret";
}

/**
 * The cookie carries `<sessionId>.<hmac>`. The signature means a tampered or guessed
 * session id is rejected before it ever reaches the database.
 */
export function serializeSessionCookie(sessionId: string): string {
  const mac = createHmac("sha256", sessionSecret()).update(sessionId).digest("base64url");
  return `${sessionId}.${mac}`;
}

export function readSessionCookie(raw: string | undefined): string | null {
  if (!raw) return null;

  const separator = raw.lastIndexOf(".");
  if (separator <= 0) return null;

  const sessionId = raw.slice(0, separator);
  const provided = Buffer.from(raw.slice(separator + 1));
  const expected = Buffer.from(
    createHmac("sha256", sessionSecret()).update(sessionId).digest("base64url"),
  );

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;
  return sessionId;
}
