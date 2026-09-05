import { cn } from "@/lib/utils";

export const CLAIM_KINDS = ["demo", "illustrative", "pilot", "framing"] as const;
export type ClaimKind = (typeof CLAIM_KINDS)[number];

export const CLAIM_LABELS: Record<ClaimKind, string> = {
  demo: "Demo example",
  illustrative: "Illustrative",
  pilot: "Pilot concept",
  framing: "Framing example",
};

export function ClaimLabel({
  kind,
  className,
}: {
  kind: ClaimKind;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border/80 bg-background/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground",
        className,
      )}
    >
      {CLAIM_LABELS[kind]}
    </span>
  );
}
