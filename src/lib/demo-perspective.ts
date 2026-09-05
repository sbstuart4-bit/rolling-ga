/** Demo Board product perspectives — not production roles. */
export const DEMO_PERSPECTIVES = ["fan", "artist", "ops"] as const;
export type DemoPerspective = (typeof DEMO_PERSPECTIVES)[number];

export const DEMO_PERSPECTIVE_LABELS: Record<DemoPerspective, string> = {
  fan: "Fan experience",
  artist: "Artist Studio",
  ops: "Rolling GA Ops",
};

export function parseDemoPerspective(value: string | string[] | undefined): DemoPerspective {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && (DEMO_PERSPECTIVES as readonly string[]).includes(raw)) {
    return raw as DemoPerspective;
  }
  return "fan";
}

export function demoPerspectiveHref(perspective: DemoPerspective): string {
  return perspective === "fan" ? "/demo" : `/demo?perspective=${perspective}`;
}
