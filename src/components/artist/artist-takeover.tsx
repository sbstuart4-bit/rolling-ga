import type { ReactNode } from "react";
import { PoweredByRollingGa } from "@/components/brand/rolling-ga-mark";
import { type ResolvedTheme, themeToCssVars } from "@/lib/theme";
import { cn } from "@/lib/utils";

/**
 * Applies an artist's visual world to everything inside it.
 *
 * The resolved theme becomes inline custom properties on this wrapper, so any
 * descendant can use `bg-artist-bg`, `text-artist-fg`, `border-artist-border`,
 * `font-artist` and so on. No artist requires hand-written CSS, and unset tokens fall
 * through to Rolling GA's neutrals.
 */
export function ArtistTakeover({
  theme,
  children,
  className,
  showFooter = true,
}: {
  theme: ResolvedTheme;
  children: ReactNode;
  className?: string;
  showFooter?: boolean;
}) {
  return (
    <div
      style={themeToCssVars(theme)}
      className={cn("min-h-full bg-artist-bg text-artist-fg", className)}
    >
      {children}
      {showFooter && <PoweredByRollingGa />}
    </div>
  );
}

/** The same token scope without the footer, for previews and embedded cards. */
export function ArtistThemeScope({
  theme,
  children,
  className,
}: {
  theme: ResolvedTheme;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div style={themeToCssVars(theme)} className={className}>
      {children}
    </div>
  );
}
