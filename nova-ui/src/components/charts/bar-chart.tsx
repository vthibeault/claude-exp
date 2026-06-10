import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { useMeasure } from "@/lib/use-measure";
import { useInView } from "@/lib/use-in-view";
import { defaultFormat, niceTicks, scaleLinear, seriesColor } from "./chart-utils";
import { ChartTooltip, type ChartSeries } from "./line-chart";

export interface BarChartProps<T extends Record<string, unknown>> {
  data: T[];
  x: keyof T & string;
  series: Array<ChartSeries<T>>;
  height?: number;
  stacked?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  formatY?: (v: number) => string;
  animate?: boolean;
  className?: string;
}

const PAD = { top: 12, right: 12, bottom: 26, left: 44 };

export function BarChart<T extends Record<string, unknown>>({
  data,
  x,
  series,
  height = 260,
  stacked = false,
  showGrid = true,
  showLegend = true,
  formatY = defaultFormat,
  animate = true,
  className,
}: BarChartProps<T>) {
  const { ref: measureRef, width } = useMeasure<HTMLDivElement>();
  const { ref: inViewRef, inView } = useInView<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const maxValue = useMemo(() => {
    if (stacked) {
      return Math.max(...data.map((d) => series.reduce((sum, s) => sum + (Number(d[s.key]) || 0), 0)), 1);
    }
    return Math.max(...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0)), 1);
  }, [data, series, stacked]);

  const ticks = niceTicks(0, maxValue);
  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = height - PAD.top - PAD.bottom;
  const sy = scaleLinear(0, ticks[ticks.length - 1], PAD.top + innerH, PAD.top);

  const slot = data.length > 0 ? innerW / data.length : 0;
  const groupW = slot * 0.7;
  const barW = stacked ? groupW : groupW / Math.max(1, series.length);

  const xLabelEvery = Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(innerW / 64))));
  const revealed = !animate || inView;

  const setRef = (el: HTMLDivElement | null) => {
    (measureRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    (inViewRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  };

  return (
    <div ref={setRef} className={cn("w-full", className)}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`Bar chart with ${series.length} series and ${data.length} categories`}
          onPointerLeave={() => setHover(null)}
        >
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

          {data.map((d, i) => {
            const cx = PAD.left + slot * i + slot / 2;
            let stackY = sy(0);
            const delay = i * 30;
            return (
              <g key={i} onPointerEnter={() => setHover(i)}>
                <rect x={PAD.left + slot * i} y={PAD.top} width={slot} height={innerH} fill="transparent" />
                {series.map((s, si) => {
                  const v = Number(d[s.key]) || 0;
                  const barH = Math.max(0, sy(0) - sy(v));
                  const bx = stacked ? cx - barW / 2 : cx - groupW / 2 + si * barW;
                  const by = stacked ? stackY - barH : sy(v);
                  if (stacked) stackY -= barH;
                  return (
                    <rect
                      key={s.key}
                      x={bx + 1}
                      y={by}
                      width={Math.max(0, barW - 2)}
                      height={barH}
                      rx={3}
                      fill={seriesColor(si, s.color)}
                      opacity={hover === null || hover === i ? 1 : 0.4}
                      style={{
                        transformBox: "fill-box",
                        transformOrigin: "center 100%",
                        transform: revealed ? "scaleY(1)" : "scaleY(0)",
                        transition: revealed
                          ? `transform 500ms cubic-bezier(0.34,1.56,0.64,1) ${delay + si * 20}ms, opacity 150ms ease`
                          : "opacity 150ms ease",
                      }}
                    />
                  );
                })}
                {i % xLabelEvery === 0 && (
                  <text x={cx} y={height - 8} textAnchor="middle" className="fill-subtle text-[10px]">
                    {String(d[x])}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}

      {hover !== null && data[hover] && (
        <ChartTooltip
          xLeft={PAD.left + slot * hover + slot / 2}
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
