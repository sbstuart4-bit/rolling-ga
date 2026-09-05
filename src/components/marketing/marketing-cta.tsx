import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MarketingCta({
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  tertiaryHref,
  tertiaryLabel,
  className,
  align = "start",
}: {
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  tertiaryHref?: string;
  tertiaryLabel?: string;
  className?: string;
  align?: "start" | "center";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center",
        align === "center" && "items-center sm:justify-center",
        className,
      )}
    >
      <Button
        asChild
        size="lg"
        className="h-12 rounded-xl px-6 text-sm font-semibold uppercase tracking-[0.16em]"
      >
        <Link href={primaryHref}>{primaryLabel}</Link>
      </Button>
      {secondaryHref && secondaryLabel ? (
        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-12 rounded-xl border-foreground/25 bg-transparent px-6 text-sm font-semibold uppercase tracking-[0.16em] hover:bg-foreground/5"
        >
          <Link href={secondaryHref}>{secondaryLabel}</Link>
        </Button>
      ) : null}
      {tertiaryHref && tertiaryLabel ? (
        <Link
          href={tertiaryHref}
          className="text-center text-sm font-semibold uppercase tracking-[0.16em] text-primary hover:text-primary/80 sm:px-2"
        >
          {tertiaryLabel}
        </Link>
      ) : null}
    </div>
  );
}
