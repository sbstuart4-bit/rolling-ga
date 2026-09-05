import { formatEventDate } from "@/lib/format";
import type { ArtistConnectionView } from "@/server/consent/service";
import { disconnectArtistAction } from "@/server/consent/actions";

export function ArtistConnectionManageRow({
  connection,
}: {
  connection: ArtistConnectionView;
}) {
  const contextLabel =
    connection.contextCity && connection.contextStartsAt && connection.contextTimezone
      ? `Connected after ${connection.contextCity} · ${formatEventDate(connection.contextStartsAt, connection.contextTimezone)}`
      : `Connected ${formatEventDate(connection.connectedAt, "UTC")}`;

  return (
    <li className="space-y-3 p-4">
      <div className="space-y-1">
        <p className="font-semibold tracking-wide uppercase">{connection.artistName}</p>
        <p className="text-sm text-muted-foreground">{contextLabel}</p>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="font-medium">{connection.emailOptIn ? "✓" : "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">SMS</dt>
          <dd className="font-medium">{connection.smsOptIn ? "✓" : "—"}</dd>
        </div>
      </dl>

      <form action={disconnectArtistAction}>
        <input type="hidden" name="artistId" value={connection.artistId} />
        <button
          type="submit"
          className="text-sm font-medium text-muted-foreground underline hover:text-foreground"
        >
          Manage · Disconnect
        </button>
      </form>
    </li>
  );
}
