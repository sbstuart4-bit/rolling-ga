import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, Store } from "lucide-react";
import { CredentialCard } from "@/components/fan/credential-card";
import { CredentialCelebrationHeader } from "@/components/fan/credential-celebration-header";
import { MyAccessPanel } from "@/components/fan/my-access-panel";
import { ShareCredentialButton } from "@/components/fan/share-credential-button";
import { Button } from "@/components/ui/button";
import { PostShowStoreCountdown } from "@/components/fan/post-show-store-countdown";
import { requireAuth } from "@/server/auth/request";
import { getCredential } from "@/server/attendance/queries";
import { loadShowAccessHub } from "@/server/fans/passport-access";
import { hasEarnedCredential, canPurchaseShowExclusives } from "@/lib/fan-experience/access-state";
import { loadEventPage } from "@/server/events/context";
import { cn } from "@/lib/utils";

export async function generateMetadata(
  props: PageProps<"/event/[slug]/credential">,
): Promise<Metadata> {
  const { slug } = await props.params;
  return { title: `Credential · ${slug.replace(/-/g, " ")}` };
}

function isFreshVerification(value: string | string[] | undefined): boolean {
  if (Array.isArray(value)) return value[0] === "1";
  return value === "1";
}

/**
 * `YOU'RE IN` immediately after verifying, and the fan's permanent credential every
 * time after that. The same screen serves both so the object a fan just earned is the
 * object they keep coming back to.
 */
export default async function CredentialPage(props: PageProps<"/event/[slug]/credential">) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const ctx = await requireAuth(`/event/${slug}/credential`);
  const page = await loadEventPage(slug, ctx.userId);

  if (!page) notFound();
  if (!hasEarnedCredential(page.fanExperience)) redirect(`/event/${slug}/verify`);

  const credential = await getCredential(ctx.userId, page.event.id);
  if (!credential) redirect(`/event/${slug}/verify`);

  const access = await loadShowAccessHub(ctx.userId, page.event.id, page.event.artistId);

  const fresh = isFreshVerification(searchParams.just_verified);
  const { timing, fanExperience } = page;
  const canShopFromCredential =
    canPurchaseShowExclusives(fanExperience.access) &&
    (timing.state === "live" || timing.state === "recently_ended");

  const credentialData = {
    id: credential.credentialId,
    artistName: credential.artistName,
    tourName: credential.tourName,
    venueName: credential.venueName,
    city: credential.venueCity,
    region: credential.venueRegion,
    startsAt: credential.startsAt,
    timezone: credential.timezone,
    method: credential.method,
    verifiedAt: credential.verifiedAt,
  };

  return (
    <div
      className={cn(
        "moment-surface mx-auto max-w-md space-y-6 px-4 pb-8",
        fresh ? "pt-6" : "pt-8",
      )}
    >
      <CredentialCelebrationHeader
        fresh={fresh}
        artistName={credential.artistName}
        city={credential.venueCity}
        venueName={credential.venueName}
        startsAt={credential.startsAt}
        timezone={credential.timezone}
        verifiedAt={credential.verifiedAt}
      />

      <div className={cn(fresh && "celebration-reveal-delay-2")}>
        <CredentialCard animate={fresh} theme={page.theme} credential={credentialData} />
      </div>

      <div className={cn("space-y-2", fresh && "celebration-reveal-delay-3")}>
        {canShopFromCredential && (
          <Button asChild variant={fresh ? "moment" : "default"} size="lg" className={cn(!fresh && "h-13 w-full bg-artist-accent text-base font-semibold text-artist-accent-fg hover:bg-artist-accent/90")}>
            <Link href={`/event/${slug}/shop`}>
              <Store className="size-4" aria-hidden />
              {fresh
                ? "Open tonight's shop"
                : timing.state === "live"
                  ? "Enter tonight\u2019s experience"
                  : "Shop before it closes"}
            </Link>
          </Button>
        )}

        <ShareCredentialButton
          credentialId={credential.credentialId}
          artistName={credential.artistName}
          city={credential.venueCity}
        />

        <Button
          asChild
          variant="ghost"
          className="w-full text-artist-muted hover:bg-artist-accent/10 hover:text-artist-fg"
        >
          <Link href="/shows">
            {fresh ? "Add to my shows" : "See all your shows"}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>

      <div className={cn(fresh && "celebration-reveal-delay-4")}>
        <MyAccessPanel slug={slug} artistName={credential.artistName} access={access} />
      </div>

      {timing.postShowClosesAt && timing.state === "recently_ended" && (
        <p className="text-center text-sm text-artist-muted">
          Your attendee-exclusive store remains open for{" "}
          <PostShowStoreCountdown closesAt={timing.postShowClosesAt.toISOString()} />
        </p>
      )}
    </div>
  );
}
