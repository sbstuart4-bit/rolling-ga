import "server-only";

import { MARISOL_ARTIST_ID } from "@/lib/demo-user-ids";
import { canAccessArtist, hasAnyRole } from "@/server/auth/guards";
import type { AuthContext } from "@/server/auth/session";

export {
  areRequiredDemoPersonasReady,
  isElenaMarisolDemoAccountReady,
  isMarcusValeDemoAccountReady,
  isScottDemoAccountReady,
  repairElenaMarisolDemoAccount,
  repairMarcusValeDemoAccount,
  repairScottDemoAccount,
  requiredDemoPersonaEmailsPresent,
} from "@/db/demo-persona-repair";

const SCOTT_EMAIL = "scott@example.com";
const ELENA_EMAIL = "elena@marisolreyes.example";

export function isElenaMarisolDemoSession(ctx: AuthContext): boolean {
  return (
    ctx.email === ELENA_EMAIL &&
    hasAnyRole(ctx, ["artist_member", "rga_admin"]) &&
    canAccessArtist(ctx, MARISOL_ARTIST_ID)
  );
}

export function isScottDemoSession(ctx: AuthContext): boolean {
  return ctx.email === SCOTT_EMAIL && hasAnyRole(ctx, ["fan"]);
}
