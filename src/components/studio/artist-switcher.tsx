"use client";

import { switchArtistAction } from "@/server/auth/actions";
import { ARTIST_MEMBER_ROLE_LABELS } from "@/lib/studio";
import type { ArtistMemberRole } from "@/lib/types";

export interface StudioArtistOption {
  id: string;
  name: string;
  role: ArtistMemberRole | "rga_admin";
}

/**
 * Switching artists writes to the session rather than a URL parameter, so the choice
 * survives navigation and can never be used to reach an artist the member lacks a
 * membership row for — the action re-checks membership server-side.
 */
export function ArtistSwitcher({
  artists,
  activeArtistId,
}: {
  artists: StudioArtistOption[];
  activeArtistId: string | null;
}) {
  const active = artists.find((a) => a.id === activeArtistId) ?? artists[0];

  if (!active) {
    return (
      <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
        No artist is linked to this account.
      </p>
    );
  }

  if (artists.length === 1) {
    return (
      <div className="rounded-lg border border-sidebar-border bg-background px-3 py-2.5">
        <p className="truncate text-sm font-semibold">{active.name}</p>
        <p className="text-xs text-muted-foreground">
          {active.role === "rga_admin" ? "Rolling GA Admin" : ARTIST_MEMBER_ROLE_LABELS[active.role]}
        </p>
      </div>
    );
  }

  return (
    <form action={switchArtistAction} className="space-y-1.5">
      <label htmlFor="studio-artist" className="eyebrow block text-muted-foreground">
        Artist
      </label>
      <select
        id="studio-artist"
        name="artistId"
        defaultValue={active.id}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="w-full rounded-lg border border-sidebar-border bg-background px-3 py-2 text-sm"
      >
        {artists.map((artist) => (
          <option key={artist.id} value={artist.id}>
            {artist.name}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="text-xs underline">
          Switch
        </button>
      </noscript>
    </form>
  );
}
