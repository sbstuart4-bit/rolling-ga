import Image from "next/image";
import { cn } from "@/lib/utils";

export interface PosterLayer {
  src: string;
  alt?: string;
  className?: string;
}

export function PosterCollage({
  layers,
  className,
}: {
  layers: PosterLayer[];
  className?: string;
}) {
  return (
    <div className={cn("relative isolate", className)} aria-hidden>
      <div className="credential-grain pointer-events-none absolute inset-0 z-10 rounded-2xl" />
      {layers.map((layer, index) => (
        <div
          key={layer.src}
          className={cn(
            "absolute overflow-hidden rounded-xl border border-white/10 shadow-soft-lg animate-float-subtle",
            layer.className,
          )}
          style={{ animationDelay: `${index * 0.4}s` }}
        >
          <Image src={layer.src} alt={layer.alt ?? ""} fill sizes="200px" className="object-cover" />
        </div>
      ))}
    </div>
  );
}
