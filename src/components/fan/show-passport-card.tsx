import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import { formatEventDateShort } from "@/lib/format";
import type { ShowEntry } from "@/components/fan/shows-tabs";

export function ShowPassportCard({ entry }: { entry: ShowEntry }) {
  return (
    <li>
      <Link
        href={`/event/${entry.slug}/credential`}
        className="group block overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40"
      >
        <div className="relative h-2 overflow-hidden bg-muted">
          <div
            className="absolute inset-x-0 top-0 h-full opacity-80"
            style={{
              background:
                "repeating-linear-gradient(90deg, transparent, transparent 6px, var(--border) 6px, var(--border) 12px)",
            }}
            aria-hidden
          />
        </div>

        <div className="relative px-4 pb-4 pt-3">
          <div className="mb-3 h-16 overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 via-muted to-background" />

          <div className="space-y-1">
            <p className="truncate font-medium">{entry.artistName}</p>
            <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
              <MapPin className="size-3 shrink-0" aria-hidden />
              {entry.venueCity} &middot; {entry.venueName}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatEventDateShort(new Date(entry.startsAt), entry.timezone)}
            </p>
          </div>

          {entry.isPast && (
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                <BadgeCheck className="size-3.5" aria-hidden />
                I was there
              </span>
              {entry.unlockCount != null && entry.unlockCount > 0 && (
                <span className="text-xs font-medium text-primary">
                  {entry.unlockCount} unlock{entry.unlockCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </li>
  );
}
