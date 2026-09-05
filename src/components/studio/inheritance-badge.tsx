import { sourceLabel, type ConfigSource } from "@/lib/tour-inheritance";
import { cn } from "@/lib/utils";

export function InheritanceBadge({ source }: { source: ConfigSource }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        source === "show-override"
          ? "bg-violet-500/15 text-violet-300"
          : source === "inherited-tour"
            ? "bg-muted text-muted-foreground"
            : "bg-muted/50 text-muted-foreground",
      )}
    >
      {sourceLabel(source)}
    </span>
  );
}
