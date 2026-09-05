/**
 * Edge-safe HMAC cookie helpers for Next.js middleware.
 *
 * Mirrors the `<payload>.<base64url-hmac>` format used by session cookies so
 * middleware can verify cookies without importing Node's `crypto` module.
 */

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacSha256Base64Url(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return base64UrlEncode(new Uint8Array(signature));
}

export async function verifySignedCookie(
  raw: string | undefined,
  secret: string,
): Promise<string | null> {
  if (!raw || !secret) return null;

  const separator = raw.lastIndexOf(".");
  if (separator <= 0) return null;

  const payload = raw.slice(0, separator);
  const provided = raw.slice(separator + 1);
  const expected = await hmacSha256Base64Url(secret, payload);

  if (!timingSafeEqualStrings(provided, expected)) return null;
  return payload;
}

export async function createSignedCookieValue(payload: string, secret: string): Promise<string> {
  const mac = await hmacSha256Base64Url(secret, payload);
  return `${payload}.${mac}`;
}
