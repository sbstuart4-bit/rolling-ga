import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CityExclusiveForm } from "@/components/studio/city-exclusive-form";
import { Button } from "@/components/ui/button";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { listEventsForMerchPicker } from "@/server/studio/merch-queries";

export const metadata: Metadata = { title: "City exclusive — Artist Studio" };

export default async function StudioCityExclusivePage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const { eventId } = await searchParams;
  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], "/studio/merch/exclusive/new");
  const artistId = defaultArtistId(ctx);

  if (!artistId) return <div className="text-muted-foreground">Select an artist.</div>;

  const events = await listEventsForMerchPicker(artistId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link href="/studio/merch">
          <ArrowLeft className="size-4" aria-hidden />
          Back to merch
        </Link>
      </Button>

      <CityExclusiveForm artistId={artistId} events={events} defaultEventId={eventId} />
    </div>
  );
}
