import Link from "next/link";
import { Plus, QrCode } from "lucide-react";
import { ShowTimeline } from "@/components/studio/show-timeline";
import { Button } from "@/components/ui/button";
import { formatEventDate, formatEventTime, formatMoney } from "@/lib/format";
import type { LiveCommandCenterSnapshot } from "@/server/studio/live";
import { cn } from "@/lib/utils";
import { FlashDropCountdown } from "@/components/fan/flash-drop-countdown";

export function LiveCommandCenter({
  snapshot,
  launchedDropId,
}: {
  snapshot: LiveCommandCenterSnapshot;
  launchedDropId?: string | null;
}) {
  const { event, timing, activeDrop } = snapshot;
  const isLive = timing.state === "live";
  const launchedDrop =
    launchedDropId != null
      ? snapshot.timelineDrops.find((drop) => drop.id === launchedDropId) ?? activeDrop
      : activeDrop;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-2">
          <p className="eyebrow text-muted-foreground">Live show command center</p>
          <h1 className="display-xl text-3xl font-semibold tracking-tight md:text-4xl">
            {event.artistName} — {event.venueCity.toUpperCase()}
          </h1>
          <p className="text-muted-foreground">
            {event.venueName} · {formatEventDate(event.startsAt, event.timezone)} ·{" "}
            {formatEventTime(event.startsAt, event.timezone)}
          </p>
          {snapshot.isDemoData && (
            <p className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">
              Demo data — metrics reflect seeded show records
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isLive && (
            <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--studio-live,#e879f9)]/40 bg-[color:var(--studio-live,#e879f9)]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--studio-live,#e879f9)]">
              <span className="relative inline-flex size-1.5 rounded-full bg-[color:var(--studio-live,#e879f9)] status-dot-pulse" />
              Live now
            </span>
          )}
          <Button asChild size="lg" className="bg-violet-600 text-white hover:bg-violet-500">
            <Link href={`/studio/live/${event.id}/create-drop`}>
              <Plus className="size-4" aria-hidden />
              Create drop
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/studio/qr/${event.id}`}>
              <QrCode className="size-4" aria-hidden />
              QR
            </Link>
          </Button>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <Metric label="Expected" value={snapshot.expectedAttendance?.toLocaleString("en-US") ?? "—"} />
        <Metric label="Verified" value={snapshot.verifiedAttendees.toLocaleString("en-US")} accent />
        <Metric label="Orders" value={snapshot.orderCount.toLocaleString("en-US")} />
        <Metric label="GMV" value={formatMoney(snapshot.gmvCents)} />
        <Metric label="AOV" value={formatMoney(snapshot.aovCents)} />
        <Metric
          label="Active drop"
          value={activeDrop?.title ?? "None"}
          className="md:col-span-2 xl:col-span-2"
        />
        <Metric
          label="Units sold"
          value={String(activeDrop?.quantitySold ?? 0)}
        />
      </dl>

      {(launchedDrop?.status === "live" || launchedDropId) && launchedDrop && (
        <section className="rounded-2xl border border-[color:var(--studio-live,#e879f9)]/30 bg-[color:var(--studio-live,#e879f9)]/5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-[color:var(--studio-live,#e879f9)]">Drop live</p>
              <h2 className="text-xl font-semibold">{launchedDrop.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {snapshot.verifiedAttendees.toLocaleString("en-US")} eligible verified fans ·{" "}
                {launchedDrop.quantityLimit != null
                  ? `${Math.max(0, launchedDrop.quantityLimit - launchedDrop.quantitySold)} remaining`
                  : "Inventory from product variants"}
              </p>
            </div>
            {launchedDrop.endsAt && (
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Countdown</p>
                <p className="font-mono text-lg font-semibold text-[color:var(--studio-live,#e879f9)]">
                  <FlashDropCountdown endsAt={launchedDrop.endsAt.toISOString()} />
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      <ShowTimeline
        eventState={timing.state}
        startsAt={event.startsAt}
        endsAt={event.endsAt}
        doorsAt={event.doorsAt}
        timezone={event.timezone}
        drops={snapshot.timelineDrops}
      />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <h2 className="eyebrow text-muted-foreground">Top products</h2>
          {snapshot.topProducts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
              No paid orders for this show yet.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {snapshot.topProducts.map((product) => (
                <li key={product.name} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="font-medium">{product.name}</span>
                  <span className="tabular text-muted-foreground">
                    {product.unitsSold} sold · {formatMoney(product.revenueCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="eyebrow text-muted-foreground">Show drops</h2>
          <ul className="space-y-2">
            {snapshot.timelineDrops.length === 0 ? (
              <li className="rounded-xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
                No drops for this show yet. Launch one for verified attendees.
              </li>
            ) : (
              snapshot.timelineDrops.map((drop) => (
                <li key={drop.id} className="rounded-xl border border-border px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{drop.title}</span>
                    <span className="uppercase tracking-wide text-xs text-muted-foreground">{drop.status}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {drop.quantitySold} sold
                    {drop.quantityLimit != null ? ` · ${drop.quantityLimit} cap` : ""}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  accent = false,
  className,
}: {
  label: string;
  value: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card/50 px-4 py-3", className)}>
      <dt className="eyebrow text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-1 truncate text-lg font-semibold tabular",
          accent && "text-[color:var(--studio-live,#e879f9)]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
