import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, Lock } from "lucide-react";
import { EventHero } from "@/components/fan/event-hero";
import { EventContentList } from "@/components/fan/event-content-list";
import { EventHubModules } from "@/components/fan/event-hub-modules";
import { EventLockedMerchPreview } from "@/components/fan/event-locked-merch-preview";
import {
  PostShowVerifiedExperience,
  PostShowVisitorExperience,
} from "@/components/fan/post-show-experience";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatEventDate, relativeDayLabel } from "@/lib/format";
import {
  buildEventHubModuleData,
  buildLockedPreviewProducts,
} from "@/lib/event-hub-present";
import type { FanExperienceState } from "@/lib/fan-experience/access-state";
import {
  canPreviewShop,
  hasEarnedCredential,
} from "@/lib/fan-experience/access-state";
import { scenarioFanIsGoing } from "@/lib/fan-experience/now-next";
import { isPostShowPhase, verifiedPostShowStateLabel } from "@/lib/post-show-commerce";
import { requireAuth } from "@/server/auth/request";
import { demoNow } from "@/server/demo/clock";
import { loadEventPage } from "@/server/events/context";
import { loadPostShowHub } from "@/server/events/post-show";
import { countVerifiedAttendance, listEventContent } from "@/server/events/queries";
import { loadEventShopCatalog } from "@/server/events/shop";
import { merchExperienceLockLabel } from "@/lib/merch-experience/resolver";

export async function generateMetadata(props: PageProps<"/event/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const ctx = await requireAuth();
  const page = await loadEventPage(slug, ctx.userId);
  if (!page) return { title: "Show not found" };

  return {
    title: `${page.event.artistName} · ${page.event.venueCity}`,
    description: page.event.localMessage ?? page.theme.showMessaging ?? undefined,
  };
}

export default async function EventPage(props: PageProps<"/event/[slug]">) {
  const { slug } = await props.params;
  const ctx = await requireAuth(`/event/${slug}`);
  const page = await loadEventPage(slug, ctx.userId);

  if (!page) notFound();

  const { event, theme, timing, fanExperience } = page;
  const hasCredential = hasEarnedCredential(fanExperience);
  const postShow = isPostShowPhase(timing.state);
  const verifiedPostShow = hasCredential && postShow;
  const showHubModules = hasCredential && timing.state === "live";
  const loadEventContent = !verifiedPostShow;

  const mightNeedShopCatalog =
    showHubModules ||
    (!hasCredential &&
      (timing.state === "upcoming" || fanExperience.access === "preview_locked"));

  const [content, attendeeCount, postShowHub, shopCatalog] = await Promise.all([
    loadEventContent ? listEventContent(event.id, hasCredential) : Promise.resolve([]),
    countVerifiedAttendance(event.id),
    verifiedPostShow ? loadPostShowHub(page, ctx.userId) : Promise.resolve(null),
    mightNeedShopCatalog ? loadEventShopCatalog(event, ctx.userId) : Promise.resolve(null),
  ]);

  const previewShop = canPreviewShop(fanExperience.access);
  const showLockedPreview =
    fanExperience.access === "preview_locked" && timing.state === "upcoming";

  const hubModules =
    showHubModules && shopCatalog
      ? buildEventHubModuleData(shopCatalog, content.length)
      : null;
  const lockedPreviewProducts =
    showLockedPreview && shopCatalog
      ? buildLockedPreviewProducts(shopCatalog, event.artistId)
      : [];

  const message = event.localMessage ?? theme.showMessaging;
  const heroStateLabel =
    hasCredential && postShow ? verifiedPostShowStateLabel(timing.state) : undefined;
  const relationshipMessage = fanExperience.experience?.relationshipTreatment;

  return (
    <div>
      <EventHero
        event={event}
        theme={theme}
        state={timing.state}
        stateLabel={heroStateLabel}
        eyebrow={relativeDayLabel(event.startsAt, demoNow())}
      >
        {hasCredential && !postShow && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-artist-accent">
            <BadgeCheck className="size-4" aria-hidden />
            You were verified at this show
          </p>
        )}
      </EventHero>

      {verifiedPostShow && postShowHub ? (
        <PostShowVerifiedExperience slug={slug} page={page} hub={postShowHub} />
      ) : !hasCredential && postShow ? (
        <PostShowVisitorExperience
          artistName={event.artistName}
          artistSlug={event.artistSlug}
          city={event.venueCity}
        />
      ) : (
        <div className="mx-auto max-w-lg space-y-6 px-4 pt-6">
          {scenarioFanIsGoing(fanExperience) && (
            <p className="inline-flex w-fit items-center gap-1.5 rounded-full border border-artist-accent/30 bg-artist-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-artist-accent">
              You&apos;re going
            </p>
          )}

          {message && !showHubModules && (
            <p className="display-xl font-artist text-2xl text-artist-fg md:text-3xl">
              {relationshipMessage ?? message}
            </p>
          )}

          {fanExperience.experience?.merchOverrideActive && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              Demo merch override active
            </p>
          )}

          {showHubModules && hubModules ? (
            <>
              <EventHubModules slug={slug} data={hubModules} />

              <dl className="grid grid-cols-2 gap-3">
                <Fact label="Verified" value={attendeeCount.toLocaleString("en-US")} />
                <Fact label="Venue" value={event.venueName} />
                <Fact label="Date" value={formatEventDate(event.startsAt, event.timezone)} />
                <Fact label="Tour" value={event.tourName} />
              </dl>

              {content.length > 0 && (
                <div id="from-the-night">
                  <EventContentList content={content} />
                </div>
              )}
            </>
          ) : (
            <>
              <PrimaryAction
                slug={slug}
                state={timing.state}
                fanExperience={fanExperience}
                postShowClosesAt={timing.postShowClosesAt}
                timezone={event.timezone}
                artistName={event.artistName}
                artistSlug={event.artistSlug}
                city={event.venueCity}
                startsAt={event.startsAt}
                canPreviewShop={previewShop}
              />

              {showLockedPreview && lockedPreviewProducts.length > 0 && (
                <EventLockedMerchPreview
                  eventSlug={slug}
                  artistName={event.artistName}
                  products={lockedPreviewProducts}
                  lockLabel={
                    fanExperience.experience
                      ? merchExperienceLockLabel(fanExperience.experience)
                      : undefined
                  }
                  previewMessage={fanExperience.experience?.primaryMessage}
                />
              )}

              <dl className="grid grid-cols-2 gap-3">
                <Fact label="Verified" value={attendeeCount.toLocaleString("en-US")} />
                <Fact label="Venue" value={event.venueName} />
                <Fact label="Date" value={formatEventDate(event.startsAt, event.timezone)} />
                <Fact label="Tour" value={event.tourName} />
              </dl>

              {content.length > 0 && (
                <div id="from-the-night">
                  <EventContentList content={content} />
                </div>
              )}

              {!hasCredential && timing.state !== "upcoming" && !postShow && (
                <p className="text-sm text-artist-muted">
                  Some of what {event.artistName} put here is only for people who were in the room.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-artist-border bg-artist-surface px-3.5 py-3">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-artist-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium leading-snug text-artist-fg break-words">{value}</dd>
    </div>
  );
}

function PrimaryAction({
  slug,
  state,
  fanExperience,
  postShowClosesAt,
  timezone,
  artistName,
  artistSlug,
  city,
  startsAt,
  canPreviewShop: previewShop,
}: {
  slug: string;
  state: string;
  fanExperience: FanExperienceState;
  postShowClosesAt: Date | null;
  timezone: string;
  artistName: string;
  artistSlug: string;
  city: string;
  startsAt: Date;
  canPreviewShop: boolean;
}) {
  const access = fanExperience.access;
  const teaserMessage = fanExperience.experience?.primaryMessage;

  if (access === "postshow_open" || (hasEarnedCredential(fanExperience) && access !== "history_only")) {
    return (
      <ActionCard
        icon={<BadgeCheck className="size-5" aria-hidden />}
        title="You're in"
        body={`Your credential is live. Everything ${artistName} made for tonight is unlocked.`}
        href={`/event/${slug}/credential`}
        cta="View your credential"
      />
    );
  }

  if (access === "live_unlocked") {
    return (
      <ActionCard
        icon={<BadgeCheck className="size-5" aria-hidden />}
        title="You're in the room"
        body="Tonight's show exclusives are unlocked. Shop without the merch line."
        href={`/event/${slug}/shop`}
        cta="Open tonight's shop"
        emphasis
      />
    );
  }

  if (access === "history_only") {
    return (
      <ActionCard
        icon={<BadgeCheck className="size-5" aria-hidden />}
        title="You were there"
        body={`Your ${city} credential and show history remain in My Shows.`}
        href={`/event/${slug}/credential`}
        cta="View your credential"
      />
    );
  }

  if (state === "upcoming") {
    if (access === "discover_only") {
      return (
        <DiscoverShowCard
          startsAt={startsAt}
          timezone={timezone}
          city={city}
          message={
            teaserMessage ??
            `${artistName} is coming to ${city}. Merch opens closer to show night.`
          }
        />
      );
    }

    if (!previewShop) {
      return (
        <ActionCard
          icon={<Lock className="size-5" aria-hidden />}
          title="Show coming soon"
          body={`${formatEventDate(startsAt, timezone)} in ${city}. Tour merch is open on Drops — show exclusives unlock closer to doors.`}
          href={`/drops?e=${slug}`}
          cta="Browse tour merch"
        />
      );
    }

    return (
      <ActionCard
        icon={<Lock className="size-5" aria-hidden />}
        title="Locked until you're inside"
        body={`${formatEventDate(startsAt, timezone)} in ${city}. Preview what's waiting — show exclusives unlock when you're inside the venue.`}
        href={`/event/${slug}/shop`}
        cta="Preview the merch"
      />
    );
  }

  return (
    <ActionCard
      icon={<Lock className="size-5" aria-hidden />}
      title="This one's closed"
      body={
        postShowClosesAt
          ? `Verification for ${city} closed ${formatDateTime(postShowClosesAt, timezone)}.`
          : `${formatEventDate(startsAt, timezone)} in ${city} has been archived. Credentials can only be earned at the show.`
      }
      href={`/artist/${artistSlug}`}
      cta={`See ${artistName}'s upcoming shows`}
    />
  );
}

function DiscoverShowCard({
  startsAt,
  timezone,
  city,
  message,
}: {
  startsAt: Date;
  timezone: string;
  city: string;
  message: string;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-artist-border bg-artist-surface p-5">
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 size-5 shrink-0 text-artist-accent" aria-hidden />
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-artist-fg">Discover the show</h2>
          <p className="text-sm text-artist-muted">
            {formatEventDate(startsAt, timezone)} in {city}. {message}
          </p>
        </div>
      </div>
    </section>
  );
}

function ActionCard({
  icon,
  title,
  body,
  href,
  cta,
  emphasis = false,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  href: string;
  cta: string;
  emphasis?: boolean;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-artist-border bg-artist-surface p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-artist-accent">{icon}</span>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-artist-fg">{title}</h2>
          <p className="text-sm text-artist-muted">{body}</p>
        </div>
      </div>

      <Button
        asChild
        size="lg"
        variant={emphasis ? "default" : "outline"}
        className={
          emphasis
            ? "h-13 w-full bg-artist-accent text-base font-semibold text-artist-accent-fg hover:bg-artist-accent/90"
            : "w-full border-artist-border bg-transparent text-artist-fg hover:bg-artist-accent/10"
        }
      >
        <Link href={href}>
          {cta}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Button>
    </section>
  );
}
