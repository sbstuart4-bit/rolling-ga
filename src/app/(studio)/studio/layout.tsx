import { redirect } from "next/navigation";
import { StudioShell } from "@/components/studio/studio-shell";
import type { StudioArtistOption } from "@/components/studio/artist-switcher";
import { demoModeEnabled } from "@/lib/demo-mode";
import { requireAuthWithRole } from "@/server/auth/request";
import { listAllArtists } from "@/server/artists/queries";

export default async function StudioLayout({ children }: LayoutProps<"/studio">) {
  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], "/studio");

  // Admins can act on behalf of any artist; everyone else sees only their memberships.
  const artists: StudioArtistOption[] = ctx.roles.includes("rga_admin")
    ? (await listAllArtists()).map((a) => ({ id: a.id, name: a.name, role: "rga_admin" as const }))
    : ctx.memberships.map((m) => ({ id: m.artistId, name: m.artistName, role: m.role }));

  if (artists.length === 0) {
    redirect("/no-access?need=artist_member");
  }

  const activeArtistId =
    ctx.activeArtistId && artists.some((a) => a.id === ctx.activeArtistId)
      ? ctx.activeArtistId
      : artists[0].id;

  return (
    <StudioShell
      artists={artists}
      activeArtistId={activeArtistId}
      userName={ctx.displayName}
      demoMode={demoModeEnabled()}
    >
      {children}
    </StudioShell>
  );
}
