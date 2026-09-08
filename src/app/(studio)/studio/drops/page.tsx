import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Timer, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireAuthWithRole } from "@/server/auth/request";
import { defaultArtistId } from "@/server/auth/guards";
import { resolveStudioArtist } from "@/server/artists/queries";
import { db } from "@/db";
import { artists, drops } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { formatEventDate, formatMoney } from "@/lib/format";
import { demoNow } from "@/server/demo/clock";

export const metadata: Metadata = { title: "Drops — Artist Studio" };

export default async function StudioDropsPage() {
  const ctx = await requireAuthWithRole(["artist_member", "rga_admin"], "/studio/drops");
  const artistId = defaultArtistId(ctx);

  const allDrops = artistId
    ? await db
        .select()
        .from(drops)
        .where(eq(drops.artistId, artistId))
        .orderBy(desc(drops.createdAt))
        .limit(50)
    : [];

  const now = demoNow();

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Drops</h1>
        <Button asChild>
          <Link href="/studio/drops/new">
            <Plus className="size-4" aria-hidden />
            Create flash drop
          </Link>
        </Button>
      </div>

      {allDrops.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 py-20 text-center">
          <p className="font-semibold">No drops yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create a flash drop to sell to verified attendees in real time.</p>
          <Button asChild className="mt-4">
            <Link href="/studio/drops/new">Create first drop</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {allDrops.map((drop) => {
            const isLive = drop.status === "live" && drop.startsAt <= now && (!drop.endsAt || drop.endsAt > now);
            const isFlash = !!drop.endsAt;
            return (
              <li key={drop.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card px-5 py-4">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    {isLive && (
                      <span className="relative inline-flex size-1.5 shrink-0 rounded-full bg-success status-dot-pulse" />
                    )}
                    <p className="truncate font-medium">{drop.title}</p>
                    {isFlash && (
                      <span className="eyebrow rounded-full bg-warning/10 px-2 py-0.5 text-warning">
                        Flash
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {drop.status} · {drop.quantitySold} sold
                    {drop.endsAt && drop.endsAt > now ? ` · ends ${formatEventDate(drop.endsAt)}` : ""}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/studio/drops/${drop.id}`}>View results</Link>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
