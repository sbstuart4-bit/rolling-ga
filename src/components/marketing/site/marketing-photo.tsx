import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Real approved photography — preserves aspect ratio and alt text.
 */
export function MktPhoto({
  src,
  alt,
  aspect = "video",
  priority = false,
  className,
  objectPosition = "center",
}: {
  src: string;
  alt: string;
  aspect?: "video" | "square" | "portrait" | "wide" | "hero";
  priority?: boolean;
  className?: string;
  objectPosition?: string;
}) {
  const aspectClass = {
    video: "aspect-video",
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    wide: "aspect-[21/9]",
    hero: "aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5]",
  }[aspect];

  return (
    <figure className={cn("relative overflow-hidden", aspectClass, className)}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(min-width: 1280px) 640px, (min-width: 768px) 50vw, 100vw"
        className="object-cover"
        style={{ objectPosition }}
      />
    </figure>
  );
}
