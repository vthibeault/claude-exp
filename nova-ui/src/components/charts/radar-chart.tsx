import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { useMeasure } from "@/lib/use-measure";
import { useInView } from "@/lib/use-in-view";
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
  animate?: boolean;
  className?: string;
}

function polarPoint(
  cx: number,
  cy: number,
  r: number,
  axisIndex: number,
  axisCount: number,
  t: number,
): [number, number] {
  const angle = (2 * Math.PI * axisIndex) / axisCount - Math.PI / 2;
  return [cx + r * t * Math.cos(angle), cy + r * t * Math.sin(angle)];
}

function polygonPoints(pts: [number, number][]): string {
  return pts.map(([x, y]) => `${x},${y}`).join(" ");
}

export function RadarChart({
  data,
  axes,
  series,
  height = 280,
  maxValue,
  levels = 5,
  animate = true,
  className,
}: RadarChartProps) {
  const { ref: measureRef, width } = useMeasure<HTMLDivElement>();
  const { ref: inViewRef, inView } = useInView<HTMLDivElement>();

  const setRef = (el: HTMLDivElement | null) => {
    (measureRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    (inViewRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  };

  const size = Math.min(width, height);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const N = axes.length;
  const revealed = !animate || inView;

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

  const levelPolygons = useMemo(
    () =>
      Array.from({ length: levels }, (_, li) => {
        const t = (li + 1) / levels;
        const pts = axes.map((_, ai) => polarPoint(cx, cy, r, ai, N, t));
        return { t, points: polygonPoints(pts as [number, number][]) };
      }),
    [levels, axes, cx, cy, r, N],
  );

  const axisLines = useMemo(
    () =>
      axes.map((label, ai) => {
        const [x2, y2] = polarPoint(cx, cy, r, ai, N, 1);
        const [lx, ly] = polarPoint(cx, cy, r + 18, ai, N, 1);
        const angle = (2 * Math.PI * ai) / N - Math.PI / 2;
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
    const pts = axes.map((ax, ai) => {
      const v = Number(data[ax]) || 0;
      const t = Math.min(1, Math.max(0, v / resolvedMax));
      return polarPoint(cx, cy, r, ai, N, t) as [number, number];
    });
    return [{ key: "__default__", label: "", color: seriesColor(0), points: polygonPoints(pts) }];
  }, [series, data, axes, resolvedMax, cx, cy, r, N]);

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
    <div ref={setRef} className={cn("w-full", className)}>
      {width > 0 && size > 0 && N >= 3 && (
        <svg width={size} height={size} role="img" aria-label={`Radar chart with ${N} axes`}>
          {levelPolygons.map(({ t, points }) => (
            <polygon key={t} points={points} fill="none" stroke="var(--nova-border)" strokeWidth={1} />
          ))}

          {axisLines.map(({ label, x2, y2, lx, ly, anchor }) => (
            <g key={label}>
              <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="var(--nova-border)" strokeWidth={1} />
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

          {seriesPolygons.map(({ key, color, points }, si) => (
            <polygon
              key={key}
              points={points}
              fill={color}
              fillOpacity={0.15}
              stroke={color}
              strokeWidth={2}
              strokeLinejoin="round"
              style={{
                transformBox: "fill-box",
                transformOrigin: "50% 50%",
                transform: revealed ? "scale(1)" : "scale(0)",
                opacity: revealed ? 1 : 0,
                transition: revealed
                  ? `transform 600ms cubic-bezier(0.34,1.56,0.64,1) ${si * 80}ms, opacity 300ms ease ${si * 80}ms`
                  : "none",
              }}
            />
          ))}

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
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "50% 50%",
                  transform: revealed ? "scale(1)" : "scale(0)",
                  opacity: revealed ? 1 : 0,
                  transition: revealed
                    ? `transform 500ms cubic-bezier(0.34,1.56,0.64,1) ${si * 80 + ai * 30 + 200}ms, opacity 200ms ease ${si * 80 + ai * 30 + 200}ms`
                    : "none",
                }}
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
