/**
 * Postgres error codes the application actually branches on.
 *
 * Driver wrappers (postgres-js, PGlite, Drizzle) sometimes nest the original error,
 * so callers should use these helpers rather than reading `.code` themselves.
 */

export const PG_UNIQUE_VIOLATION = "23505";
export const PG_FOREIGN_KEY_VIOLATION = "23503";
export const PG_CHECK_VIOLATION = "23514";
export const PG_INVALID_TEXT_REPRESENTATION = "22P02";

export function sqlStateOf(error: unknown): string | undefined {
  let current: unknown = error;
  for (let depth = 0; current != null && depth < 6; depth++) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string" && /^[0-9A-Z]{5}$/.test(code)) return code;
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
}

export function isUniqueViolation(error: unknown): boolean {
  return sqlStateOf(error) === PG_UNIQUE_VIOLATION;
}
