import { cn } from "@/lib/utils";

/** Purple all-caps label above a section headline — mockup eyebrow pattern. */
export function MktEyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("mkt-eyebrow", className)}>{children}</p>;
}
