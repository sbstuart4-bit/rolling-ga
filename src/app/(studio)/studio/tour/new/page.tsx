import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateTourForm } from "@/components/studio/create-tour-form";
import { Button } from "@/components/ui/button";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";

export const metadata: Metadata = { title: "New tour — Artist Studio" };

export default async function StudioNewTourPage() {
  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], "/studio/tour/new");
  const artistId = defaultArtistId(ctx);

  if (!artistId) {
    return <div className="p-6 text-muted-foreground">Select an artist.</div>;
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
        <Link href="/studio/tour">
          <ArrowLeft className="size-4" aria-hidden />
          Back to tour
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New tour</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set tour-wide defaults after creation — artwork, merch, shipping, and post-show window.
        </p>
      </div>

      <CreateTourForm artistId={artistId} />
    </div>
  );
}
