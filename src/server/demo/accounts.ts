import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { withDevDatabaseRecovery } from "@/db/dev-bootstrap";
import { userRoles, users } from "@/db/schema";
import type { PlatformRole } from "@/lib/types";
import { demoModeEnabled } from "@/lib/demo-mode";

/** Every seeded account shares this password. It only ever exists in demo data. */
export const DEMO_PASSWORD = "rollingga";

export { demoModeEnabled };

export interface DemoAccount {
  email: string;
  displayName: string;
  roles: PlatformRole[];
  blurb: string;
}

/** Generic fallback if an account somehow isn't in `BLURBS_BY_EMAIL` below. */
const BLURBS: Partial<Record<PlatformRole, string>> = {
  fan: "Verified show history, credentials, drops and orders.",
  artist_member: "Artist Studio: tour, brand, drops, fans, insights.",
  rga_admin: "Platform-wide access across every artist.",
  fulfillment_operator: "Orders, inventory, pick/pack and shipments.",
};

/**
 * Each curated account is a distinct persona, not just a role — this is what actually
 * makes the picker useful, since two `artist_member` accounts otherwise look identical.
 */
const BLURBS_BY_EMAIL: Record<string, string> = {
  "scott@example.com": "A fan's view: passport of past shows, credentials, and drops.",
  "marcus@thedegens.example": "Runs The Degens' Studio — tour, drops, brand and fan CRM.",
  "dana@novakestrel.example": "Merch manager for Nova Kestrel — drops and bundles, can publish.",
  "priya@thelowcountry.example": "Tour manager for The Low Country — dates only, can't publish.",
  "admin@rollingga.example": "Rolling GA admin — platform-wide access across every artist.",
  "ops@rollingga.example": "Fulfillment console — orders, inventory, pick/pack, shipments.",
};

/** The curated personas, keyed on the one stable identifier a seeded account has. */
const CURATED_EMAILS = Object.keys(BLURBS_BY_EMAIL);

/**
 * Powers the sign-in page's account picker so the demo can be explored without
 * anybody having to be told a password. Returns nothing outside demo mode.
 *
 * The seed also creates ~180 "crowd" fans purely so the Studio CRM, insights and
 * attendance counts have real rows to read instead of constants. They're interchangeable
 * by design and would otherwise flood this picker with look-alike "Firstname Lastname"
 * entries, so the query selects the curated personas by email rather than excluding the
 * crowd — user ids are opaque uuids and carry no persona information.
 */
/** Static personas so the demo board still renders if PGlite is temporarily unavailable. */
const STATIC_DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "scott@example.com",
    displayName: "Scott Weller",
    roles: ["fan"],
    blurb: BLURBS_BY_EMAIL["scott@example.com"]!,
  },
  {
    email: "marcus@thedegens.example",
    displayName: "Marcus Vale",
    roles: ["artist_member"],
    blurb: BLURBS_BY_EMAIL["marcus@thedegens.example"]!,
  },
  {
    email: "dana@novakestrel.example",
    displayName: "Dana Okafor",
    roles: ["artist_member"],
    blurb: BLURBS_BY_EMAIL["dana@novakestrel.example"]!,
  },
  {
    email: "priya@thelowcountry.example",
    displayName: "Priya Nair",
    roles: ["artist_member"],
    blurb: BLURBS_BY_EMAIL["priya@thelowcountry.example"]!,
  },
  {
    email: "admin@rollingga.example",
    displayName: "Rolling GA Admin",
    roles: ["rga_admin"],
    blurb: BLURBS_BY_EMAIL["admin@rollingga.example"]!,
  },
  {
    email: "ops@rollingga.example",
    displayName: "Jordan Pike",
    roles: ["fulfillment_operator"],
    blurb: BLURBS_BY_EMAIL["ops@rollingga.example"]!,
  },
];

export async function listDemoAccounts(): Promise<DemoAccount[]> {
  if (!demoModeEnabled()) return [];

  try {
    return await withDevDatabaseRecovery(async () => {
      const rows = await db
        .select({
          email: users.email,
          displayName: users.displayName,
          role: userRoles.role,
        })
        .from(users)
        .innerJoin(userRoles, eq(userRoles.userId, users.id))
        .where(and(eq(users.isDemo, true), inArray(users.email, CURATED_EMAILS)));

      const byEmail = new Map<string, DemoAccount>();
      for (const row of rows) {
        const existing = byEmail.get(row.email);
        if (existing) {
          existing.roles.push(row.role);
        } else {
          byEmail.set(row.email, {
            email: row.email,
            displayName: row.displayName,
            roles: [row.role],
            blurb: BLURBS_BY_EMAIL[row.email] ?? BLURBS[row.role] ?? "",
          });
        }
      }

      if (byEmail.size === 0) return STATIC_DEMO_ACCOUNTS;

      const order: PlatformRole[] = ["fan", "artist_member", "rga_admin", "fulfillment_operator"];
      return [...byEmail.values()].sort(
        (a, b) => order.indexOf(a.roles[0]) - order.indexOf(b.roles[0]),
      );
    });
  } catch {
    return STATIC_DEMO_ACCOUNTS;
  }
}
