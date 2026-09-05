import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PilotDashboard } from "@/components/studio/pilot-dashboard";
import { Button } from "@/components/ui/button";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import {
  loadPilotInsights,
  resolveDefaultPilotEventIds,
} from "@/server/studio/insights-queries";

export const metadata: Metadata = { title: "Rolling GA Pilot — Artist Studio" };

export default async function StudioPilotInsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ events?: string }>;
}) {
  const { events: eventsParam } = await searchParams;
  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], "/studio/insights/pilot");
  const artistId = defaultArtistId(ctx);

  if (!artistId) notFound();

  const eventIds = eventsParam
    ? eventsParam.split(",").filter(Boolean).slice(0, 5)
    : await resolveDefaultPilotEventIds(artistId);

  if (eventIds.length === 0) notFound();

  const pilot = await loadPilotInsights(ctx, artistId, eventIds);
  if (!pilot) notFound();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link href="/studio/insights">
          <ArrowLeft className="size-4" aria-hidden />
          Back to insights
        </Link>
      </Button>

      <div className="rounded-2xl bg-zinc-950 p-6 text-white lg:p-8">
        <PilotDashboard pilot={pilot} />
      </div>
    </div>
  );
}
