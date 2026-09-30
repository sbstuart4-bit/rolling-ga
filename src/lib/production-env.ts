/**
 * Production environment guards for hosted deployments.
 *
 * Local development and the Vitest suite intentionally omit these variables so
 * PGlite and demo mode work with zero setup.
 */

export function resolveDatabaseUrl(): string | undefined {
  const url = process.env.ROLLING_GA_DATABASE_URL ?? process.env.DATABASE_URL;
  return url && url.trim().length > 0 ? url : undefined;
}

/**
 * Prefer a direct Postgres URL for migrations and full demo seeds.
 * Transaction-pooler connections can surface FK errors mid-seed when writes
 * and reads land on different pooler backends.
 */
export function resolveBootstrapDatabaseUrl(): string | undefined {
  const explicit = process.env.ROLLING_GA_DATABASE_URL?.trim();
  if (explicit) return explicit;

  const unpooled =
    process.env.DATABASE_URL_UNPOOLED?.trim() ||
    process.env.POSTGRES_URL_NON_POOLING?.trim();
  if (unpooled) return unpooled;

  return resolveDatabaseUrl();
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Throws when production is configured without an external Postgres URL. */
export function assertProductionDatabaseUrl(url = resolveDatabaseUrl()): void {
  if (!isProductionRuntime()) return;
  if (url) return;

  throw new Error(
    "DATABASE_URL or ROLLING_GA_DATABASE_URL must be set in production. PGlite fallback is disabled for hosted deployments.",
  );
}

/** True when the hosted demo board gate must protect passwordless persona login. */
export function hostedDemoBoardGateRequired(): boolean {
  return isProductionRuntime() && process.env.ROLLING_GA_DEMO === "1";
}

export function resolveDemoBoardSecret(): string | undefined {
  const secret = process.env.ROLLING_GA_DEMO_BOARD_SECRET;
  return secret && secret.trim().length >= 16 ? secret.trim() : undefined;
}

/** Throws when production demo mode is enabled without a board access secret. */
export function assertHostedDemoBoardSecret(): void {
  if (!hostedDemoBoardGateRequired()) return;

  if (!resolveDemoBoardSecret()) {
    throw new Error(
      "ROLLING_GA_DEMO_BOARD_SECRET must be set to at least 16 characters when ROLLING_GA_DEMO=1 in production.",
    );
  }
}

/** Validates all production-only environment requirements at process startup. */
export function validateProductionEnvironment(): void {
  assertProductionDatabaseUrl();
  assertHostedDemoBoardSecret();
}
