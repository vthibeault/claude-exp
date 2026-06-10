import { useId, useMemo, useState, type PointerEvent } from "react";
import { cn } from "@/lib/cn";
import { useMeasure } from "@/lib/use-measure";
import { useInView } from "@/lib/use-in-view";
import {
  defaultFormat,
  linearPath,
  niceTicks,
  scaleLinear,
  seriesColor,
  smoothPath,
} from "./chart-utils";

export interface ChartSeries<T> {
  key: keyof T & string;
  label?: string;
  color?: string;
}

export interface LineChartProps<T extends Record<string, unknown>> {
  data: T[];
  x: keyof T & string;
  series: Array<ChartSeries<T>>;
  height?: number;
  area?: boolean;
  smooth?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  formatY?: (v: number) => string;
  animate?: boolean;
  className?: string;
}

const PAD = { top: 12, right: 12, bottom: 26, left: 44 };

export function LineChart<T extends Record<string, unknown>>({
  data,
  x,
  series,
  height = 260,
  area = false,
  smooth = true,
  showGrid = true,
  showLegend = true,
  formatY = defaultFormat,
  animate = true,
  className,
}: LineChartProps<T>) {
  const { ref, width } = useMeasure<HTMLDivElement>();
  const inView = useInView(ref);
  const clipId = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);

  const values = useMemo(
    () => data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0)),
    [data, series],
  );
  const yMin = Math.min(0, ...values);
  const yMax = Math.max(...values, 1);
  const ticks = niceTicks(yMin, yMax);

  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = height - PAD.top - PAD.bottom;
  const sx = scaleLinear(0, Math.max(1, data.length - 1), PAD.left, PAD.left + innerW);
  const sy = scaleLinear(ticks[0], ticks[ticks.length - 1], PAD.top + innerH, PAD.top);

  const toPath = smooth ? smoothPath : linearPath;

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (data.length === 0 || innerW === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const idx = Math.round(((px - PAD.left) / innerW) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, idx)));
  };

  const xLabelEvery = Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(innerW / 64))));
  const revealed = !animate || inView;

  return (
    <div ref={ref} className={cn("w-full", className)}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`Line chart with ${series.length} series and ${data.length} points`}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <clipPath id={clipId}>
              <rect
                x={PAD.left - 4}
                y={0}
                height={height}
                width={revealed ? innerW + 20 : 0}
                style={{
                  transition: revealed
                    ? "width 900ms cubic-bezier(0.16,1,0.3,1) 80ms"
                    : "none",
                }}
              />
            </clipPath>
          </defs>

          {showGrid &&
            ticks.map((t) => (
              <g key={t}>
                <line
                  x1={PAD.left}
                  x2={PAD.left + innerW}
                  y1={sy(t)}
                  y2={sy(t)}
                  stroke="var(--nova-border)"
                  strokeDasharray={t === 0 ? undefined : "3 3"}
                />
                <text
                  x={PAD.left - 8}
                  y={sy(t)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-subtle text-[10px]"
                >
                  {formatY(t)}
                </text>
              </g>
            ))}

          {data.map((d, i) =>
            i % xLabelEvery === 0 ? (
              <text
                key={i}
                x={sx(i)}
                y={height - 8}
                textAnchor="middle"
                className="fill-subtle text-[10px]"
              >
                {String(d[x])}
              </text>
            ) : null,
          )}

          <g clipPath={`url(#${clipId})`}>
            {series.map((s, si) => {
              const pts = data.map((d, i) => [sx(i), sy(Number(d[s.key]) || 0)] as [number, number]);
              const color = seriesColor(si, s.color);
              const line = toPath(pts);
              return (
                <g key={s.key}>
                  {area && pts.length > 1 && (
                    <path
                      d={`${line}L${pts[pts.length - 1][0]},${sy(ticks[0])}L${pts[0][0]},${sy(ticks[0])}Z`}
                      fill={color}
                      opacity={0.12}
                    />
                  )}
                  <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
                  {hover !== null && (
                    <circle
                      cx={pts[hover][0]}
                      cy={pts[hover][1]}
                      r={4}
                      fill={color}
                      stroke="var(--nova-surface)"
                      strokeWidth={2}
                    />
                  )}
                </g>
              );
            })}
          </g>

          {hover !== null && (
            <line
              x1={sx(hover)}
              x2={sx(hover)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              stroke="var(--nova-border-strong)"
            />
          )}
        </svg>
      )}

      {hover !== null && data[hover] && (
        <ChartTooltip
          xLeft={width > 0 ? sx(hover) : 0}
          width={width}
          label={String(data[hover][x])}
          rows={series.map((s, si) => ({
            color: seriesColor(si, s.color),
            label: s.label ?? s.key,
            value: formatY(Number(data[hover][s.key]) || 0),
          }))}
        />
      )}

      {showLegend && series.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-4 px-2">
          {series.map((s, si) => (
            <span key={s.key} className="inline-flex items-center gap-1.5 text-xs text-muted">
              <span className="size-2.5 rounded-full" style={{ background: seriesColor(si, s.color) }} />
              {s.label ?? s.key}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function ChartTooltip({
  xLeft,
  width,
  label,
  rows,
}: {
  xLeft: number;
  width: number;
  label: string;
  rows: Array<{ color: string; label: string; value: string }>;
}) {
  const flip = xLeft > width * 0.6;
  return (
    <div className="relative h-0">
      <div
        className="pointer-events-none absolute bottom-10 z-10 w-max rounded-nova border bg-surface px-3 py-2 text-xs shadow-nova-lg"
        style={flip ? { right: width - xLeft + 8 } : { left: xLeft + 8 }}
      >
        <p className="mb-1 font-medium text-foreground">{label}</p>
        {rows.map((r) => (
          <p key={r.label} className="flex items-center gap-1.5 text-muted">
            <span className="size-2 rounded-full" style={{ background: r.color }} />
            {r.label}: <span className="font-medium text-foreground">{r.value}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
