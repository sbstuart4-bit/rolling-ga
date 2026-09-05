"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/types";

export function TrendChart({
  data,
  color = "var(--primary)",
  height = 200,
  unit = "",
  showGrid = true,
  showAxis = true,
}: {
  data: TrendPoint[];
  color?: string;
  height?: number;
  unit?: string;
  showGrid?: boolean;
  showAxis?: boolean;
}) {
  const gradientId = `trend-gradient-${color.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />}
        {showAxis && (
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            interval="preserveStartEnd"
          />
        )}
        {showAxis && (
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
        )}
        <Tooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 12,
            boxShadow: "0 8px 24px -8px rgba(0,0,0,0.2)",
          }}
          labelStyle={{ color: "var(--muted-foreground)", marginBottom: 4 }}
          formatter={(value) => [`${value}${unit}`, ""]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
