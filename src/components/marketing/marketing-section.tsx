import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MarketingSection({
  id,
  eyebrow,
  headline,
  children,
  className,
  contained = true,
  /** The first section on a page owns the document heading. */
  headingLevel = 2,
}: {
  id?: string;
  eyebrow?: string;
  headline?: ReactNode;
  children: ReactNode;
  className?: string;
  contained?: boolean;
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <section id={id} className={cn("relative py-20 md:py-28", className)}>
      <div className={cn(contained && "mx-auto max-w-6xl px-5 sm:px-8")}>
        {eyebrow || headline ? (
          <header className="mb-10 max-w-4xl md:mb-14">
            {eyebrow ? <p className="mk-kicker mb-5 text-world-muted">{eyebrow}</p> : null}
            {headline ? (
              <Heading className="mk-display mk-display-tight text-[clamp(1.875rem,5vw,4.5rem)]">
                {headline}
              </Heading>
            ) : null}
          </header>
        ) : null}
        {children}
      </div>
    </section>
  );
}
