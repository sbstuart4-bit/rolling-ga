import { PILOT_MEASURES } from "@/components/marketing/marketing-fixtures";

export function PilotVisual() {
  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-3">
        <PilotStat value="1" label="Artist" />
        <PilotStat value="5" label="Shows" />
        <PilotStat value="1" label="Controlled test" />
      </div>
      <div>
        <p className="eyebrow mb-4 text-muted-foreground">Measure</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {PILOT_MEASURES.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-white/8 bg-[#161618] px-4 py-3 text-sm"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PilotStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#161618] p-6 text-center">
      <p className="font-display text-6xl leading-none">{value}</p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
    </div>
  );
}
