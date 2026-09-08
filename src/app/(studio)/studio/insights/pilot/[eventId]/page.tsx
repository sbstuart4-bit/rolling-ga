import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ArtistGuidedDemoHighlight } from "@/components/demo/artist-guided-demo-highlight";
import { PilotReportDashboard } from "@/components/studio/pilot-report-dashboard";
import { Button } from "@/components/ui/button";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { loadPilotReportSnapshot } from "@/server/studio/pilot-report-queries";

export const metadata: Metadata = { title: "Pilot Report — Artist Studio" };

export default async function ShowPilotReportPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const ctx = await requireAuthWithRole(
    ["artist_member", "rga_admin"],
    `/studio/insights/pilot/${eventId}`,
  );
  const artistId = defaultArtistId(ctx);

  if (!artistId) notFound();

  const report = await loadPilotReportSnapshot(ctx, artistId, eventId);
  if (!report) notFound();

  return (
    <div className="space-y-6">
      <div className="pilot-report-no-print">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href={`/studio/insights?event=${eventId}`}>
            <ArrowLeft className="size-4" aria-hidden />
            Back to insights
          </Link>
        </Button>
      </div>

      <div className="rounded-2xl bg-zinc-950 p-6 text-white lg:p-8">
        <ArtistGuidedDemoHighlight />
        <PilotReportDashboard report={report} />
      </div>
    </div>
  );
}
