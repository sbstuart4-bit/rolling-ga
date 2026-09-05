import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DeviceFrame({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <figure className={cn("mx-auto w-full max-w-[320px]", className)}>
      {label ? (
        <figcaption className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </figcaption>
      ) : null}
      <div className="relative rounded-[2.15rem] border border-zinc-600/70 bg-zinc-950 p-2 shadow-soft-lg">
        <div className="absolute left-1/2 top-3 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black" aria-hidden />
        <div className="overflow-hidden rounded-[1.75rem] bg-[#0a0a0b]">{children}</div>
      </div>
    </figure>
  );
}
