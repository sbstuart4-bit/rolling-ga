import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtistTakeover } from "@/components/artist/artist-takeover";
import { CredentialCard } from "@/components/fan/credential-card";
import { Button } from "@/components/ui/button";
import { getCredentialById } from "@/server/attendance/queries";
import { resolveEventTheme } from "@/server/theme/resolve";

export async function generateMetadata(props: PageProps<"/c/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const credential = await getCredentialById(id);
  if (!credential) return { title: "Credential not found" };

  return {
    title: `I was there — ${credential.artistName}, ${credential.venueCity}`,
    description: `${credential.artistName} at ${credential.venueName}, verified on Rolling GA.`,
  };
}

/**
 * The public face of a credential.
 *
 * Deliberately the only unauthenticated view in the product, and deliberately thin: the
 * artist, the city, the date and the proof. No fan name, no purchase history, nothing
 * that would leak who the holder is.
 */
export default async function SharedCredentialPage(props: PageProps<"/c/[id]">) {
  const { id } = await props.params;
  const credential = await getCredentialById(id);

  if (!credential) notFound();

  const theme = await resolveEventTheme(credential.eventId);

  return (
    <ArtistTakeover theme={theme} className="min-h-dvh">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-7 px-5 py-12">
        <CredentialCard
          theme={theme}
          credential={{
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
          }}
        />

        <div className="space-y-3 text-center">
          <p className="text-sm text-artist-muted text-balance">
            A verified Rolling GA credential. Earned in the room at {credential.venueName}.
          </p>
          <Button
            asChild
            size="lg"
            className="w-full bg-artist-accent text-artist-accent-fg hover:bg-artist-accent/90"
          >
            <Link href={`/event/${credential.slug}`}>See this show on Rolling GA</Link>
          </Button>
        </div>
      </div>
    </ArtistTakeover>
  );
}
