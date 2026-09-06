import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeCheck, Lock, MapPin } from "lucide-react";
import type { FanExperienceState } from "@/lib/fan-experience/access-state";
import { resolveNowNextAction } from "@/lib/fan-experience/now-next";
import { Button } from "@/components/ui/button";
import { formatEventDate, formatEventDateShort, formatEventTime } from "@/lib/format";
import type { EventState } from "@/lib/types";

export function HomeSectionLabel({
  children,
  scoped = false,
}: {
  children: React.ReactNode;
  scoped?: boolean;
}) {
  return (
    <h2 className={scoped ? "eyebrow mb-3 text-artist-muted" : "eyebrow mb-3 text-muted-foreground"}>
      {children}
    </h2>
  );
}

export function HomeFeaturedShow({
  event,
  hero,
  fanExperience,
  slug,
  timingState,
  scoped = false,
  postShowClosesAt = null,
  artistSlug,
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
  fanExperience: FanExperienceState;
  slug: string;
  timingState: EventState;
  scoped?: boolean;
  postShowClosesAt?: Date | null;
  artistSlug?: string;
}) {
  const action = resolveNowNextAction({
    access: fanExperience.access,
    slug,
    artistName: event.artistName,
    city: event.venueCity,
    startsAt: event.startsAt,
    timezone: event.timezone,
    teaserMessage: fanExperience.experience?.primaryMessage,
    timingState,
    postShowClosesAt,
    artistSlug,
  });

  return (
    <section className="relative">
      <HomeSectionLabel scoped={scoped}>{action.eyebrow}</HomeSectionLabel>

      {hero && (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
          <Image src={hero} alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 hero-gradient-overlay-home" aria-hidden />
        </div>
      )}

      <div className={hero ? "-mt-14 relative px-1 pb-2" : "pb-2"}>
        <h1 className="display-xl text-4xl md:text-5xl">{event.artistName}</h1>
        <p
          className={
            scoped
              ? "mt-2 text-sm font-medium uppercase tracking-wider text-artist-muted"
              : "mt-2 text-sm font-medium uppercase tracking-wider text-muted-foreground"
          }
        >
          {event.venueCity.toUpperCase()} &middot; {event.venueName.toUpperCase()}
        </p>
        <p className={scoped ? "mt-1 text-sm text-artist-muted" : "mt-1 text-sm text-muted-foreground"}>
          {formatEventDate(event.startsAt, event.timezone)} &middot;{" "}
          {formatEventTime(event.startsAt, event.timezone)}
        </p>
      </div>

      <div
        className={
          scoped
            ? "mt-4 space-y-3 rounded-2xl border border-artist-border bg-artist-surface p-5"
            : "mt-4 space-y-3 rounded-2xl border border-border bg-card p-5"
        }
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 text-artist-accent">
            {fanExperience.access === "live_unlocked" || fanExperience.access === "postshow_open" ? (
              <BadgeCheck className="size-5" aria-hidden />
            ) : (
              <Lock className="size-5" aria-hidden />
            )}
          </span>
          <div className="space-y-1">
            <p className="font-display text-lg tracking-wide">{action.title}</p>
            <p className="text-sm text-muted-foreground">{action.body}</p>
          </div>
        </div>
        {action.showCta && action.cta ? (
          <Button
            asChild
            variant={action.emphasis ? "moment" : "outline"}
            size="lg"
            className={
              action.emphasis
                ? "w-full"
                : "w-full border-foreground/20 bg-transparent uppercase tracking-wider"
            }
          >
            <Link href={action.href}>
              {action.cta}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        ) : null}
      </div>
    </section>
  );
}

export function HomeUpcomingSection({
  events,
  excludeSlug,
  scoped = false,
}: {
  events: Array<{
    slug: string;
    artistName: string;
    venueCity: string;
    startsAt: Date;
    timezone: string;
  }>;
  excludeSlug?: string;
  scoped?: boolean;
}) {
  const list = events.filter((event) => event.slug !== excludeSlug).slice(0, 3);
  if (list.length === 0) return null;

  return (
    <section>
      <HomeSectionLabel scoped={scoped}>Upcoming</HomeSectionLabel>
      <ul className="space-y-2">
        {list.map((event) => (
          <li key={event.slug}>
            <Link
              href={`/event/${event.slug}`}
              className={
                scoped
                  ? "flex items-center gap-3 rounded-xl border border-artist-border bg-artist-surface px-4 py-3 transition-colors hover:border-artist-accent/40"
                  : "flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40"
              }
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
