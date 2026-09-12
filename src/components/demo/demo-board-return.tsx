"use client";

import { ChevronRight, Users } from "lucide-react";
import { returnToDemoBoardAction } from "@/server/demo/session-actions";
import { cn } from "@/lib/utils";

export function DemoBoardReturn({
  variant = "link",
  className,
  show = true,
}: {
  variant?: "link" | "compact" | "row";
  className?: string;
  /** Pass from a server layout via demoModeEnabled() — hidden outside demo mode. */
  show?: boolean;
}) {
  if (!show) return null;

  if (variant === "compact") {
    return (
      <form action={returnToDemoBoardAction}>
        <button
          type="submit"
          className={cn(
            "flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
            className,
          )}
          aria-label="Switch persona"
          title="Switch persona — try fan, artist, or ops views"
        >
          <Users className="size-[18px]" aria-hidden />
        </button>
      </form>
    );
  }

  if (variant === "row") {
    return (
      <form action={returnToDemoBoardAction} className="contents">
        <button
          type="submit"
          className={cn(
            "flex w-full items-center gap-3 bg-card px-4 py-3.5 text-left transition-colors hover:bg-accent",
            className,
          )}
        >
          <Users className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Switch persona</p>
            <p className="text-xs text-muted-foreground">Try fan, artist, or ops views</p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" aria-hidden />
        </button>
      </form>
    );
  }

  return (
    <form action={returnToDemoBoardAction}>
      <button
        type="submit"
        className={cn("text-sm font-medium text-primary hover:underline", className)}
      >
        Switch persona
      </button>
    </form>
  );
}
