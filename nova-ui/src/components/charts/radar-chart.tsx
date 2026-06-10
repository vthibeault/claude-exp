import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { useMeasure } from "@/lib/use-measure";
import { seriesColor } from "./chart-utils";

export interface RadarSeries {
  key: string;
  label: string;
  color?: string;
}

export interface RadarChartProps {
  data: Record<string, unknown>;
  axes: string[];
  series?: RadarSeries[];
  height?: number;
  maxValue?: number;
  levels?: number;
  className?: string;
}

/** Compute (x, y) on the radar for a given axis index and normalised value [0..1]. */
function polarPoint(
  cx: number,
  cy: number,
  r: number,
  axisIndex: number,
  axisCount: number,
  t: number, // 0 = center, 1 = outer edge
): [number, number] {
  const angle = (2 * Math.PI * axisIndex) / axisCount - Math.PI / 2;
  return [cx + r * t * Math.cos(angle), cy + r * t * Math.sin(angle)];
}

function polygonPoints(pts: [number, number][]): string {
  return pts.map(([x, y]) => `${x},${y}`).join(" ");
}

/** Dependency-free SVG radar / spider chart. */
export function RadarChart({
  data,
  axes,
  series,
  height = 280,
  maxValue,
  levels = 5,
  className,
}: RadarChartProps) {
  const { ref, width } = useMeasure<HTMLDivElement>();

  const size = Math.min(width, height);
  const cx = size / 2;
  const cy = size / 2;
  // Leave room for axis labels: ~18% of size on each side
  const r = size * 0.38;

  const N = axes.length;

  // Resolve max value
  const resolvedMax = useMemo(() => {
    if (maxValue !== undefined && maxValue > 0) return maxValue;
    let m = 0;
    if (series && series.length > 0) {
      for (const s of series) {
        for (const ax of axes) {
          const v = Number((data as Record<string, unknown>)[`${s.key}_${ax}`]) || 0;
          if (v > m) m = v;
        }
      }
    } else {
      for (const ax of axes) {
        const v = Number(data[ax]) || 0;
        if (v > m) m = v;
      }
    }
    return m > 0 ? m : 100;
  }, [data, axes, series, maxValue]);

  // Concentric polygon points for each level
  const levelPolygons = useMemo(
    () =>
      Array.from({ length: levels }, (_, li) => {
        const t = (li + 1) / levels;
        const pts = axes.map((_, ai) => polarPoint(cx, cy, r, ai, N, t));
        return { t, points: polygonPoints(pts as [number, number][]) };
      }),
    [levels, axes, cx, cy, r, N],
  );

  // Axis spokes and labels
  const axisLines = useMemo(
    () =>
      axes.map((label, ai) => {
        const [x2, y2] = polarPoint(cx, cy, r, ai, N, 1);
        const [lx, ly] = polarPoint(cx, cy, r + 18, ai, N, 1);
        const angle = (2 * Math.PI * ai) / N - Math.PI / 2;
        // Anchor text based on which side of the chart
        const anchor =
          Math.abs(Math.cos(angle)) < 0.1
            ? "middle"
            : Math.cos(angle) < 0
            ? "end"
            : "start";
        return { label, x2, y2, lx, ly, anchor };
      }),
    [axes, cx, cy, r, N],
  );

  // Build data polygons
  type SeriesPolygon = { key: string; label: string; color: string; points: string };
  const seriesPolygons: SeriesPolygon[] = useMemo(() => {
    if (series && series.length > 0) {
      return series.map((s, si) => {
        const pts = axes.map((ax, ai) => {
          const v = Number((data as Record<string, unknown>)[`${s.key}_${ax}`]) || 0;
          const t = Math.min(1, Math.max(0, v / resolvedMax));
          return polarPoint(cx, cy, r, ai, N, t) as [number, number];
        });
        return {
          key: s.key,
          label: s.label,
          color: seriesColor(si, s.color),
          points: polygonPoints(pts),
        };
      });
    }
    // Simple usage: data keys match axes labels
    const pts = axes.map((ax, ai) => {
      const v = Number(data[ax]) || 0;
      const t = Math.min(1, Math.max(0, v / resolvedMax));
      return polarPoint(cx, cy, r, ai, N, t) as [number, number];
    });
    return [
      {
        key: "__default__",
        label: "",
        color: seriesColor(0),
        points: polygonPoints(pts),
      },
    ];
  }, [series, data, axes, resolvedMax, cx, cy, r, N]);

  // Vertex dots for each series polygon
  const seriesDots = useMemo(() => {
    if (series && series.length > 0) {
      return series.map((s, si) =>
        axes.map((ax, ai) => {
          const v = Number((data as Record<string, unknown>)[`${s.key}_${ax}`]) || 0;
          const t = Math.min(1, Math.max(0, v / resolvedMax));
          const [px, py] = polarPoint(cx, cy, r, ai, N, t);
          return { x: px, y: py, color: seriesColor(si, s.color) };
        }),
      );
    }
    return [
      axes.map((ax, ai) => {
        const v = Number(data[ax]) || 0;
        const t = Math.min(1, Math.max(0, v / resolvedMax));
        const [px, py] = polarPoint(cx, cy, r, ai, N, t);
        return { x: px, y: py, color: seriesColor(0) };
      }),
    ];
  }, [series, data, axes, resolvedMax, cx, cy, r, N]);

  const showLegend = series && series.length > 1;

  return (
    <div ref={ref} className={cn("w-full", className)}>
      {width > 0 && size > 0 && N >= 3 && (
        <svg
          width={size}
          height={size}
          role="img"
          aria-label={`Radar chart with ${N} axes`}
        >
          {/* Concentric grid polygons */}
          {levelPolygons.map(({ t, points }) => (
            <polygon
              key={t}
              points={points}
              fill="none"
              stroke="var(--nova-border)"
              strokeWidth={1}
            />
          ))}

          {/* Axis spokes */}
          {axisLines.map(({ label, x2, y2, lx, ly, anchor }) => (
            <g key={label}>
              <line
                x1={cx}
                y1={cy}
                x2={x2}
                y2={y2}
                stroke="var(--nova-border)"
                strokeWidth={1}
              />
              <text
                x={lx}
                y={ly}
                textAnchor={anchor as "start" | "middle" | "end"}
                dominantBaseline="middle"
                className="fill-subtle text-[10px]"
              >
                {label}
              </text>
            </g>
          ))}

          {/* Data polygons */}
          {seriesPolygons.map(({ key, color, points }) => (
            <polygon
              key={key}
              points={points}
              fill={color}
              fillOpacity={0.15}
              stroke={color}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          ))}

          {/* Vertex dots */}
          {seriesDots.map((dots, si) =>
            dots.map(({ x, y, color }, ai) => (
              <circle
                key={`${si}-${ai}`}
                cx={x}
                cy={y}
                r={3.5}
                fill={color}
                stroke="var(--nova-surface)"
                strokeWidth={1.5}
              />
            )),
          )}
        </svg>
      )}

      {showLegend && (
        <div className="mt-2 flex flex-wrap gap-4 px-2">
          {series!.map((s, si) => (
            <span key={s.key} className="inline-flex items-center gap-1.5 text-xs text-muted">
              <span className="size-2.5 rounded-full" style={{ background: seriesColor(si, s.color) }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
