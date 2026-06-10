import { useMemo, useState, type PointerEvent } from "react";
import { cn } from "@/lib/cn";
import { useMeasure } from "@/lib/use-measure";
import { useInView } from "@/lib/use-in-view";
import { defaultFormat, niceTicks, scaleLinear, seriesColor } from "./chart-utils";
import { ChartTooltip } from "./line-chart";

export interface ScatterSeries {
  key: string;
  yKey: string;
  sizeKey?: string;
  label: string;
  color?: string;
}

export interface ScatterChartProps {
  data: Record<string, unknown>[];
  series: ScatterSeries[];
  xLabel?: string;
  yLabel?: string;
  height?: number;
  formatX?: (v: number) => string;
  formatY?: (v: number) => string;
  animate?: boolean;
  className?: string;
}

const PAD = { top: 12, right: 12, bottom: 36, left: 48 };
const FIXED_RADIUS = 5;
const MIN_RADIUS = 3;
const MAX_RADIUS = 16;

export function ScatterChart({
  data,
  series,
  xLabel,
  yLabel,
  height = 280,
  formatX = defaultFormat,
  formatY = defaultFormat,
  animate = true,
  className,
}: ScatterChartProps) {
  const { ref, width } = useMeasure<HTMLDivElement>();
  const inView = useInView(ref);
  const [hover, setHover] = useState<{ si: number; di: number } | null>(null);

  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = height - PAD.top - PAD.bottom;
  const revealed = !animate || inView;

  const { xMin, xMax, yMin, yMax, sizeMin, sizeMax } = useMemo(() => {
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity,
      sizeMin = Infinity, sizeMax = -Infinity;
    for (const s of series) {
      for (const d of data) {
        const xv = Number(d[s.key]);
        const yv = Number(d[s.yKey]);
        if (isFinite(xv)) { xMin = Math.min(xMin, xv); xMax = Math.max(xMax, xv); }
        if (isFinite(yv)) { yMin = Math.min(yMin, yv); yMax = Math.max(yMax, yv); }
        if (s.sizeKey) {
          const sv = Number(d[s.sizeKey]);
          if (isFinite(sv)) { sizeMin = Math.min(sizeMin, sv); sizeMax = Math.max(sizeMax, sv); }
        }
      }
    }
    return {
      xMin: isFinite(xMin) ? xMin : 0, xMax: isFinite(xMax) ? xMax : 1,
      yMin: isFinite(yMin) ? yMin : 0, yMax: isFinite(yMax) ? yMax : 1,
      sizeMin: isFinite(sizeMin) ? sizeMin : 0, sizeMax: isFinite(sizeMax) ? sizeMax : 1,
    };
  }, [data, series]);

  const xTicks = niceTicks(xMin, xMax);
  const yTicks = niceTicks(yMin, yMax);
  const sx = scaleLinear(xTicks[0], xTicks[xTicks.length - 1], PAD.left, PAD.left + innerW);
  const sy = scaleLinear(yTicks[0], yTicks[yTicks.length - 1], PAD.top + innerH, PAD.top);
  const sizeScale = scaleLinear(sizeMin, sizeMax === sizeMin ? sizeMin + 1 : sizeMax, MIN_RADIUS, MAX_RADIUS);

  const allPoints = useMemo(() => {
    if (innerW === 0) return [];
    return series.flatMap((s, si) =>
      data.map((d, di) => ({
        si, di,
        cx: sx(Number(d[s.key]) || 0),
        cy: sy(Number(d[s.yKey]) || 0),
      })),
    );
  }, [series, data, sx, sy, innerW]);

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (data.length === 0 || innerW === 0 || allPoints.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    let best: typeof hover = null;
    let bestDist = Infinity;
    for (const pt of allPoints) {
      const dist = Math.hypot(pt.cx - px, pt.cy - py);
      if (dist < bestDist) { bestDist = dist; best = { si: pt.si, di: pt.di }; }
    }
    setHover(best);
  };

  const hoverPoint = hover !== null
    ? { s: series[hover.si], d: data[hover.di], si: hover.si, di: hover.di }
    : null;

  return (
    <div ref={ref} className={cn("w-full", className)}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`Scatter chart with ${series.length} series and ${data.length} points`}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setHover(null)}
        >
          {yTicks.map((t) => (
            <g key={`gy-${t}`}>
              <line
                x1={PAD.left} x2={PAD.left + innerW}
                y1={sy(t)} y2={sy(t)}
                stroke="var(--nova-border)" strokeDasharray={t === 0 ? undefined : "3 3"}
              />
              <text x={PAD.left - 8} y={sy(t)} textAnchor="end" dominantBaseline="middle" className="fill-subtle text-[10px]">
                {formatY(t)}
              </text>
            </g>
          ))}

          {xTicks.map((t) => (
            <g key={`gx-${t}`}>
              <line
                x1={sx(t)} x2={sx(t)}
                y1={PAD.top} y2={PAD.top + innerH}
                stroke="var(--nova-border)" strokeDasharray="3 3"
              />
              <text x={sx(t)} y={PAD.top + innerH + 14} textAnchor="middle" className="fill-subtle text-[10px]">
                {formatX(t)}
              </text>
            </g>
          ))}

          {xLabel && (
            <text x={PAD.left + innerW / 2} y={height - 4} textAnchor="middle" className="fill-subtle text-[10px]">
              {xLabel}
            </text>
          )}
          {yLabel && (
            <text
              x={8} y={PAD.top + innerH / 2}
              textAnchor="middle" dominantBaseline="middle"
              transform={`rotate(-90, 8, ${PAD.top + innerH / 2})`}
              className="fill-subtle text-[10px]"
            >
              {yLabel}
            </text>
          )}

          {series.map((s, si) => {
            const color = seriesColor(si, s.color);
            return (
              <g key={`${s.key}-${s.yKey}`}>
                {data.map((d, di) => {
                  const circleX = sx(Number(d[s.key]) || 0);
                  const circleY = sy(Number(d[s.yKey]) || 0);
                  const rr = s.sizeKey ? sizeScale(Number(d[s.sizeKey]) || 0) : FIXED_RADIUS;
                  const isHovered = hover !== null && hover.si === si && hover.di === di;
                  const delay = (si * data.length + di) * 20;
                  return (
                    <circle
                      key={di}
                      cx={circleX}
                      cy={circleY}
                      r={rr}
                      fill={color}
                      fillOpacity={isHovered ? 0.9 : 0.65}
                      stroke={color}
                      strokeWidth={isHovered ? 2 : 1}
                      strokeOpacity={0.9}
                      style={{
                        transformBox: "fill-box",
                        transformOrigin: "50% 50%",
                        transform: revealed ? "scale(1)" : "scale(0)",
                        opacity: revealed ? 1 : 0,
                        transition: revealed
                          ? `transform 500ms cubic-bezier(0.34,1.56,0.64,1) ${delay}ms, opacity 300ms ease ${delay}ms`
                          : "none",
                      }}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      )}

      {hoverPoint && (
        <ChartTooltip
          xLeft={width > 0 ? sx(Number(hoverPoint.d[hoverPoint.s.key]) || 0) : 0}
          width={width}
          label={hoverPoint.s.label}
          rows={[
            { color: seriesColor(hoverPoint.si, hoverPoint.s.color), label: "x", value: formatX(Number(hoverPoint.d[hoverPoint.s.key]) || 0) },
            { color: seriesColor(hoverPoint.si, hoverPoint.s.color), label: "y", value: formatY(Number(hoverPoint.d[hoverPoint.s.yKey]) || 0) },
            ...(hoverPoint.s.sizeKey
              ? [{ color: seriesColor(hoverPoint.si, hoverPoint.s.color), label: hoverPoint.s.sizeKey, value: defaultFormat(Number(hoverPoint.d[hoverPoint.s.sizeKey]) || 0) }]
              : []),
          ]}
        />
      )}

      {series.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-4 px-2">
          {series.map((s, si) => (
            <span key={`${s.key}-${s.yKey}`} className="inline-flex items-center gap-1.5 text-xs text-muted">
              <span className="size-2.5 rounded-full" style={{ background: seriesColor(si, s.color) }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
