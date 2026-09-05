import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { DEMO_BOARD_ACCESS_COOKIE } from "@/lib/auth-cookies";
import {
  hostedDemoBoardGateRequired,
  resolveDemoBoardSecret,
} from "@/lib/production-env";

export { DEMO_BOARD_ACCESS_COOKIE } from "@/lib/auth-cookies";
const DEMO_BOARD_ACCESS_PAYLOAD = "granted";

function demoBoardSecretOrThrow(): string {
  const secret = resolveDemoBoardSecret();
  if (!secret) {
    throw new Error(
      "ROLLING_GA_DEMO_BOARD_SECRET must be set to at least 16 characters when ROLLING_GA_DEMO=1 in production.",
    );
  }
  return secret;
}

export function serializeDemoBoardAccessCookie(): string {
  const secret = demoBoardSecretOrThrow();
  const mac = createHmac("sha256", secret).update(DEMO_BOARD_ACCESS_PAYLOAD).digest("base64url");
  return `${DEMO_BOARD_ACCESS_PAYLOAD}.${mac}`;
}

export function readDemoBoardAccessCookie(raw: string | undefined): boolean {
  if (!raw) return false;

  const secret = resolveDemoBoardSecret();
  if (!secret) return false;

  const separator = raw.lastIndexOf(".");
  if (separator <= 0) return false;

  const payload = raw.slice(0, separator);
  if (payload !== DEMO_BOARD_ACCESS_PAYLOAD) return false;

  const provided = Buffer.from(raw.slice(separator + 1));
  const expected = Buffer.from(
    createHmac("sha256", secret).update(DEMO_BOARD_ACCESS_PAYLOAD).digest("base64url"),
  );

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return false;
  return true;
}

/** Server components and actions call this before exposing passwordless demo login. */
export async function hasDemoBoardAccess(): Promise<boolean> {
  if (!hostedDemoBoardGateRequired()) return true;

  const jar = await cookies();
  return readDemoBoardAccessCookie(jar.get(DEMO_BOARD_ACCESS_COOKIE)?.value);
}
