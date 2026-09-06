import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { PassportStatsBar } from "@/components/fan/passport-stats-bar";
import { ShowsTabs, type ShowEntry } from "@/components/fan/shows-tabs";
import { requireAuth } from "@/server/auth/request";
import { loadPassportWithAccess } from "@/server/fans/passport-access";
import { resolveEventState } from "@/lib/event-state";
import { getActiveDemoScenarioContext } from "@/server/demo/scenario-state";
import { demoNow } from "@/server/demo/clock";

export const metadata: Metadata = { title: "My Shows — Rolling GA" };

export default async function MyShowsPage() {
  const ctx = await requireAuth("/shows");
  const [passport, demoScenario] = await Promise.all([
    loadPassportWithAccess(ctx.userId),
    getActiveDemoScenarioContext(),
  ]);
  const now = demoNow();
  const welcomeBack =
    demoScenario?.scenario.fanHistory === "second_show" &&
    demoScenario.scenario.fanState === "attended";

  const shows: ShowEntry[] = passport.map((entry) => {
    const state = resolveEventState(
      {
        startsAt: entry.startsAt,
        endsAt: entry.endsAt,
        postShowWindowMinutes: entry.postShowWindowMinutes,
        cancelled: entry.cancelled,
      },
      entry.tourWindowMinutes,
      now,
    );
    return {
      credentialId: entry.credentialId,
      slug: entry.slug,
      artistName: entry.artistName,
      venueCity: entry.venueCity,
      venueName: entry.venueName,
      startsAt: entry.startsAt.toISOString(),
      timezone: entry.timezone,
      isPast: state.state !== "upcoming",
      unlockCount: entry.access.unlockCount,
    };
  });

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-10 border-b border-border bg-[#121212]/95 px-5 py-4 backdrop-blur">
        <h1 className="font-display text-xl tracking-wider">My Shows</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {welcomeBack
            ? "Welcome back — your show history and credentials live here"
            : "My access — credentials and ongoing unlocks"}
        </p>
      </header>

      {shows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-5 px-5 py-24 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-card text-4xl">🎵</div>
          <div className="space-y-2">
            <h2 className="font-display text-lg">No shows yet</h2>
            <p className="text-sm text-muted-foreground text-balance">
              Verify at a show and it appears here permanently — your concert passport.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground"
          >
            <CalendarDays className="size-4" aria-hidden />
            Browse shows
          </Link>
        </div>
      ) : (
        <div className="space-y-5 px-5 py-5">
          <PassportStatsBar shows={shows} />
          <ShowsTabs shows={shows} />
        </div>
      )}
    </div>
  );
}
