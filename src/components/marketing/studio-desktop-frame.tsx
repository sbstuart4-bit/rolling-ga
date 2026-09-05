import { ClaimLabel } from "@/components/marketing/claim-label";
import {
  ILLUSTRATIVE_AUDIENCE,
  STUDIO_NAV_ITEMS,
} from "@/components/marketing/marketing-fixtures";
import { cn } from "@/lib/utils";

const INSIGHTS_BARS = [38, 52, 44, 68, 58, 72, 48, 61];

export function StudioDesktopFrame({ className }: { className?: string }) {
  return (
    <div className={cn("deck-card overflow-hidden rounded-2xl border-border bg-[#1a1a1e] shadow-soft-lg", className)}>
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-zinc-600" aria-hidden />
        <span className="size-2.5 rounded-full bg-zinc-600" aria-hidden />
        <span className="size-2.5 rounded-full bg-zinc-600" aria-hidden />
        <p className="ml-3 truncate text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Artist Studio · The Degens
        </p>
        <span className="ml-auto flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-success">
          <span className="size-1.5 rounded-full bg-success" aria-hidden />
          Live · Detroit
        </span>
      </div>
      <div className="grid md:grid-cols-[200px_1fr]">
        <aside className="hidden border-r border-white/5 p-4 md:block">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Artist Studio
          </p>
          <ul className="space-y-1">
            {STUDIO_NAV_ITEMS.map((item, index) => (
              <li
                key={item.label}
                className={cn(
                  "rounded-lg px-2.5 py-2",
                  index === 4 || index === 5
                    ? "bg-primary/10 text-foreground ring-1 ring-primary/20"
                    : "text-muted-foreground",
                )}
              >
                <p className="text-sm font-medium">{item.label}</p>
                <p className="truncate text-[11px] text-muted-foreground">{item.description}</p>
              </li>
            ))}
          </ul>
        </aside>
        <div className="space-y-6 p-5 md:p-7">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-display text-4xl">{ILLUSTRATIVE_AUDIENCE.city}</p>
            <ClaimLabel kind="illustrative" />
          </div>
          <dl className="grid gap-3 sm:grid-cols-3">
            <Metric label="Verified attendees" value={ILLUSTRATIVE_AUDIENCE.verified.toLocaleString()} />
            <Metric label="Connected fans" value={ILLUSTRATIVE_AUDIENCE.connected.toLocaleString()} />
            <Metric label="Purchasers" value={ILLUSTRATIVE_AUDIENCE.purchasers.toLocaleString()} />
          </dl>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-[#121212] p-4">
              <p className="eyebrow mb-4 text-muted-foreground">Activate an audience</p>
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <Chip>Detroit attendees</Chip>
                <span className="text-muted-foreground" aria-hidden>
                  +
                </span>
                <Chip>Connected</Chip>
                <span className="text-primary" aria-hidden>
                  →
                </span>
                <Chip accent>Anniversary drop</Chip>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#121212] p-4">
              <p className="eyebrow mb-3 text-muted-foreground">Insights · GMV per attendee</p>
              <div className="flex h-24 items-end gap-1.5">
                {INSIGHTS_BARS.map((h, i) => (
                  <span
                    key={i}
                    className={cn(
                      "flex-1 rounded-t bg-primary/40",
                      i === INSIGHTS_BARS.length - 1 && "bg-primary/90",
                    )}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Illustrative trend — per-attendee economics are live.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="deck-card rounded-xl border-white/8 bg-[#121212] px-4 py-3">
      <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-display text-3xl tabular">{value}</dd>
    </div>
  );
}

function Chip({ children, accent = false }: { children: string; accent?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em]",
        accent
          ? "border-primary/40 bg-primary/15 text-primary"
          : "border-white/10 bg-white/5 text-foreground",
      )}
    >
      {children}
    </span>
  );
}
