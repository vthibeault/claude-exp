import { useState } from "react";
import { cn } from "@/lib/cn";
import { useMeasure } from "@/lib/use-measure";
import { useInView } from "@/lib/use-in-view";
import { defaultFormat, seriesColor } from "./chart-utils";

export interface FunnelSlice {
  label: string;
  value: number;
  color?: string;
}

export interface FunnelChartProps {
  data: FunnelSlice[];
  height?: number;
  showValues?: boolean;
  showPercent?: boolean;
  formatValue?: (v: number) => string;
  animate?: boolean;
  className?: string;
}

const GAP = 4;

export function FunnelChart({
  data,
  height = 300,
  showValues = true,
  showPercent = true,
  formatValue = defaultFormat,
  animate = true,
  className,
}: FunnelChartProps) {
  const { ref, width } = useMeasure<HTMLDivElement>();
  const inView = useInView(ref);
  const [hover, setHover] = useState<number | null>(null);

  if (data.length === 0) {
    return <div ref={ref} className={cn("w-full", className)} />;
  }

  const maxValue = data[0].value;
  const sliceH = data.length > 0 ? (height - GAP * (data.length - 1)) / data.length : 0;
  const revealed = !animate || inView;

  const slices = data.map((slice, i) => {
    const topRatio = i === 0 ? 1 : data[i].value / maxValue;
    const botRatio = i < data.length - 1 ? data[i + 1].value / maxValue : data[i].value / maxValue;
    const topW = Math.max(4, topRatio * width);
    const botW = Math.max(4, botRatio * width);
    const topX = (width - topW) / 2;
    const botX = (width - botW) / 2;
    const y = i * (sliceH + GAP);
    const points = [
      `${topX},${y}`,
      `${topX + topW},${y}`,
      `${botX + botW},${y + sliceH}`,
      `${botX},${y + sliceH}`,
    ].join(" ");
    const color = seriesColor(i, slice.color);
    const pct = maxValue > 0 ? (slice.value / maxValue) * 100 : 0;
    const midY = y + sliceH / 2;
    const midX = width / 2;
    const sliceWidth = (topW + botW) / 2;
    return { points, color, pct, midX, midY, sliceWidth, topW, botW };
  });

  return (
    <div ref={ref} className={cn("w-full", className)}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`Funnel chart with ${data.length} stages`}
        >
          {slices.map((sl, i) => {
            const slice = data[i];
            const isHovered = hover === i;
            const labelInside = sl.sliceWidth > 120;
            const delay = i * 60;

            return (
              <g
                key={i}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                style={{
                  opacity: revealed ? 1 : 0,
                  transform: revealed ? "translateY(0)" : "translateY(16px)",
                  transition: revealed
                    ? `opacity 400ms ease ${delay}ms, transform 500ms cubic-bezier(0.34,1.56,0.64,1) ${delay}ms`
                    : "none",
                }}
              >
                <polygon
                  points={sl.points}
                  fill={sl.color}
                  opacity={isHovered ? 1 : 0.82}
                  className="transition-opacity duration-100"
                />

                <text
                  x={sl.midX}
                  y={sl.midY - (showValues || showPercent ? 7 : 0)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white text-[11px] font-medium pointer-events-none"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
                >
                  {slice.label}
                </text>

                {(showValues || showPercent) && labelInside && (
                  <text
                    x={sl.midX}
                    y={sl.midY + 9}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-white text-[10px] pointer-events-none"
                    style={{ opacity: 0.88 }}
                  >
                    {showValues && formatValue(slice.value)}
                    {showValues && showPercent && " · "}
                    {showPercent && `${sl.pct.toFixed(1)}%`}
                  </text>
                )}

                {(showValues || showPercent) && !labelInside && (
                  <text
                    x={width / 2 + sl.sliceWidth / 2 + 8}
                    y={sl.midY}
                    textAnchor="start"
                    dominantBaseline="middle"
                    className="fill-subtle text-[10px] pointer-events-none"
                  >
                    {showValues && formatValue(slice.value)}
                    {showValues && showPercent && " "}
                    {showPercent && `(${sl.pct.toFixed(1)}%)`}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
