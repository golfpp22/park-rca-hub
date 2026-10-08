export type TrafficMetric = "entries" | "exits" | "total";
export type TrafficRow = { site_id: string; hour: number; entries: number; exits: number };

export function trafficCells(rows: TrafficRow[], siteId: string, metric: TrafficMetric): (number | null)[] {
  return Array.from({ length: 24 }, (_, hour) => {
    const matches = rows.filter((row) => row.site_id === siteId && row.hour === hour);
    if (!matches.length) return null;
    return matches.reduce((sum, row) => sum + (metric === "total" ? row.entries + row.exits : row[metric]), 0);
  });
}

export function trafficLevel(value: number | null, max: number): number {
  if (value === null) return -1;
  if (value === 0 || max <= 0) return 0;
  return Math.min(5, Math.max(1, Math.ceil(value / max * 5)));
}