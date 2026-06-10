export const CHART_COLORS = [
  "var(--nova-chart-1)",
  "var(--nova-chart-2)",
  "var(--nova-chart-3)",
  "var(--nova-chart-4)",
  "var(--nova-chart-5)",
  "var(--nova-chart-6)",
];

export function seriesColor(index: number, override?: string) {
  return override ?? CHART_COLORS[index % CHART_COLORS.length];
}

/** Linear scale: maps [d0, d1] onto [r0, r1]. */
export function scaleLinear(d0: number, d1: number, r0: number, r1: number) {
  const dd = d1 - d0 || 1;
  return (v: number) => r0 + ((v - d0) / dd) * (r1 - r0);
}

/** "Nice" tick values for an axis: 1/2/5 × 10^n steps covering [min, max]. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) {
    return min === 0 ? [0, 1] : [0, min * 2];
  }
  const span = max - min;
  const rawStep = span / Math.max(1, count - 1);
  const mag = 10 ** Math.floor(Math.log10(rawStep));
  const norm = rawStep / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;

  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) {
    // Snap floating point drift (0.30000000000000004 → 0.3).
    ticks.push(Number(v.toFixed(10)));
  }
  return ticks;
}

export function defaultFormat(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${Number((v / 1_000_000).toFixed(1))}M`;
  if (Math.abs(v) >= 1_000) return `${Number((v / 1_000).toFixed(1))}k`;
  return String(Number(v.toFixed(2)));
}

/** Smooth path through points using Catmull-Rom converted to cubic Béziers. */
export function smoothPath(pts: Array<[number, number]>): string {
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M${pts[0][0]},${pts[0][1]}L${pts[1][0]},${pts[1][1]}`;

  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x},${c1y},${c2x},${c2y},${p2[0]},${p2[1]}`;
  }
  return d;
}

export function linearPath(pts: Array<[number, number]>): string {
  return pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join("");
}
