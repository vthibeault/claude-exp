import { useId } from "react";
import { cn } from "@/lib/cn";
import { useInView } from "@/lib/use-in-view";
import { linearPath, scaleLinear, smoothPath } from "./chart-utils";

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  area?: boolean;
  smooth?: boolean;
  animate?: boolean;
  className?: string;
}

export function Sparkline({
  data,
  width = 96,
  height = 28,
  color = "var(--nova-chart-1)",
  area = true,
  smooth = true,
  animate = true,
  className,
}: SparklineProps) {
  const { ref, inView } = useInView<SVGSVGElement>();
  const clipId = useId().replace(/:/g, "");

  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const sx = scaleLinear(0, data.length - 1, 2, width - 2);
  const sy = scaleLinear(min, max === min ? min + 1 : max, height - 2, 2);
  const pts = data.map((v, i) => [sx(i), sy(v)] as [number, number]);
  const line = (smooth ? smoothPath : linearPath)(pts);
  const revealed = !animate || inView;

  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <rect
            x={0}
            y={0}
            height={height}
            width={revealed ? width : 0}
            style={{
              transition: revealed ? "width 700ms cubic-bezier(0.16,1,0.3,1) 50ms" : "none",
            }}
          />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {area && (
          <path
            d={`${line}L${pts[pts.length - 1][0]},${height}L${pts[0][0]},${height}Z`}
            fill={color}
            opacity={0.15}
          />
        )}
        <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2} fill={color} />
      </g>
    </svg>
  );
}
