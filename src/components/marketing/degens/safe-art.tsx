import Image from "next/image";
import { DEGENS_ART, safeArtAspect, type DegensArtId } from "./degens-art";
import { cn } from "@/lib/utils";

/**
 * Renders only the safe region of a Degens asset.
 *
 * The outer box takes the cropped aspect ratio and clips; the inner box is
 * scaled and offset so the kept window fills it exactly. Because the inner box
 * ends up at the file's natural aspect ratio, nothing is distorted — the
 * conflicting dates and venues are simply outside the frame.
 */
export function SafeArt({
  art,
  className,
  sizes = "100vw",
  priority = false,
  alt,
  quality,
}: {
  art: DegensArtId;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Pass `""` for artwork that repeats a caption already in the copy. */
  alt?: string;
  quality?: number;
}) {
  const entry = DEGENS_ART[art];
  const [x0, x1] = entry.keep.x;
  const [y0, y1] = entry.keep.y;
  const w = x1 - x0;
  const h = y1 - y0;

  return (
    <span
      className={cn("relative block overflow-hidden", className)}
      style={{ aspectRatio: safeArtAspect(art) }}
    >
      <span
        className="absolute block"
        style={{
          width: `${100 / w}%`,
          height: `${100 / h}%`,
          left: `${(-x0 / w) * 100}%`,
          top: `${(-y0 / h) * 100}%`,
        }}
      >
        <Image
          src={entry.src}
          alt={alt ?? entry.alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={quality}
          className="object-fill"
        />
      </span>
    </span>
  );
}
