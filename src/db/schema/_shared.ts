import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  doublePrecision,
  integer,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Timezone-aware instant. Every timestamp in the schema is `timestamptz` so a show in
 * Detroit and a show in London are comparable without the venue timezone being applied
 * twice. `mode: "date"` keeps the application surface as `Date`.
 */
export const timestampCol = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

/**
 * Audit timestamps default in the database rather than in Drizzle, so a row inserted by
 * a migration, a psql session or a future Edge Function is still stamped correctly.
 */
export const createdAt = () => timestampCol("created_at").notNull().defaultNow();

/**
 * `updated_at` is maintained by the `set_updated_at` trigger (see the trigger migration)
 * in addition to Drizzle's `$onUpdateFn`, so writes that bypass the ORM stay correct.
 */
export const updatedAt = () =>
  timestampCol("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date());

/**
 * Marks a row as part of the seeded demo dataset so it can be identified and cleared
 * without touching anything a real user created.
 */
export const isDemo = () => boolean("is_demo").notNull().default(false);

export const boolCol = (name: string) => boolean(name);

/** Money is always stored as an integer number of cents; never a float. */
export const cents = (name: string) => integer(name);

/** Latitude/longitude. Was SQLite `real`. */
export const coord = (name: string) => doublePrecision(name);

/** Structured columns are `jsonb`, not serialised text. */
export const jsonCol = <T>(name: string) => jsonb(name).$type<T>();

/**
 * Constrains an enum-like text column to a known value set.
 *
 * Text + CHECK rather than a Postgres `enum` type: every one of these value sets is
 * still expected to grow before the pilot (payment kinds, verification methods, order
 * statuses), and widening a CHECK is a single `ALTER TABLE` whereas widening an enum
 * type is a far more invasive migration. NULL passes the check, so nullable columns
 * keep their optionality.
 */
export function oneOf(name: string, column: AnyPgColumn, values: readonly string[]) {
  const list = values.map((value) => `'${value}'`).join(", ");
  return check(name, sql.raw(`"${column.name}" IN (${list})`));
}

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
}
