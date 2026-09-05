import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { RollingGaMark } from "@/components/brand/rolling-ga-mark";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatEventDate } from "@/lib/format";
import { canAccessArtist } from "@/server/auth/guards";
import { requireAuthWithRole } from "@/server/auth/request";
import { rotateEventTokenAction } from "@/server/events/actions";
import {
  countVerifiedAttendance,
  getActiveEventToken,
  getEventById,
  verificationWindowFor,
} from "@/server/events/queries";
import { staffCodeForToken } from "@/server/verification/verifiers";

export const metadata: Metadata = { title: "Venue code" };

/**
 * The code a venue puts on screen, plus the spoken fallback for the merch desk.
 *
 * Kept deliberately large and high-contrast because it gets projected, photographed and
 * scanned across a dark room. The staff code is derived from the same token, so
 * rotating the QR rotates the spoken code with it.
 */
export default async function VenueQrPage(props: PageProps<"/studio/qr/[eventId]">) {
  const { eventId } = await props.params;
  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], `/studio/qr/${eventId}`);

  const event = await getEventById(eventId);
  if (!event) notFound();
  if (!canAccessArtist(ctx, event.artistId)) redirect("/no-access?need=artist_member");

  const [token, verifiedCount] = await Promise.all([
    getActiveEventToken(eventId),
    countVerifiedAttendance(eventId),
  ]);
  const window = verificationWindowFor(event);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 text-muted-foreground">
            <Link href="/studio/live">
              <ArrowLeft className="size-4" aria-hidden />
              Live
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            {event.venueCity} &middot; {event.artistName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {event.venueName} &middot; {formatEventDate(event.startsAt, event.timezone)}
          </p>
        </div>

        <form action={rotateEventTokenAction}>
          <input type="hidden" name="eventId" value={eventId} />
          <Button type="submit" variant="outline">
            <RefreshCw className="size-4" aria-hidden />
            Rotate code
          </Button>
        </form>
      </div>

      {token ? (
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
          <figure className="space-y-4 rounded-2xl border bg-card p-6 text-center shadow-soft">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG served by our own route; Image would proxy it needlessly */}
            <img
              src={`/api/qr/${token.token}`}
              alt={`Verification QR code for ${event.artistName} in ${event.venueCity}`}
              className="mx-auto aspect-square w-full max-w-sm rounded-xl bg-white p-4"
            />
            <figcaption className="space-y-1">
              <p className="display-xl text-xl">Scan to unlock tonight</p>
              <p className="text-sm text-muted-foreground">
                Verify your attendance to claim your credential and tonight&rsquo;s merch.
              </p>
              <RollingGaMark size="sm" className="justify-center pt-2 opacity-70" />
            </figcaption>
          </figure>

          <div className="space-y-4">
            <section className="rounded-2xl border bg-card p-5">
              <h2 className="eyebrow text-muted-foreground">Spoken staff code</h2>
              <p className="tabular mt-2 font-mono text-3xl font-semibold tracking-[0.2em]">
                {staffCodeForToken(token.token)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                For fans who decline location. Read it out; it changes when you rotate the code.
              </p>
            </section>

            <dl className="space-y-3 rounded-2xl border bg-card p-5 text-sm">
              <div>
                <dt className="eyebrow text-muted-foreground">Verified so far</dt>
                <dd className="tabular mt-0.5 text-2xl font-semibold">
                  {verifiedCount.toLocaleString("en-US")}
                </dd>
              </div>
              <div>
                <dt className="eyebrow text-muted-foreground">Window opens</dt>
                <dd className="mt-0.5">{formatDateTime(window.opensAt, event.timezone)}</dd>
              </div>
              <div>
                <dt className="eyebrow text-muted-foreground">Window closes</dt>
                <dd className="mt-0.5">{formatDateTime(window.closesAt, event.timezone)}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : (
        <section className="space-y-4 rounded-2xl border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold">No active code</h2>
          <p className="text-sm text-muted-foreground">
            This show has no verification code yet. Issue one before doors.
          </p>
          <form action={rotateEventTokenAction}>
            <input type="hidden" name="eventId" value={eventId} />
            <Button type="submit">Issue a code</Button>
          </form>
        </section>
      )}
    </div>
  );
}
