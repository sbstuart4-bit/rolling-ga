import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type MarketingWorldId = "rga" | "degens";

/**
 * Scopes a marketing section to one of two visual worlds.
 *
 * Rolling GA opens and closes the page; The Degens own the middle of it. The
 * swap is a `data-world` attribute driving CSS custom properties, so the
 * takeover is inert markup — it renders identically with JavaScript disabled and
 * costs nothing at runtime.
 */
export function MarketingWorld({
  world,
  children,
  className,
  id,
  as: Tag = "section",
}: {
  world: MarketingWorldId;
  children: ReactNode;
  className?: string;
  id?: string;
  as?: "section" | "div" | "footer";
}) {
  return (
    <Tag id={id} data-world={world} className={cn("relative", className)}>
      {children}
    </Tag>
  );
}
