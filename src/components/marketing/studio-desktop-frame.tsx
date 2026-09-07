import Image from "next/image";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import { RollingGaMark } from "@/components/brand/rolling-ga-mark";
import { HOME_STUDIO_OVERVIEW } from "@/components/marketing/home/marketing-home-fixtures";
import { cn } from "@/lib/utils";

const NAV: {
  label: string;
  icon: typeof LayoutDashboard;
  active?: boolean;
}[] = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Shows", icon: CalendarDays },
  { label: "Fans", icon: Users },
  { label: "Merch", icon: Package },
  { label: "Drops", icon: Sparkles },
  { label: "Orders", icon: ShoppingBag },
  { label: "Insights", icon: BarChart3 },
];

const CHART_MAX_PX = 128;

/**
 * Marketing Artist Studio desktop frame — Marisol Reyes tour overview mockup.
 */
export function StudioDesktopFrame({ className }: { className?: string }) {
  const data = HOME_STUDIO_OVERVIEW;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-white/10 bg-[#141416] shadow-[0_32px_80px_rgba(0,0,0,0.45)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-zinc-600" aria-hidden />
        <span className="size-2.5 rounded-full bg-zinc-600" aria-hidden />
        <span className="size-2.5 rounded-full bg-zinc-600" aria-hidden />
      </div>

      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 sm:px-5">
        <RollingGaMark size="sm" tone="mono" className="text-white/90" />
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-1 pr-2.5">
          <Image
            src={data.portrait}
            alt=""
            width={28}
            height={28}
            className="size-7 rounded-full object-cover"
          />
          <span className="text-xs font-medium text-white">{data.artistName}</span>
          <ChevronDown className="size-3.5 text-white/50" aria-hidden />
        </div>
      </div>

      <div className="grid min-[720px]:grid-cols-[10.5rem_1fr]">
        <aside className="hidden border-r border-white/5 p-3 min-[720px]:block">
          <ul className="space-y-0.5">
            {NAV.map((item) => (
              <li key={item.label}>
                <span
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px]",
                    item.active
                      ? "bg-mkt-purple/15 font-medium text-white"
                      : "text-white/55",
                  )}
                >
                  <item.icon className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </aside>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">Tour Overview</h3>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/70">
              Last 12 shows
              <ChevronDown className="size-3.5" aria-hidden />
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-2 min-[900px]:grid-cols-4">
            {data.kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="min-w-0 rounded-xl border border-white/8 bg-[#1c1c1f] px-3 py-2.5"
              >
                <dt className="text-[10px] leading-tight text-white/50">{kpi.label}</dt>
                <dd className="mt-1 text-[1.05rem] font-semibold leading-none tabular text-white min-[900px]:text-xl">
                  {kpi.value}
                </dd>
                <p className="mt-1.5 text-[10px] font-medium whitespace-nowrap text-emerald-400">
                  {kpi.delta}
                </p>
              </div>
            ))}
          </dl>

          <div className="grid gap-3 min-[900px]:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <div className="rounded-xl border border-white/8 bg-[#1c1c1f] p-4">
              <p className="text-sm font-medium text-white">Merch Sales by Show</p>
              <div className="mt-4 flex h-[9.5rem] items-end justify-between gap-1.5 sm:gap-2">
                {data.salesByShow.map((bar) => (
                  <div
                    key={bar.city}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span
                      className="w-full max-w-8 rounded-t bg-mkt-purple sm:max-w-9"
                      style={{ height: `${Math.round((CHART_MAX_PX * bar.pct) / 100)}px` }}
                      aria-hidden
                    />
                    <span className="w-full text-center text-[9px] leading-tight text-white/45 sm:text-[10px]">
                      {bar.city}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/8 bg-[#1c1c1f] p-4">
              <p className="text-sm font-medium text-white">Top Products</p>
              <ol className="mt-3 space-y-2.5">
                {data.topProducts.map((product, index) => (
                  <li key={product.name} className="flex gap-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/8 text-[10px] font-semibold text-white/70">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium leading-snug text-white">
                        {product.name}
                      </p>
                      <p className="text-[10px] text-white/45">{product.units}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
