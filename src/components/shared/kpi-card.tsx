"use client";

import * as React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusLevel } from "@/lib/types";
import { StatusDot } from "./status-badge";

export interface KpiCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  icon: LucideIcon;
  status?: StatusLevel;
  delta?: number;
  deltaLabel?: string;
  onClick?: () => void;
  subtitle?: string;
}

export function KpiCard({
  label,
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  icon: Icon,
  status,
  delta,
  deltaLabel,
  onClick,
  subtitle,
}: KpiCardProps) {
  const DeltaIcon = delta === undefined || delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;
  const deltaColor =
    delta === undefined || delta === 0
      ? "text-muted-foreground"
      : delta > 0
      ? "text-success"
      : "text-danger";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-left shadow-soft transition-shadow hover:shadow-soft-lg",
        onClick && "cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-[18px]" />
        </div>
        {status && <StatusDot status={status} pulse={status === "red"} />}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-1 text-2xl font-semibold tracking-tight text-foreground tabular-nums"
        >
          {prefix}
          {value.toFixed(decimals)}
          {suffix}
        </motion.p>
      </div>
      <div className="flex items-center justify-between">
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        {delta !== undefined && (
          <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", deltaColor)}>
            <DeltaIcon className="size-3" />
            {Math.abs(delta)}
            {deltaLabel}
          </span>
        )}
      </div>
    </motion.button>
  );
}
