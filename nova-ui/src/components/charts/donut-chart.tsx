import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { defaultFormat, seriesColor } from "./chart-utils";

export interface DonutSlice {
  label: string;
  value: number;
  color?: string;
}

export interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  /** Content rendered in the donut hole; defaults to the total. */
  center?: ReactNode;
  showLegend?: boolean;
  format?: (v: number) => string;
  className?: string;
}

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${x0},${y0}A${r},${r},0,${large},1,${x1},${y1}`;
}

/** Dependency-free SVG donut chart with hoverable slices and legend. */
export function DonutChart({
  data,
  size = 200,
  thickness = 24,
  center,
  showLegend = true,
  format = defaultFormat,
  className,
}: DonutChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((sum, d) => sum + Math.max(0, d.value), 0);
  const r = (size - thickness) / 2;
  const c = size / 2;

  let angle = -Math.PI / 2;
  const gap = data.length > 1 ? 0.02 : 0;

  return (
    <div className={cn("flex flex-wrap items-center gap-6", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label={`Donut chart, total ${format(total)}`}>
          {data.map((d, i) => {
            const frac = total > 0 ? Math.max(0, d.value) / total : 0;
            const a0 = angle + gap;
            const a1 = angle + frac * Math.PI * 2 - gap;
            angle += frac * Math.PI * 2;
            if (frac === 0) return null;
            return (
              <path
                key={d.label}
                d={arcPath(c, c, r, a0, Math.max(a0 + 0.001, a1))}
                fill="none"
                stroke={seriesColor(i, d.color)}
                strokeWidth={hover === i ? thickness + 4 : thickness}
                strokeLinecap="round"
                opacity={hover === null || hover === i ? 1 : 0.35}
                className="cursor-pointer transition-[stroke-width,opacity] duration-150"
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {hover !== null && data[hover] ? (
            <>
              <span className="text-lg font-semibold">{format(data[hover].value)}</span>
              <span className="max-w-[60%] truncate text-xs text-muted">{data[hover].label}</span>
            </>
          ) : (
            (center ?? (
              <>
                <span className="text-lg font-semibold">{format(total)}</span>
                <span className="text-xs text-muted">Total</span>
              </>
            ))
          )}
        </div>
      </div>

      {showLegend && (
        <ul className="flex flex-col gap-1.5">
          {data.map((d, i) => (
            <li
              key={d.label}
              className="flex cursor-default items-center gap-2 text-sm"
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
            >
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: seriesColor(i, d.color) }} />
              <span className="text-muted">{d.label}</span>
              <span className="ml-auto pl-4 font-medium tabular-nums">{format(d.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
