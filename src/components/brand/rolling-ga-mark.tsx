import Link from "next/link";
import { cn } from "@/lib/utils";

function StarMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={cn("text-primary", className)} aria-hidden>
      <path
        fill="currentColor"
        d="M6 0.5L7.4 4.2H11.2L8.1 6.5L9.4 10.2L6 8L2.6 10.2L3.9 6.5L0.8 4.2H4.6L6 0.5Z"
      />
    </svg>
  );
}

/**
 * Compact wordmark for headers and credits.
 *
 * `tone="mono"` drops the purple so the mark can sit inside surfaces that own
 * their own colour — the marketing site, or an artist takeover.
 */
export function RollingGaMark({
  className,
  size = "default",
  tone = "brand",
}: {
  className?: string;
  size?: "sm" | "default" | "lg" | "xl";
  tone?: "brand" | "mono";
}) {
  const sizes = {
    sm: "text-[10px]",
    default: "text-xs",
    lg: "text-sm",
    xl: "text-base sm:text-lg lg:text-[1.375rem]",
  } as const;
  const accent = tone === "mono" ? "text-current" : "text-primary";

  return (
    <span className={cn("inline-flex items-center gap-2 font-display font-normal tracking-[0.18em] text-foreground lg:gap-2.5 lg:tracking-[0.2em]", sizes[size], className)}>
      <StarMark
        className={cn(
          size === "xl"
            ? "size-4 lg:size-5"
            : size === "lg"
              ? "size-3"
              : size === "sm"
                ? "size-2"
                : "size-2.5",
          accent,
        )}
      />
      Rolling<span className={accent}>&nbsp;GA</span>
    </span>
  );
}

/** Logo wordmark that links to the marketing homepage. */
export function RollingGaHomeLink({
  className,
  markClassName,
  size = "default",
  tone = "brand",
}: {
  className?: string;
  markClassName?: string;
  size?: "sm" | "default" | "lg" | "xl";
  tone?: "brand" | "mono";
}) {
  return (
    <Link
      href="/home"
      className={cn(
        "inline-flex shrink-0 rounded-sm transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      aria-label="Rolling GA home"
    >
      <RollingGaMark size={size} tone={tone} className={markClassName} />
    </Link>
  );
}

/**
 * Stacked hero logo from the brand mockup:
 * ROLLING on top, large GA below with a star in the A counter.
 */
export function RollingGaLogo({
  className,
  size = "default",
}: {
  className?: string;
  size?: "default" | "hero";
}) {
  const isHero = size === "hero";

  return (
    <div className={cn("flex flex-col items-center leading-none text-foreground", className)}>
      <span
        className={cn(
          "font-display tracking-[0.22em]",
          isHero ? "text-lg md:text-xl" : "text-sm",
        )}
      >
        Rolling
      </span>
      <span className="relative font-display tracking-[0.06em]">
        <span className={cn(isHero ? "text-7xl md:text-8xl" : "text-4xl")}>G</span>
        <span className={cn("relative inline-block", isHero ? "text-7xl md:text-8xl" : "text-4xl")}>
          A
          <StarMark
            className={
              isHero
                ? "absolute right-[0.12em] top-[0.55em] size-3 md:size-3.5"
                : "absolute right-[0.1em] top-[0.5em] size-2"
            }
          />
        </span>
      </span>
    </div>
  );
}

export function PoweredByRollingGa({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 py-8 text-[10px] uppercase tracking-[0.2em] text-artist-muted",
        className,
      )}
    >
      <span className="opacity-70">Powered by</span>
      <RollingGaMark size="sm" className="opacity-90 text-artist-muted" />
    </div>
  );
}
