import { cn } from "@/lib/utils";

/**
 * Temporary stand-in when approved photography is not yet available.
 * Preserves the intended aspect ratio and labels the slot — never a new concept.
 */
export function MktPhotoPlaceholder({
  label,
  aspect = "video",
  className,
}: {
  label: string;
  aspect?: "video" | "square" | "portrait" | "wide";
  className?: string;
}) {
  const aspectClass = {
    video: "aspect-video",
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    wide: "aspect-[21/9]",
  }[aspect];

  return (
    <figure className={cn("relative overflow-hidden", aspectClass, className)}>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-mkt-surface p-6 text-center"
        aria-label={`Photography placeholder: ${label}`}
      >
        <span className="mkt-eyebrow text-mkt-muted">Placeholder</span>
        <figcaption className="max-w-xs text-sm font-medium text-mkt-muted">{label}</figcaption>
      </div>
    </figure>
  );
}
