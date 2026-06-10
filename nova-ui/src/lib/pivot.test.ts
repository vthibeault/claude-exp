import { describe, expect, it } from "vitest";
import { buildPivot, leafCount } from "./pivot";

const sales = [
  { region: "EMEA", country: "France", category: "Hardware", quarter: "Q1", revenue: 100, units: 10 },
  { region: "EMEA", country: "France", category: "Audio", quarter: "Q1", revenue: 50, units: 5 },
  { region: "EMEA", country: "Germany", category: "Hardware", quarter: "Q1", revenue: 200, units: 20 },
  { region: "EMEA", country: "Germany", category: "Hardware", quarter: "Q2", revenue: 300, units: 25 },
  { region: "APAC", country: "Japan", category: "Hardware", quarter: "Q1", revenue: 400, units: 30 },
  { region: "APAC", country: "Japan", category: "Audio", quarter: "Q2", revenue: 150, units: 12 },
];

const revenueSum = { key: "revenue", aggregation: "sum" as const };

describe("buildPivot", () => {
  it("computes leaf cells, subtotals and grand totals from one lookup", () => {
    const p = buildPivot(sales, {
      rows: ["region", "country"],
      columns: ["quarter"],
      values: [revenueSum],
    });

    // Leaf cell
    expect(p.getValue(["EMEA", "Germany"], ["Q1"], revenueSum)).toBe(200);
    // Row subtotal (group level)
    expect(p.getValue(["EMEA"], ["Q1"], revenueSum)).toBe(350);
    // Row total across all columns
    expect(p.getValue(["EMEA", "France"], [], revenueSum)).toBe(150);
    // Column total across all rows
    expect(p.getValue([], ["Q2"], revenueSum)).toBe(450);
    // Grand total
    expect(p.getValue([], [], revenueSum)).toBe(1200);
    // Empty intersection
    expect(p.getValue(["EMEA", "France"], ["Q2"], revenueSum)).toBeNull();
  });

  it("supports avg, count, min and max", () => {
    const p = buildPivot(sales, {
      rows: ["region"],
      columns: [],
      values: [
        { key: "revenue", aggregation: "avg" },
        { key: "revenue", aggregation: "count" },
        { key: "revenue", aggregation: "min" },
        { key: "revenue", aggregation: "max" },
      ],
    });

    expect(p.getValue(["EMEA"], [], { key: "revenue", aggregation: "avg" })).toBeCloseTo(162.5);
    expect(p.getValue(["EMEA"], [], { key: "revenue", aggregation: "count" })).toBe(4);
    expect(p.getValue(["APAC"], [], { key: "revenue", aggregation: "min" })).toBe(150);
    expect(p.getValue(["APAC"], [], { key: "revenue", aggregation: "max" })).toBe(400);
  });

  it("builds sorted row and column trees with correct nesting", () => {
    const p = buildPivot(sales, {
      rows: ["region", "country"],
      columns: ["quarter"],
      values: [revenueSum],
    });

    expect(p.rowTree.map((n) => n.label)).toEqual(["APAC", "EMEA"]);
    const emea = p.rowTree[1];
    expect(emea.children.map((n) => n.label)).toEqual(["France", "Germany"]);
    expect(emea.children[0].path).toEqual(["EMEA", "France"]);

    expect(p.columnLeaves).toEqual([["Q1"], ["Q2"]]);
  });

  it("handles empty column config with a single implicit leaf", () => {
    const p = buildPivot(sales, { rows: ["region"], columns: [], values: [revenueSum] });
    expect(p.columnLeaves).toEqual([[]]);
    expect(p.getValue(["APAC"], [], revenueSum)).toBe(550);
  });

  it("subtotals equal the sum of their children", () => {
    const p = buildPivot(sales, {
      rows: ["region", "country", "category"],
      columns: ["quarter"],
      values: [revenueSum],
    });

    const childSum =
      (p.getValue(["EMEA", "France"], ["Q1"], revenueSum) ?? 0) +
      (p.getValue(["EMEA", "Germany"], ["Q1"], revenueSum) ?? 0);
    expect(p.getValue(["EMEA"], ["Q1"], revenueSum)).toBe(childSum);
  });

  it("counts leaf columns for header colspans", () => {
    const p = buildPivot(sales, {
      rows: ["region"],
      columns: ["quarter", "category"],
      values: [revenueSum],
    });
    // Q1 has Hardware+Audio, Q2 has Hardware+Audio (from data combos present)
    const q1 = p.columnTree.find((n) => n.label === "Q1")!;
    expect(leafCount(q1)).toBe(q1.children.length);
    expect(p.columnLeaves.every((path) => path.length === 2)).toBe(true);
  });
});
