import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Approved mockup phone frame. Content is either a real product screenshot or a
 * labelled placeholder — never an illustrated fake UI.
 */
export function MktPhoneFrame({
  children,
  screenshot,
  screenshotAlt = "",
  label,
  className,
  align = "center",
  loading,
}: {
  children?: ReactNode;
  screenshot?: string;
  screenshotAlt?: string;
  label?: string;
  className?: string;
  /** Start-align when copy and phone share a left edge (e.g. How It Works journey units). */
  align?: "center" | "start";
  /** Override Next.js lazy default when below-fold phones must render without scroll. */
  loading?: "lazy" | "eager";
}) {
  return (
    <figure
      className={cn(
        "w-full",
        align === "center" ? "mx-auto" : "mr-auto",
        !className?.includes("mkt-how-it-works-phone") && "max-w-[280px]",
        className,
      )}
    >
      {label ? (
        <figcaption className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-mkt-muted">
          {label}
        </figcaption>
      ) : null}
      <div className="relative rounded-[2.25rem] border border-white/15 bg-[#0c0c0c] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div
          className="absolute left-1/2 top-2.5 z-10 h-5 w-[5.5rem] -translate-x-1/2 rounded-full bg-black"
          aria-hidden
        />
        <div className="overflow-hidden rounded-[1.85rem] bg-black">
          {screenshot ? (
            <Image
              src={screenshot}
              alt={screenshotAlt}
              width={390}
              height={844}
              unoptimized
              className="h-auto w-full"
              sizes={className?.includes("mkt-how-it-works-phone") ? "85vw" : "280px"}
              loading={loading}
            />
          ) : (
            children
          )}
        </div>
      </div>
    </figure>
  );
}
