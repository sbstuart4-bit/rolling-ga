import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatEventDate } from "@/lib/format";
import { requireAuth } from "@/server/auth/request";
import { getArtistBySlug } from "@/server/artists/queries";
import { listUpcomingEventsForArtist } from "@/server/events/queries";
import { demoNow } from "@/server/demo/clock";

export async function generateMetadata(props: PageProps<"/artist/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const artist = await getArtistBySlug(slug);
  return artist ? { title: `${artist.name} — Rolling GA` } : { title: "Artist not found" };
}

export default async function ArtistPage(props: PageProps<"/artist/[slug]">) {
  const { slug } = await props.params;
  await requireAuth(`/artist/${slug}`);

  const artist = await getArtistBySlug(slug);
  if (!artist) notFound();

  const now = demoNow();
  const upcoming = await listUpcomingEventsForArtist(artist.id, 12, now);

  return (
    <div className="mx-auto max-w-lg space-y-8 px-5 pb-10 pt-6">
      <header className="space-y-2">
        <p className="eyebrow text-muted-foreground">Artist</p>
        <h1 className="font-display text-3xl tracking-wide">{artist.name}</h1>
        {artist.bio && <p className="text-sm text-muted-foreground">{artist.bio}</p>}
      </header>

      <section className="space-y-3">
        <h2 className="eyebrow text-muted-foreground">Upcoming shows</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-5 py-10 text-center">
            <p className="font-medium">No upcoming shows</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Check back when {artist.name} announces new dates.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((event) => (
              <li key={event.slug}>
                <Link
                  href={`/event/${event.slug}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{event.tourName}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3 shrink-0" aria-hidden />
                      {event.venueCity} · {event.venueName}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatEventDate(event.startsAt, event.timezone)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Button asChild variant="outline" className="w-full">
        <Link href="/">Back to Live</Link>
      </Button>
    </div>
  );
}
