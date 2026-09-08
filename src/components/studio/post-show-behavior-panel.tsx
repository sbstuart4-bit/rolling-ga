import { formatMoney } from "@/lib/format";
import type { PostShowWindowMetrics } from "@/lib/relationship-intelligence/types";

export function PostShowBehaviorPanel({ windows }: { windows: PostShowWindowMetrics[] }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Post-show behavior
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          What the show-origin cohort did after the concert — derived from attributed orders.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {windows.map((window) => (
          <div key={window.daysAfterShow} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {window.label}
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Active fans</dt>
                <dd className="font-semibold tabular-nums">{window.activeFans}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Post-show purchasers</dt>
                <dd className="font-semibold tabular-nums">{window.postShowPurchasers}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Orders</dt>
                <dd className="font-semibold tabular-nums">{window.postShowOrders}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Post-show GMV</dt>
                <dd className="font-semibold tabular-nums">{formatMoney(window.postShowGmvCents)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Repeat purchasers</dt>
                <dd className="font-semibold tabular-nums">{window.repeatPurchasers}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
