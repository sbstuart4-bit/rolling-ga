import { cn } from "@/lib/utils";

/** Compact show context above product title — city / date / access. */
export function ProductMetadataStrip({
  city,
  dateLabel,
  accessLabel = "Verified attendees only",
  scoped = true,
  className,
}: {
  city: string;
  dateLabel: string;
  accessLabel?: string;
  scoped?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[10px] font-semibold uppercase tracking-[0.16em]",
        scoped ? "text-artist-accent" : "text-primary",
        className,
      )}
    >
      {city.toUpperCase()} / {dateLabel} · {accessLabel}
    </p>
  );
}
