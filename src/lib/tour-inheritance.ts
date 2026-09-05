import type { ThemeLevel } from "@/lib/theme";

export type ConfigSource = "inherited-tour" | "inherited-artist" | "show-override" | "unset";

export function sourceLabel(source: ConfigSource): string {
  switch (source) {
    case "inherited-tour":
      return "Inherited from tour";
    case "inherited-artist":
      return "Inherited from artist";
    case "show-override":
      return "Show override";
    default:
      return "Not set";
  }
}

export function themeLevelToSource(level: ThemeLevel | null | undefined): ConfigSource {
  if (level === "event") return "show-override";
  if (level === "tour") return "inherited-tour";
  if (level === "artist") return "inherited-artist";
  return "unset";
}

export function fieldHasOverride(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}
