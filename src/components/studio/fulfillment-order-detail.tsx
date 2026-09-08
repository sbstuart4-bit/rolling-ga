import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatDateTime, formatMoney } from "@/lib/format";
import { DELIVERY_PROMISE_STATE_LABELS } from "@/lib/fulfillment";
import {
  FULFILLMENT_EXCEPTION_LABELS,
  FULFILLMENT_STATUS_LABELS,
} from "@/lib/types";
import type { FulfillmentOrderDetail } from "@/server/studio/fulfillment-queries";

function OriginLabel({
  moment,
  activationDropTitle,
}: {
  moment: FulfillmentOrderDetail["commerceMoment"];
  activationDropTitle: string | null;
}) {
  if (activationDropTitle) return `Activation · ${activationDropTitle}`;
  if (moment === "show_night") return "Show night";
  if (moment === "post_show") return "Post-show";
  return "—";
}

export function FulfillmentOrderDetailPanel({
  order,
  backHref,
}: {
  order: FulfillmentOrderDetail;
  backHref: string;
}) {
  const openExceptions = order.exceptions.filter(
    (e) => e.status === "open" || e.status === "in_progress",
  );

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to fulfillment
        </Link>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Order detail
          </p>
          <h1 className="text-2xl font-semibold tracking-tight font-mono">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{order.fanName} · {order.fanEmail}</p>
        </div>
      </header>

      {openExceptions.length > 0 ? (
        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
          <p className="text-sm font-semibold text-destructive">Exception — needs attention</p>
          {openExceptions.map((ex) => (
            <div key={ex.id} className="text-sm">
              <p className="font-medium">
                {FULFILLMENT_EXCEPTION_LABELS[ex.type as keyof typeof FULFILLMENT_EXCEPTION_LABELS] ??
                  ex.type}
              </p>
              {ex.note ? <p className="mt-1 text-muted-foreground">{ex.note}</p> : null}
              <p className="mt-1 text-xs text-muted-foreground">
                Opened {formatDateTime(ex.createdAt)}
              </p>
            </div>
          ))}
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2">
        <DetailField label="Fulfillment status" value={FULFILLMENT_STATUS_LABELS[order.fulfillmentStatus!] ?? "—"} />
        <DetailField label="Commerce status" value={order.commerceStatus} />
        <DetailField label="Origin" value={OriginLabel({ moment: order.commerceMoment, activationDropTitle: order.activationDropTitle })} />
        <DetailField label="Show" value={order.originLabel} />
        <DetailField
          label="Ordered"
          value={order.placedAt ? formatDateTime(order.placedAt) : "—"}
        />
        <DetailField label="Total" value={formatMoney(order.totalCents)} />
        <DetailField
          label="Promised delivery"
          value={order.promisedDeliveryAt ? formatDateTime(order.promisedDeliveryAt) : "—"}
        />
        <DetailField
          label="Actual delivery"
          value={order.actualDeliveredAt ? formatDateTime(order.actualDeliveredAt) : "—"}
        />
        <DetailField
          label="Promise status"
          value={DELIVERY_PROMISE_STATE_LABELS[order.promiseState]}
        />
      </section>

      {order.shipment ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Shipping
          </h2>
          <div className="rounded-xl border border-border bg-card p-4 text-sm space-y-1">
            {order.shipment.carrier ? <p>Carrier: {order.shipment.carrier}</p> : null}
            {order.shipment.service ? <p>Service: {order.shipment.service}</p> : null}
            {order.shipment.trackingNumber ? (
              <p className="font-mono text-xs text-muted-foreground">
                Reference: {order.shipment.trackingNumber}
              </p>
            ) : null}
            {order.shipment.shippedAt ? (
              <p className="text-muted-foreground">Shipped {formatDateTime(order.shipment.shippedAt)}</p>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Demo reference only — no live carrier tracking integration.
          </p>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Products
        </h2>
        <ul className="space-y-2">
          {order.items.map((item, index) => (
            <li
              key={`${item.name}-${index}`}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                {item.size ? <p className="text-xs text-muted-foreground">{item.size}</p> : null}
              </div>
              <div className="text-right tabular-nums">
                <p>×{item.quantity}</p>
                <p className="font-medium">{formatMoney(item.totalCents)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Fulfillment timeline
        </h2>
        <ol className="space-y-0 border-l border-border pl-4">
          {order.timeline
            .filter((event) => event.at != null)
            .map((event) => (
              <li key={event.key} className="relative pb-6 last:pb-0">
                <span className="absolute -left-[1.3rem] top-1 size-2.5 rounded-full bg-primary" />
                <p className="text-sm font-medium">{event.label}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(event.at!)}</p>
              </li>
            ))}
        </ol>
        {order.timeline.every((e) => e.at == null) ? (
          <p className="text-sm text-muted-foreground">No fulfillment events recorded yet.</p>
        ) : null}
      </section>

      {order.isDemoData ? (
        <p className="text-xs text-muted-foreground">
          Demo operational events — seeded for the Brooklyn Artist Studio walkthrough.
        </p>
      ) : null}
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
