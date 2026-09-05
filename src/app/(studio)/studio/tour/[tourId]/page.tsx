import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, Settings2 } from "lucide-react";
import { TourEventList } from "@/components/studio/tour-event-list";
import { Button } from "@/components/ui/button";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { loadTourDashboard } from "@/server/studio/tour-queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tourId: string }>;
}): Promise<Metadata> {
  const { tourId } = await params;
  return { title: `Tour ${tourId} — Artist Studio` };
}

export default async function StudioTourDetailPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const { tourId } = await params;
  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], `/studio/tour/${tourId}`);
  const artistId = defaultArtistId(ctx);

  if (!artistId) notFound();

  const dashboard = await loadTourDashboard(ctx, artistId, tourId);
  if (!dashboard) notFound();

  const { tour, events, readiness } = dashboard;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link href="/studio/tour">
          <ArrowLeft className="size-4" aria-hidden />
          All tours
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold uppercase tracking-wide">{tour.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {events.length} show{events.length === 1 ? "" : "s"} · configure once, override per city
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/studio/tour/${tourId}/defaults`}>
              <Settings2 className="size-4" aria-hidden />
              Tour defaults
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/studio/tour/${tourId}/events/new`}>
              <Plus className="size-4" aria-hidden />
              Add show
            </Link>
          </Button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-16 text-center">
          <p className="font-semibold">No shows on this tour yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first city to start configuring show overrides.
          </p>
          <Button asChild className="mt-4">
            <Link href={`/studio/tour/${tourId}/events/new`}>Add show</Link>
          </Button>
        </div>
      ) : (
        <TourEventList tourId={tourId} events={events} readiness={readiness} />
      )}
    </div>
  );
}
