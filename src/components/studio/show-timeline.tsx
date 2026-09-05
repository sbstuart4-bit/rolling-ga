import { formatEventTime } from "@/lib/format";
import type { LiveDropSummary } from "@/server/studio/live";
import { cn } from "@/lib/utils";

const PHASES = [
  { id: "pre-show", label: "PRE-SHOW" },
  { id: "doors", label: "DOORS" },
  { id: "show", label: "SHOW" },
  { id: "encore", label: "ENCORE" },
  { id: "post-show", label: "POST-SHOW" },
] as const;

function phaseForState(state: string): (typeof PHASES)[number]["id"] {
  if (state === "upcoming") return "pre-show";
  if (state === "live") return "show";
  if (state === "recently_ended") return "post-show";
  return "pre-show";
}

export function ShowTimeline({
  eventState,
  startsAt,
  endsAt,
  doorsAt,
  timezone,
  drops,
}: {
  eventState: string;
  startsAt: Date;
  endsAt: Date;
  doorsAt: Date | null;
  timezone: string;
  drops: LiveDropSummary[];
}) {
  const activePhase = phaseForState(eventState);

  return (
    <section className="space-y-4">
      <h2 className="eyebrow text-muted-foreground">Show timeline</h2>

      <div className="relative overflow-x-auto pb-2">
        <ol className="flex min-w-[36rem] items-start gap-0">
          {PHASES.map((phase, index) => {
            const active = phase.id === activePhase;
            const dropHere = drops.find((drop) => labelForDropPhase(drop, phase.id));
            return (
              <li key={phase.id} className="relative flex flex-1 flex-col items-center">
                {index > 0 && (
                  <span
                    aria-hidden
                    className="absolute right-1/2 top-3 h-px w-full -translate-y-1/2 bg-border"
                  />
                )}
                <span
                  className={cn(
                    "relative z-10 flex size-6 items-center justify-center rounded-full border text-[10px] font-bold tracking-wider",
                    active
                      ? "border-[color:var(--studio-live,#e879f9)] bg-[color:var(--studio-live,#e879f9)] text-black"
                      : "border-border bg-background text-muted-foreground",
                  )}
                >
                  {index + 1}
                </span>
                <p
                  className={cn(
                    "mt-2 text-center text-[11px] font-semibold tracking-[0.14em]",
                    active ? "text-[color:var(--studio-live,#e879f9)]" : "text-muted-foreground",
                  )}
                >
                  {phase.label}
                </p>
                <p className="mt-1 text-center text-[10px] text-muted-foreground">
                  {markerTime(phase.id, { startsAt, endsAt, doorsAt, timezone })}
                </p>
                {dropHere && (
                  <div className="mt-2 w-full max-w-[8rem] rounded-md border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-center text-[10px] font-medium text-violet-200">
                    {dropHere.title}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function markerTime(
  phaseId: (typeof PHASES)[number]["id"],
  ctx: { startsAt: Date; endsAt: Date; doorsAt: Date | null; timezone: string },
): string {
  switch (phaseId) {
    case "pre-show":
      return formatEventTime(new Date(ctx.startsAt.getTime() - 2 * 60 * 60_000), ctx.timezone);
    case "doors":
      return formatEventTime(ctx.doorsAt ?? new Date(ctx.startsAt.getTime() - 30 * 60_000), ctx.timezone);
    case "show":
      return formatEventTime(ctx.startsAt, ctx.timezone);
    case "encore":
      return formatEventTime(new Date(ctx.endsAt.getTime() - 20 * 60_000), ctx.timezone);
    case "post-show":
      return formatEventTime(ctx.endsAt, ctx.timezone);
  }
}

function labelForDropPhase(drop: LiveDropSummary, phaseId: (typeof PHASES)[number]["id"]): boolean {
  if (phaseId === "encore" && drop.exclusivityType === "encore") return true;
  if (phaseId === "post-show" && drop.exclusivityType === "post_show") return true;
  if (phaseId === "show" && drop.exclusivityType === "flash") return true;
  return false;
}
