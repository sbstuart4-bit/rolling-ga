"use client";

import { cn } from "@/lib/utils";

function colorForScore(score: number, invert: boolean) {
  const v = invert ? 100 - score : score;
  if (v >= 85) return "var(--success)";
  if (v >= 65) return "var(--warning)";
  return "var(--danger)";
}

export function RadialGauge({
  value,
  size = 120,
  strokeWidth = 10,
  label,
  sublabel,
  className,
  colorOverride,
  invert = false,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  className?: string;
  colorOverride?: string;
  /** Set true for "lower is better" metrics like Risk or Fatigue so color scales invert. */
  invert?: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;
  const color = colorOverride ?? colorForScore(value, invert);

  return (
    <div className={cn("relative inline-flex flex-col items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums text-foreground">{Math.round(value)}</span>
        {label && <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>}
      </div>
      {sublabel && <span className="mt-2 text-xs text-muted-foreground">{sublabel}</span>}
    </div>
  );
}
