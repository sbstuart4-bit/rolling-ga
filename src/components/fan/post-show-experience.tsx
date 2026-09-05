import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Package,
  ShoppingBag,
  Sparkles,
  Store,
} from "lucide-react";
import { PostShowStoreCountdown } from "@/components/fan/post-show-store-countdown";
import { StayConnectedCard } from "@/components/fan/stay-connected-card";
import { EventContentList } from "@/components/fan/event-content-list";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import type { EventPageContext } from "@/server/events/context";
import type { PostShowHubData } from "@/server/events/post-show";

/**
 * Verified fan experience after the set — thank-you tone, credential, and post-show commerce.
 */
export function PostShowVerifiedExperience({
  slug,
  page,
  hub,
}: {
  slug: string;
  page: EventPageContext;
  hub: PostShowHubData;
}) {
  const { event, timing } = page;
  const city = event.venueCity.toUpperCase();
  const hasShop =
    hub.storeOpen && (hub.purchasableDropCount > 0 || hub.purchasableProductCount > 0);
  const postShowContent = hub.content.filter((row) =>
    ["thank_you", "artist_message", "video_link", "photo", "setlist"].includes(row.kind),
  );

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 pt-6">
      <section className="space-y-3 text-center">
        <p className="eyebrow text-artist-accent">Thank you, {city}.</p>
        <h2 className="display-xl font-artist text-3xl text-artist-fg md:text-4xl">
          You were there
          <BadgeCheck className="ml-2 inline size-7 text-artist-accent" aria-hidden />
        </h2>
        <p className="mx-auto max-w-md text-sm text-artist-muted text-balance">
          Your credential is permanent. Everything here stays in your passport even after
          tonight&apos;s store closes.
        </p>
      </section>

      <section className="rounded-2xl border border-artist-border bg-artist-surface p-5">
        <div className="flex items-start gap-3">
          <BadgeCheck className="mt-0.5 size-5 shrink-0 text-artist-accent" aria-hidden />
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="font-semibold text-artist-fg">Your digital credential</h3>
            <p className="text-sm text-artist-muted">
              Verified at {event.venueName} · {event.venueCity}
            </p>
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          className="mt-4 w-full border-artist-border bg-transparent text-artist-fg hover:bg-artist-accent/10"
        >
          <Link href={`/event/${slug}/credential`}>
            View credential
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </section>

      {timing.state === "recently_ended" && timing.postShowClosesAt && (
        <section className="rounded-2xl border border-artist-accent/30 bg-artist-accent/10 px-5 py-4 text-center">
          <p className="text-sm text-artist-muted">
            Your attendee-exclusive store remains open for{" "}
            <PostShowStoreCountdown closesAt={timing.postShowClosesAt.toISOString()} />
          </p>
        </section>
      )}

      {hasShop && (
        <section className="space-y-4 rounded-2xl border border-artist-border bg-artist-surface p-5">
          <div className="flex items-start gap-3">
            <Store className="mt-0.5 size-5 shrink-0 text-artist-accent" aria-hidden />
            <div className="space-y-1">
              <h3 className="font-semibold text-artist-fg">Complete your collection</h3>
              <p className="text-sm text-artist-muted">
                Attendee-exclusive pieces and post-show drops are still available while the
                window is open.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="lg"
            className="h-12 w-full bg-artist-accent font-semibold text-artist-accent-fg hover:bg-artist-accent/90"
          >
            <Link href={`/event/${slug}/shop`}>
              <ShoppingBag className="size-4" aria-hidden />
              Shop the attendee store
            </Link>
          </Button>
        </section>
      )}

      {!hub.storeOpen && (
        <section className="rounded-2xl border border-artist-border bg-artist-surface px-5 py-4 text-sm text-artist-muted">
          The attendee store for this show has closed. Your credential and purchases remain
          here permanently.
        </section>
      )}

      {hub.orders.length > 0 && (
        <section className="space-y-3">
          <h3 className="eyebrow text-artist-muted">What you took home</h3>
          <ul className="divide-y divide-artist-border rounded-2xl border border-artist-border bg-artist-surface">
            {hub.orders.map((item) => (
              <li key={`${item.orderId}-${item.name}-${item.size ?? ""}`} className="flex items-center gap-3 p-4">
                <Package className="size-4 shrink-0 text-artist-muted" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-artist-fg">{item.name}</p>
                  <p className="text-xs text-artist-muted">
                    {[item.size, `Qty ${item.quantity}`].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className="tabular text-sm font-medium text-artist-fg">
                  {formatMoney(item.totalCents)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {postShowContent.length > 0 && <EventContentList content={postShowContent} />}

      <StayConnectedCard
        artistId={event.artistId}
        artistName={event.artistName}
        eventSlug={slug}
        initialState={hub.stayConnectedState}
      />

      <div className="space-y-2 pb-4">
        <Button
          asChild
          variant="outline"
          className="w-full border-artist-border bg-transparent text-artist-fg hover:bg-artist-accent/10"
        >
          <Link href="/shows">
            <Sparkles className="size-4" aria-hidden />
            My Shows
          </Link>
        </Button>
      </div>
    </div>
  );
}

/** Ended-show state for fans who were not verified. */
export function PostShowVisitorExperience({
  artistName,
  artistSlug,
  city,
}: {
  artistName: string;
  artistSlug: string;
  city: string;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 pt-6">
      <section className="rounded-2xl border border-artist-border bg-artist-surface p-5">
        <h2 className="text-base font-semibold text-artist-fg">This show has ended</h2>
        <p className="mt-2 text-sm text-artist-muted text-balance">
          {artistName} in {city} is now a memory for the fans who were verified inside.
          Credentials can only be earned at the venue during the show window.
        </p>
        <Button
          asChild
          variant="outline"
          className="mt-4 w-full border-artist-border bg-transparent text-artist-fg hover:bg-artist-accent/10"
        >
          <Link href={`/artist/${artistSlug}`}>
            See upcoming shows
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </section>
    </div>
  );
}
