import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "dark" | "light" | "muted";

const toneClass: Record<Tone, string> = {
  dark: "mkt-section-dark",
  light: "mkt-section-light",
  muted: "mkt-section-muted",
};

/**
 * Full-width section wrapper matching mockup alternation (dark hero, white
 * problem band, dark feature band, etc.).
 */
export function MktSectionShell({
  tone = "dark",
  id,
  className,
  children,
  contained = true,
}: {
  tone?: Tone;
  id?: string;
  className?: string;
  children: ReactNode;
  contained?: boolean;
}) {
  return (
    <section id={id} className={cn(toneClass[tone], "py-16 md:py-24", className)}>
      <div className={cn(contained && "mx-auto max-w-7xl px-5 sm:px-8")}>{children}</div>
    </section>
  );
}
