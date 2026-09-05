import { EventHero } from "@/components/fan/event-hero";
import { ArtistThemeScope } from "@/components/artist/artist-takeover";
import type { EventRow } from "@/server/events/queries";
import type { EventStateResult } from "@/lib/event-state";
import type { ResolvedTheme } from "@/lib/theme";

/** Mobile-width fan preview using real Artist Takeover tokens and EventHero. */
export function ShowFanPreview({
  event,
  theme,
  timing,
}: {
  event: EventRow;
  theme: ResolvedTheme;
  timing: EventStateResult;
}) {
  return (
    <div className="mx-auto w-[300px] shrink-0">
      <p className="mb-2 text-center text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Fan preview
      </p>
      <div className="overflow-hidden rounded-[2rem] border border-border bg-zinc-950 shadow-2xl">
        <ArtistThemeScope theme={theme} className="max-h-[560px] overflow-y-auto">
          <EventHero
            event={event}
            theme={theme}
            state={timing.state}
            eyebrow={event.tourName}
          />
          <div className="px-4 pb-6">
            {(theme.localMessage || theme.showMessaging) && (
              <p className="rounded-xl border border-artist-border bg-artist-surface px-4 py-3 text-sm text-artist-muted">
                {theme.localMessage ?? theme.showMessaging}
              </p>
            )}
          </div>
        </ArtistThemeScope>
      </div>
    </div>
  );
}
