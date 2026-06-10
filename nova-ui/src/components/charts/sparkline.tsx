import { cn } from "@/lib/cn";
import { linearPath, scaleLinear, smoothPath } from "./chart-utils";

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  area?: boolean;
  smooth?: boolean;
  className?: string;
}

/** Inline mini-chart for table cells and KPI cards. */
export function Sparkline({
  data,
  width = 96,
  height = 28,
  color = "var(--nova-chart-1)",
  area = true,
  smooth = true,
  className,
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const sx = scaleLinear(0, data.length - 1, 2, width - 2);
  const sy = scaleLinear(min, max === min ? min + 1 : max, height - 2, 2);
  const pts = data.map((v, i) => [sx(i), sy(v)] as [number, number]);
  const line = (smooth ? smoothPath : linearPath)(pts);

  return (
    <svg width={width} height={height} className={cn("shrink-0", className)} aria-hidden="true">
      {area && (
        <path
          d={`${line}L${pts[pts.length - 1][0]},${height}L${pts[0][0]},${height}Z`}
          fill={color}
          opacity={0.15}
        />
      )}
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2} fill={color} />
    </svg>
  );
}
