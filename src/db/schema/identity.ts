import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import {
  ARTIST_MEMBER_ROLES,
  type ArtistMemberRole,
  PLATFORM_ROLES,
  type PlatformRole,
} from "@/lib/types";
import { boolCol, createdAt, isDemo, newId, oneOf, timestampCol, updatedAt } from "./_shared";
import { artists } from "./events";

/**
 * The Rolling GA identity. This is the one table whose primary key is a real `uuid`
 * rather than a prefixed text id, because it is the row that will later be mapped
 * one-to-one onto a Supabase `auth.users` record.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    /** The name shown on the fan's Rolling GA ID. */
    displayName: text("display_name").notNull(),
    passwordHash: text("password_hash").notNull(),
    /** Null until the fan finishes the onboarding wizard; gates the /onboarding redirect. */
    onboardingCompletedAt: timestampCol("onboarding_completed_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    isDemo: isDemo(),
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email)],
);

export const userRoles = pgTable(
  "user_roles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("rol")),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").$type<PlatformRole>().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("user_roles_user_role_unique").on(t.userId, t.role),
    index("user_roles_user_idx").on(t.userId),
    oneOf("user_roles_role_check", t.role, PLATFORM_ROLES),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("ses")),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Set when an artist team member is acting inside a specific artist's Studio. */
    activeArtistId: text("active_artist_id"),
    createdAt: createdAt(),
    expiresAt: timestampCol("expires_at").notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId), index("sessions_expires_idx").on(t.expiresAt)],
);

/**
 * Grants a user access to one artist's Studio. This table is the sole source of
 * truth for artist tenancy: every artist-scoped query requires a matching row.
 */
export const artistMembers = pgTable(
  "artist_members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => newId("amb")),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").$type<ArtistMemberRole>().notNull(),
    /** Team members without this may read the Studio but not publish drops or edit brand. */
    canPublish: boolCol("can_publish").notNull().default(true),
    createdAt: createdAt(),
    isDemo: isDemo(),
  },
  (t) => [
    uniqueIndex("artist_members_artist_user_unique").on(t.artistId, t.userId),
    index("artist_members_artist_idx").on(t.artistId),
    index("artist_members_user_idx").on(t.userId),
    oneOf("artist_members_role_check", t.role, ARTIST_MEMBER_ROLES),
  ],
);
