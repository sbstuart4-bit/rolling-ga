import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusLevel } from "@/lib/types";

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  icon?: LucideIcon;
  status?: StatusLevel;
}

const dotColor: Record<StatusLevel, string> = {
  green: "bg-success border-success/30",
  yellow: "bg-warning border-warning/30",
  red: "bg-danger border-danger/30",
};

export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn("relative space-y-0", className)}>
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <li key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
            {i < items.length - 1 && (
              <span className="absolute left-[15px] top-8 h-[calc(100%-1.75rem)] w-px bg-border" />
            )}
            <span
              className={cn(
                "z-10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border-2 bg-card text-foreground",
                item.status ? dotColor[item.status] : "border-border"
              )}
            >
              {Icon ? <Icon className="size-3.5" /> : <span className="size-1.5 rounded-full bg-current" />}
            </span>
            <div className="flex-1 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {new Date(item.timestamp).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
              {item.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
