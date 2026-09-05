import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FlowStep {
  icon: LucideIcon;
  title: string;
  detail?: string;
}

export function FlowDiagram({
  steps,
  className,
  direction = "horizontal",
}: {
  steps: FlowStep[];
  className?: string;
  direction?: "horizontal" | "vertical";
}) {
  const horizontal = direction === "horizontal";

  return (
    <ol
      className={cn(
        horizontal
          ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-[repeat(5,minmax(0,1fr))]"
          : "space-y-0",
        className,
      )}
    >
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isLast = index === steps.length - 1;

        return (
          <li
            key={step.title}
            className={cn("relative", !horizontal && "pl-12 pb-8 last:pb-0")}
          >
            {!horizontal && !isLast ? (
              <span
                className="absolute bottom-0 left-[19px] top-10 w-px bg-gradient-to-b from-primary/50 to-white/10"
                aria-hidden
              />
            ) : null}
            {horizontal && !isLast ? (
              <span
                className="absolute right-0 top-7 hidden h-px w-6 translate-x-full bg-gradient-to-r from-primary/40 to-transparent lg:block"
                aria-hidden
              />
            ) : null}
            <div className="deck-card rounded-xl border-white/10 bg-[#161618] p-4">
              <span className="flex size-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <p className="mt-3 text-sm font-medium leading-snug">{step.title}</p>
              {step.detail ? (
                <p className="mt-1 text-xs text-muted-foreground">{step.detail}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
