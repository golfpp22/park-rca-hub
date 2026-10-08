import { describe, expect, it } from "vitest";
import { trafficCells, trafficLevel } from "@/lib/traffic-heatmap";

const rows = [{ site_id: "entrance", hour: 9, entries: 30, exits: 12 }, { site_id: "exit", hour: 9, entries: 4, exits: 20 }, { site_id: "entrance", hour: 10, entries: 0, exits: 0 }];
describe("Hourly traffic heatmap", () => {
  it("keeps each site's hourly entries separate", () => {
    const cells = trafficCells(rows, "entrance", "entries");
    expect(cells).toHaveLength(24);
    expect(cells[9]).toBe(30);
    expect(cells[10]).toBe(0);
    expect(cells[8]).toBeNull();
  });
  it("supports outgoing and combined traffic", () => {
    expect(trafficCells(rows, "exit", "exits")[9]).toBe(20);
    expect(trafficCells(rows, "entrance", "total")[9]).toBe(42);
  });
  it("distinguishes missing, zero and peak volume", () => {
    expect(trafficLevel(null, 100)).toBe(-1);
    expect(trafficLevel(0, 100)).toBe(0);
    expect(trafficLevel(20, 100)).toBe(1);
    expect(trafficLevel(100, 100)).toBe(5);
  });
});