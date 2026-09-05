import type { ShowEntry } from "@/components/fan/shows-tabs";

export function PassportStatsBar({ shows }: { shows: ShowEntry[] }) {
  const pastShows = shows.filter((show) => show.isPast);
  const artists = new Set(pastShows.map((show) => show.artistName));
  const cities = new Set(pastShows.map((show) => show.venueCity));

  if (pastShows.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card px-4 py-4 text-center">
      <Stat value={pastShows.length} label="Shows" />
      <Stat value={artists.size} label="Artists" />
      <Stat value={cities.size} label="Cities" />
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="space-y-0.5">
      <p className="font-display text-2xl tracking-wide">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
