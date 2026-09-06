import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarClock, Lock } from "lucide-react";
import { EventHero } from "@/components/fan/event-hero";
import { VerifyPanel } from "@/components/fan/verify-panel";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { demoModeEnabled } from "@/lib/demo-mode";
import { requireAuth } from "@/server/auth/request";
import { hasEarnedCredential } from "@/lib/fan-experience/access-state";
import { loadEventPage } from "@/server/events/context";
import { getActiveEventToken } from "@/server/events/queries";
import { staffCodeForToken } from "@/server/verification/verifiers";
import { demoNow } from "@/server/demo/clock";

export async function generateMetadata(
  props: PageProps<"/event/[slug]/verify">,
): Promise<Metadata> {
  const { slug } = await props.params;
  return { title: `Verify · ${slug.replace(/-/g, " ")}` };
}

/**
 * The verification screen a QR scan lands on.
 *
 * A fan who already holds the credential is sent straight to it, and a fan arriving
 * outside the window is told when it opens rather than being shown a button that cannot
 * work.
 */
export default async function VerifyPage(props: PageProps<"/event/[slug]/verify">) {
  const { slug } = await props.params;
  const { t } = await props.searchParams;
  const ctx = await requireAuth(`/event/${slug}/verify`);
  const page = await loadEventPage(slug, ctx.userId);

  if (!page) notFound();

  if (hasEarnedCredential(page.fanExperience)) {
    redirect(`/event/${slug}/credential`);
  }

  const { event, theme, timing, verification } = page;
  const token = typeof t === "string" ? t : undefined;
  const demoMode = demoModeEnabled();
  const activeToken = demoMode ? await getActiveEventToken(event.id) : null;
  const demoStaffCode = activeToken ? staffCodeForToken(activeToken.token) : undefined;

  return (
    <div className="moment-layout pb-12">
      <EventHero event={event} theme={theme} state={timing.state} eyebrow="Verification" />

      <div className="mx-auto max-w-md space-y-6 pt-6">
        {verification.open ? (
          <>
            <div className="moment-surface relative space-y-3 overflow-hidden rounded-2xl border border-artist-border px-5 py-8 text-center">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_srgb,var(--artist-accent)_18%,transparent),transparent_65%)]"
                aria-hidden
              />
              <div className="relative space-y-3">
                <p className="eyebrow text-artist-accent">Verification</p>
                <h2 className="display-xl font-artist text-3xl text-artist-fg md:text-4xl">
                  You had to be there.
                </h2>
                <p className="text-sm text-artist-muted text-balance">
                  One check and this show becomes permanently yours — your credential, tonight&rsquo;s
                  merch, and everything {event.artistName} releases for the people who were here.
                </p>
              </div>
            </div>

            <VerifyPanel
              eventId={event.id}
              token={token}
              venueName={event.venueName}
              city={event.venueCity}
              demoVenueLocation={
                demoMode ? { lat: event.venueLat, lng: event.venueLng } : undefined
              }
              demoStaffCode={demoStaffCode}
            />
          </>
        ) : (
          <ClosedWindow
            slug={slug}
            opensAt={verification.opensAt}
            closesAt={verification.closesAt}
            timezone={event.timezone}
            cancelled={event.cancelled}
          />
        )}
      </div>
    </div>
  );
}

function ClosedWindow({
  slug,
  opensAt,
  closesAt,
  timezone,
  cancelled,
}: {
  slug: string;
  opensAt: Date;
  closesAt: Date;
  timezone: string;
  cancelled: boolean;
}) {
  const now = demoNow();
  const notYet = now < opensAt;

  return (
    <section className="space-y-5 rounded-2xl border border-artist-border bg-artist-surface p-6 text-center">
      <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-artist-accent/10 text-artist-accent">
        {notYet ? (
          <CalendarClock className="size-5" aria-hidden />
        ) : (
          <Lock className="size-5" aria-hidden />
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-artist-fg">
          {cancelled
            ? "This show was cancelled"
            : notYet
              ? "Verification opens at doors"
              : "Verification has closed"}
        </h2>
        <p className="text-sm text-artist-muted text-balance">
          {cancelled
            ? "No credentials were issued for this date."
            : notYet
              ? `You'll be able to verify from ${formatDateTime(opensAt, timezone)}.`
              : `The window closed ${formatDateTime(closesAt, timezone)}. Credentials can only be earned at the show.`}
        </p>
      </div>

      <Button
        asChild
        variant="outline"
        className="w-full border-artist-border bg-transparent text-artist-fg hover:bg-artist-accent/10"
      >
        <Link href={`/event/${slug}`}>Back to the show</Link>
      </Button>
    </section>
  );
}
