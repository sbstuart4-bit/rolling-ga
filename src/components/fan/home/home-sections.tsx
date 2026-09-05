import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, ChevronRight, MapPin, QrCode, Timer } from "lucide-react";
import { FlashDropCountdown } from "@/components/fan/flash-drop-countdown";
import { Button } from "@/components/ui/button";
import { formatEventDate, formatEventDateShort, formatEventTime } from "@/lib/format";
import { demoNow } from "@/server/demo/clock";

export function HomeSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="eyebrow mb-3 text-muted-foreground">{children}</h2>
  );
}

export function HomeFeaturedShow({
  event,
  hero,
  isVerified,
  verificationOpen,
  slug,
  isLive = true,
}: {
  event: {
    artistName: string;
    venueCity: string;
    venueName: string;
    startsAt: Date;
    timezone: string;
    tourName: string;
  };
  hero: string | null;
  isVerified: boolean;
  verificationOpen: boolean;
  slug: string;
  isLive?: boolean;
}) {
  return (
    <section className="relative">
      <HomeSectionLabel>{isLive ? "Live now" : "Upcoming"}</HomeSectionLabel>

      {hero && (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
          <Image src={hero} alt="" fill priority sizes="100vw" className="object-cover" />
          <div
            className="absolute inset-0 hero-gradient-overlay-home"
            aria-hidden
          />
        </div>
      )}

      <div className={hero ? "-mt-14 relative px-1 pb-2" : "pb-2"}>
        <h1 className="display-xl text-4xl md:text-5xl">{event.artistName}</h1>
        <p className="mt-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          {event.venueCity.toUpperCase()} &middot; {event.venueName.toUpperCase()}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatEventDate(event.startsAt, event.timezone)} &middot;{" "}
          {formatEventTime(event.startsAt, event.timezone)}
        </p>
      </div>

      <div className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-5">
        {isVerified ? (
          <>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                <BadgeCheck className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-display text-lg tracking-wide">You&rsquo;re in</p>
                <p className="text-sm text-muted-foreground">Your attendance is verified.</p>
              </div>
            </div>
            <Button asChild variant="moment" size="lg">
              <Link href={`/event/${slug}`}>Enter the show</Link>
            </Button>
          </>
        ) : verificationOpen ? (
          <>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <QrCode className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-display text-lg tracking-wide">Verify you&rsquo;re here</p>
                <p className="text-sm text-muted-foreground">
                  Scan the code at the venue to unlock tonight&rsquo;s experience.
                </p>
              </div>
            </div>
            <Button asChild variant="moment" size="lg">
              <Link href={`/event/${slug}/verify`}>Verify my attendance</Link>
            </Button>
          </>
        ) : (
          <>
            <p className="font-display text-lg tracking-wide">Doors soon</p>
            <p className="text-sm text-muted-foreground">
              Verification opens when you&rsquo;re at the venue.
            </p>
            <Button asChild variant="outline" className="w-full border-foreground/20 bg-transparent uppercase tracking-wider">
              <Link href={`/event/${slug}`}>Preview the show</Link>
            </Button>
          </>
        )}
      </div>
    </section>
  );
}

export function HomeUpcomingSection({
  events,
  excludeSlug,
}: {
  events: Array<{
    slug: string;
    artistName: string;
    venueCity: string;
    startsAt: Date;
    timezone: string;
  }>;
  excludeSlug?: string;
}) {
  const list = events.filter((event) => event.slug !== excludeSlug).slice(0, 3);
  if (list.length === 0) return null;

  return (
    <section>
      <HomeSectionLabel>Upcoming</HomeSectionLabel>
      <ul className="space-y-2">
        {list.map((event) => (
          <li key={event.slug}>
            <Link
              href={`/event/${event.slug}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{event.artistName}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3 shrink-0" aria-hidden />
                  {event.venueCity}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatEventDate(event.startsAt, event.timezone)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function HomeDropsSection({
  drops,
  eventSlug,
}: {
  drops: Array<{
    slug: string;
    title: string;
    artworkUrl: string | null;
    endsAt: Date | null;
    artistId: string;
    artistName: string;
  }>;
  eventSlug?: string;
}) {
  if (drops.length === 0) return null;

  const now = demoNow();

  return (
    <section>
      <HomeSectionLabel>New drops</HomeSectionLabel>
      <ul className="space-y-3">
        {drops.slice(0, 4).map((drop) => {
          const href = eventSlug
            ? `/drop/${drop.slug}?artistId=${drop.artistId}&e=${eventSlug}`
            : `/drop/${drop.slug}?artistId=${drop.artistId}`;

          return (
            <li key={drop.slug}>
              <Link
                href={href}
                className="flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-accent/30"
              >
                {drop.artworkUrl ? (
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                    <Image src={drop.artworkUrl} alt="" fill className="object-cover" sizes="64px" />
                  </div>
                ) : (
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">
                    🎁
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{drop.title}</p>
                  <p className="text-sm text-muted-foreground">{drop.artistName}</p>
                  {drop.endsAt && drop.endsAt > now && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-primary">
                      <Timer className="size-3" aria-hidden />
                      <FlashDropCountdown endsAt={drop.endsAt.toISOString()} />
                    </p>
                  )}
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function HomeMyShowsPreview({
  shows,
}: {
  shows: Array<{
    slug: string;
    artistName: string;
    venueCity: string;
    startsAt: Date;
    timezone: string;
  }>;
}) {
  if (shows.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <HomeSectionLabel>My shows</HomeSectionLabel>
        <Link href="/shows" className="text-xs font-semibold uppercase tracking-wider text-primary">
          View all
        </Link>
      </div>
      <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {shows.slice(0, 5).map((show) => (
          <li key={show.slug} className="w-40 shrink-0">
            <Link
              href={`/event/${show.slug}/credential`}
              className="block rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
            >
              <p className="truncate text-sm font-medium">{show.artistName}</p>
              <p className="truncate text-xs text-muted-foreground">{show.venueCity}</p>
              <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                {formatEventDateShort(new Date(show.startsAt), show.timezone)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
