import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ArtistConnectionManageRow } from "@/components/fan/artist-connection-manage-row";
import { requireAuth } from "@/server/auth/request";
import { listFanArtistConnections } from "@/server/consent/service";

export const metadata = { title: "Artist connections — Rolling GA" };

export default async function ProfileConnectionsPage() {
  const ctx = await requireAuth("/profile/connections");
  const connections = await listFanArtistConnections(ctx.userId);

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Back to profile"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Artist connections</h1>
            <p className="text-sm text-muted-foreground">Artists you&apos;ve chosen to stay connected with</p>
          </div>
        </div>
      </header>

      <div className="space-y-4 px-4 pt-5">
        {connections.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-5 py-10 text-center">
            <p className="font-medium">No artist connections yet</p>
            <p className="mt-2 text-sm text-muted-foreground text-balance">
              When you opt in after a show, the artist will appear here. Attending or buying
              merch never grants marketing permission automatically.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {connections.map((connection) => (
              <ArtistConnectionManageRow key={connection.artistId} connection={connection} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
