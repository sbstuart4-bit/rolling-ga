import { cn } from "@/lib/utils";

export function MarketingGlow({
  className,
  variant = "primary",
}: {
  className?: string;
  variant?: "primary" | "accent" | "warm";
}) {
  const orbClass = {
    primary: "bg-[#7b3cff]/25",
    accent: "bg-[#D8FF3E]/15",
    warm: "bg-[#FF4A28]/12",
  } as const;

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <div
        className={cn(
          "absolute -left-1/4 top-0 size-[min(80vw,36rem)] rounded-full blur-3xl animate-glow-pulse",
          orbClass[variant],
        )}
      />
      <div
        className={cn(
          "absolute -right-1/4 bottom-0 size-[min(70vw,28rem)] rounded-full blur-3xl animate-glow-pulse",
          orbClass[variant],
        )}
        style={{ animationDelay: "2s" }}
      />
    </div>
  );
}
