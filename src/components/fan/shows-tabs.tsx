"use client";

import * as React from "react";
import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import { ShowPassportCard } from "@/components/fan/show-passport-card";
import { cn } from "@/lib/utils";

export interface ShowEntry {
  credentialId: string;
  slug: string;
  artistName: string;
  venueCity: string;
  venueName: string;
  startsAt: string;
  timezone: string;
  isPast: boolean;
  unlockCount?: number;
}

export function ShowsTabs({ shows }: { shows: ShowEntry[] }) {
  const [tab, setTab] = React.useState<"past" | "upcoming">("past");

  const past = shows.filter((s) => s.isPast);
  const upcoming = shows.filter((s) => !s.isPast);
  const list = tab === "past" ? past : upcoming;
  const totalUnlocks = past.reduce((sum, show) => sum + (show.unlockCount ?? 0), 0);

  return (
    <>
      <div className="flex border-b border-border px-5">
        {(["past", "upcoming"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "relative flex-1 py-3 text-sm font-semibold uppercase tracking-wider transition-colors",
              tab === key ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {key}
            {tab === key && (
              <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-primary" aria-hidden />
            )}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="px-5 py-20 text-center text-sm text-muted-foreground">
          {tab === "past" ? "No past shows yet." : "No upcoming shows."}
        </div>
      ) : (
        <ul className="space-y-3 px-5 py-5">
          {list.map((entry) => (
            <ShowPassportCard key={entry.credentialId} entry={entry} />
          ))}
        </ul>
      )}

      {tab === "past" && totalUnlocks > 0 && (
        <div className="mx-5 mb-8 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-4 text-center">
          <p className="text-sm font-medium text-primary">
            {totalUnlocks} anniversary unlock{totalUnlocks !== 1 ? "s" : ""} waiting
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Drops tied to shows you were at may have opened since your last visit.
          </p>
          <Link
            href="/drops"
            className="mt-3 inline-flex text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
          >
            Browse drops
          </Link>
        </div>
      )}
    </>
  );
}
