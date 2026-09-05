import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const gradients = [
  "from-violet-500/80 to-indigo-600/80",
  "from-blue-500/80 to-cyan-600/80",
  "from-emerald-500/80 to-teal-600/80",
  "from-amber-500/80 to-orange-600/80",
  "from-rose-500/80 to-pink-600/80",
  "from-fuchsia-500/80 to-purple-600/80",
  "from-sky-500/80 to-blue-700/80",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function PhotoPlaceholder({
  seed,
  icon: Icon,
  label,
  className,
  rounded = "rounded-xl",
}: {
  seed: string;
  icon?: LucideIcon;
  label?: string;
  className?: string;
  rounded?: string;
}) {
  const gradient = gradients[hashString(seed) % gradients.length];
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br text-white",
        gradient,
        rounded,
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
      {Icon && <Icon className="relative size-1/3 opacity-90" strokeWidth={1.5} />}
      {label && !Icon && (
        <span className="relative text-sm font-semibold tracking-wide">{label}</span>
      )}
    </div>
  );
}

export function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
