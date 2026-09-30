"use client";

import { Globe } from "lucide-react";
import { returnToDemoBoardAction } from "@/server/demo/session-actions";
import { cn } from "@/lib/utils";

/** Leaves the demo persona and returns to the marketing site (`/home` or demo board when gated). */
export function MarketingWebsiteExit({
  variant = "compact",
  className,
  label = "Website",
}: {
  variant?: "compact" | "text";
  className?: string;
  /** Visible label for the text variant (compact uses an icon + aria-label). */
  label?: string;
}) {
  const ariaLabel = "Back to Rolling GA website";

  if (variant === "text") {
    return (
      <form action={returnToDemoBoardAction} className={className}>
        <button
          type="submit"
          className={cn(
            "text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground",
          )}
        >
          {label}
        </button>
      </form>
    );
  }

  return (
    <form action={returnToDemoBoardAction} className={className}>
      <button
        type="submit"
        className={cn(
          "flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
        )}
        aria-label={ariaLabel}
        title={ariaLabel}
      >
        <Globe className="size-[18px]" aria-hidden />
      </button>
    </form>
  );
}
