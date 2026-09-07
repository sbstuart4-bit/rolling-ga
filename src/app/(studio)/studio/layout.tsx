import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { StudioShell } from "@/components/studio/studio-shell";
import { ArtistGuidedDemoAuthGate } from "@/components/demo/artist-guided-demo-auth-gate";
import { ArtistGuidedDemoMobileChrome } from "@/components/demo/artist-guided-demo-mobile-chrome";
import { ArtistGuidedDemoShell } from "@/components/demo/artist-guided-demo-shell";
import type { StudioArtistOption } from "@/components/studio/artist-switcher";
import { demoModeEnabled } from "@/lib/demo-mode";
import {
  GUIDED_DEMO_ENTRY_HEADER,
  parseGuidedDemoQuery,
} from "@/lib/guided-demo-entry";
import { requireAuthWithRole } from "@/server/auth/request";
import { listAllArtists } from "@/server/artists/queries";
import { getAuthContext } from "@/server/auth/session";
import {
  artistGuidedStepContextSummary,
  getActiveArtistGuidedDemoContext,
} from "@/server/demo/artist-guided-demo-state";
import {
  isElenaMarisolDemoSession,
  syncArtistGuidedDemoClock,
} from "@/server/demo/artist-guided-demo-apply";
import { hydrateDemoClockFromCookie } from "@/server/demo/clock";

async function parseArtistGuidedEntryFromHeaders(): Promise<{
  guided: string;
  step: string;
  presenter?: string;
  autoplay?: string;
} | null> {
  const headerStore = await headers();
  const guidedEntry = headerStore.get(GUIDED_DEMO_ENTRY_HEADER);
  if (!guidedEntry) return null;

  try {
    const parsed = parseGuidedDemoQuery(new URL(guidedEntry, "http://local").searchParams);
    if (!parsed || parsed.perspective !== "artist") return null;
    return {
      guided: parsed.journeyId,
      step: String(parsed.step),
      presenter: parsed.presenter ? "1" : undefined,
      autoplay: parsed.autoplay ? "1" : undefined,
    };
  } catch {
    return null;
  }
}

export default async function StudioLayout({ children }: LayoutProps<"/studio">) {
  const pendingGuided = await parseArtistGuidedEntryFromHeaders();
  const existingAuth = await getAuthContext();
  if (pendingGuided && (!existingAuth || !isElenaMarisolDemoSession(existingAuth))) {
    return <ArtistGuidedDemoAuthGate {...pendingGuided} />;
  }

  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], "/studio");

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

  const artistGuidedDemo = await getActiveArtistGuidedDemoContext();
  await hydrateDemoClockFromCookie();
  if (artistGuidedDemo) {
    syncArtistGuidedDemoClock(artistGuidedDemo);
  }

  const guidedContext = artistGuidedDemo
    ? artistGuidedStepContextSummary(artistGuidedDemo.step)
    : null;

  const shell = (
    <StudioShell
      artists={artists}
      activeArtistId={activeArtistId}
      userName={ctx.displayName}
      demoMode={demoModeEnabled()}
      guidedDemoActive={Boolean(artistGuidedDemo)}
    >
      {children}
    </StudioShell>
  );

  if (!artistGuidedDemo || !guidedContext) {
    return shell;
  }

  return (
    <ArtistGuidedDemoShell>
      {shell}
      <ArtistGuidedDemoMobileChrome
        journey={artistGuidedDemo.journey}
        step={artistGuidedDemo.step}
        session={artistGuidedDemo.session}
        totalSteps={artistGuidedDemo.journey.steps.length}
        timeLabel={guidedContext.timeLabel}
        showLabel={guidedContext.showLabel}
      />
    </ArtistGuidedDemoShell>
  );
}
