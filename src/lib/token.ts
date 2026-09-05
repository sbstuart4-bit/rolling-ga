import { createHash, randomBytes } from "node:crypto";

/**
 * A QR token. Long and random rather than derived from the event, so a token can be
 * rotated (invalidating a photographed code) without changing the event's own URL.
 */
export function generateEventToken(): string {
  return randomBytes(18).toString("base64url");
}

export function generateOrderNumber(sequence?: number): string {
  const suffix = sequence !== undefined
    ? String(sequence).padStart(6, "0")
    : randomBytes(3).toString("hex").toUpperCase();
  return `RGA-${suffix}`;
}

/**
 * One-way hash of a client identifier, used only to rate-limit verification attempts.
 * The raw address is never written anywhere.
 */
export function hashClientIdentifier(value: string): string {
  const salt = process.env.ROLLING_GA_SESSION_SECRET ?? "rolling-ga-development-only-session-secret";
  return createHash("sha256").update(`${salt}:${value}`).digest("base64url").slice(0, 32);
}
