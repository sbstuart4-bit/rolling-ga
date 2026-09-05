import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, Lock, QrCode } from "lucide-react";
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
import { isPostShowPhase, verifiedPostShowStateLabel } from "@/lib/post-show-commerce";
import { requireAuth } from "@/server/auth/request";
import { loadEventPage } from "@/server/events/context";
import { loadPostShowHub } from "@/server/events/post-show";
import { countVerifiedAttendance, listEventContent } from "@/server/events/queries";
import { loadEventShopCatalog } from "@/server/events/shop";
import { getDemoScenarioForEvent } from "@/server/demo/scenario-eligibility";
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

/**
 * One URL carries a fan through the entire life of a show.
 *
 * The state is derived from timestamps and the fan's own verification record, so the
 * same link is a pre-show preview in the morning, a verification prompt at doors, the
 * live experience during the set, a closing window afterwards, and a permanent memory
 * from then on. Nothing has to be republished for the page to change.
 */
export default async function EventPage(props: PageProps<"/event/[slug]">) {
  const { slug } = await props.params;
  const ctx = await requireAuth(`/event/${slug}`);
  const page = await loadEventPage(slug, ctx.userId);

  if (!page) notFound();

  const { event, theme, timing, isVerifiedAttendee, verification } = page;
  const postShow = isPostShowPhase(timing.state);
  const verifiedPostShow = isVerifiedAttendee && postShow;
  const showHubModules = isVerifiedAttendee && timing.state === "live";
  const showLockedPreview = !isVerifiedAttendee && timing.state === "upcoming";

  const loadEventContent = !verifiedPostShow;

  const [content, attendeeCount, postShowHub, shopCatalog, demoScenario] = await Promise.all([
    loadEventContent ? listEventContent(event.id, isVerifiedAttendee) : Promise.resolve([]),
    countVerifiedAttendance(event.id),
    verifiedPostShow ? loadPostShowHub(page, ctx.userId) : Promise.resolve(null),
    showHubModules || showLockedPreview
      ? loadEventShopCatalog(event, ctx.userId)
      : Promise.resolve(null),
    getDemoScenarioForEvent(event.id),
  ]);

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
    isVerifiedAttendee && postShow ? verifiedPostShowStateLabel(timing.state) : undefined;

  return (
    <div>
      <EventHero
        event={event}
        theme={theme}
        state={timing.state}
        stateLabel={heroStateLabel}
        eyebrow={relativeDayLabel(event.startsAt)}
      >
        {isVerifiedAttendee && !postShow && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-artist-accent">
            <BadgeCheck className="size-4" aria-hidden />
            You were verified at this show
          </p>
        )}
      </EventHero>

      {verifiedPostShow && postShowHub ? (
        <PostShowVerifiedExperience slug={slug} page={page} hub={postShowHub} />
      ) : !isVerifiedAttendee && postShow ? (
        <PostShowVisitorExperience
          artistName={event.artistName}
          artistSlug={event.artistSlug}
          city={event.venueCity}
        />
      ) : (
        <div className="mx-auto max-w-lg space-y-6 px-4 pt-6">
          {message && !showHubModules && (
            <p className="display-xl font-artist text-2xl text-artist-fg md:text-3xl">
              {demoScenario?.experience.relationshipTreatment ?? message}
            </p>
          )}

          {demoScenario?.experience.merchOverrideActive && (
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
                isVerifiedAttendee={isVerifiedAttendee}
                verificationOpen={verification.open}
                verificationOpensAt={verification.opensAt}
                postShowClosesAt={timing.postShowClosesAt}
                timezone={event.timezone}
                artistName={event.artistName}
                artistSlug={event.artistSlug}
                city={event.venueCity}
                startsAt={event.startsAt}
              />

              {showLockedPreview && lockedPreviewProducts.length > 0 && (
                <EventLockedMerchPreview
                  eventSlug={slug}
                  artistName={event.artistName}
                  products={lockedPreviewProducts}
                  lockLabel={
                    demoScenario
                      ? merchExperienceLockLabel(demoScenario.experience)
                      : undefined
                  }
                  previewMessage={demoScenario?.experience.primaryMessage}
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

              {!isVerifiedAttendee && timing.state !== "upcoming" && !postShow && (
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

/**
 * The single most important thing to do on this page right now. Exactly one call to
 * action is shown, chosen from the show's state and whether the fan holds a credential.
 */
function PrimaryAction({
  slug,
  state,
  isVerifiedAttendee,
  verificationOpen,
  verificationOpensAt,
  postShowClosesAt,
  timezone,
  artistName,
  artistSlug,
  city,
  startsAt,
}: {
  slug: string;
  state: string;
  isVerifiedAttendee: boolean;
  verificationOpen: boolean;
  verificationOpensAt: Date;
  postShowClosesAt: Date | null;
  timezone: string;
  artistName: string;
  artistSlug: string;
  city: string;
  startsAt: Date;
}) {
  if (isVerifiedAttendee) {
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

  if (verificationOpen) {
    return (
      <ActionCard
        icon={<QrCode className="size-5" aria-hidden />}
        title="Verify you're here"
        body={`Scan the code at the venue or confirm your location to unlock tonight in ${city}.`}
        href={`/event/${slug}/verify`}
        cta="Verify my attendance"
        emphasis
      />
    );
  }

  if (state === "upcoming") {
    return (
      <ActionCard
        icon={<Lock className="size-5" aria-hidden />}
        title="Locked until doors"
        body={`Verification opens ${formatDateTime(verificationOpensAt, timezone)}. Browse what's coming — the attendee-only pieces unlock when you're inside.`}
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
