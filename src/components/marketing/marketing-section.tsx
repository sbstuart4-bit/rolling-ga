import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MarketingSection({
  id,
  eyebrow,
  headline,
  children,
  className,
  contained = true,
}: {
  id?: string;
  eyebrow?: string;
  headline?: ReactNode;
  children: ReactNode;
  className?: string;
  contained?: boolean;
}) {
  return (
    <section id={id} className={cn("relative py-20 md:py-28", className)}>
      <div className={cn(contained && "mx-auto max-w-6xl px-5 sm:px-8")}>
        {eyebrow || headline ? (
          <header className="mb-10 max-w-4xl md:mb-14">
            {eyebrow ? <p className="eyebrow mb-4 text-primary">{eyebrow}</p> : null}
            {headline ? (
              <h2 className="display-xl text-4xl sm:text-5xl md:text-6xl lg:text-7xl">{headline}</h2>
            ) : null}
          </header>
        ) : null}
        {children}
      </div>
    </section>
  );
}
