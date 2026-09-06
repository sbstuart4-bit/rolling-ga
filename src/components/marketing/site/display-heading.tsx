import { cn } from "@/lib/utils";

export function MktDisplayHeading({
  as: Tag = "h2",
  children,
  className,
  purple,
}: {
  as?: "h1" | "h2" | "h3";
  children: React.ReactNode;
  className?: string;
  /** Second-line or accent phrase rendered in Rolling GA purple. */
  purple?: React.ReactNode;
}) {
  return (
    <Tag className={cn("mkt-display text-[clamp(2rem,5.5vw,4.5rem)] leading-[0.92]", className)}>
      {children}
      {purple ? <span className="block text-mkt-purple">{purple}</span> : null}
    </Tag>
  );
}
