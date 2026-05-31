import { computeHeaderTicks, HEADER_YEAR_H, HEADER_MONTH_H, HEADER_H } from './gantt-utils';
import type { Viewport } from './gantt-utils';

interface GanttHeaderProps {
  viewport: Viewport;
  totalWidth: number;
}

export function GanttHeader({ viewport, totalWidth }: GanttHeaderProps) {
  const { months, years, weeks } = computeHeaderTicks(viewport, totalWidth);

  return (
    <svg
      width={totalWidth}
      height={HEADER_H}
      className="overflow-visible select-none"
    >
      {/* Year row */}
      {years.map((y) => (
        <g key={`year-${y.label}-${y.x}`}>
          <rect
            x={y.x}
            y={0}
            width={y.width}
            height={HEADER_YEAR_H}
            className="fill-muted/60"
          />
          <line
            x1={y.x}
            y1={0}
            x2={y.x}
            y2={HEADER_YEAR_H}
            className="stroke-border"
          />
          {y.width > 30 && (
            <text
              x={y.x + y.width / 2}
              y={HEADER_YEAR_H / 2 + 4}
              textAnchor="middle"
              fontSize={11}
              fontWeight={600}
              className="fill-foreground font-mono"
            >
              {y.label}
            </text>
          )}
        </g>
      ))}

      {/* Month row */}
      {months.map((m) => (
        <g key={`month-${m.label}-${m.x}`}>
          <rect
            x={m.x}
            y={HEADER_YEAR_H}
            width={m.width}
            height={HEADER_MONTH_H}
            className="fill-muted/30"
          />
          <line
            x1={m.x}
            y1={HEADER_YEAR_H}
            x2={m.x}
            y2={HEADER_H}
            className="stroke-border"
          />
          {m.width > 24 && (
            <text
              x={m.x + m.width / 2}
              y={HEADER_YEAR_H + HEADER_MONTH_H / 2 + 4}
              textAnchor="middle"
              fontSize={11}
              className="fill-muted-foreground capitalize"
            >
              {m.label}
            </text>
          )}
        </g>
      ))}

      {/* Bottom border */}
      <line
        x1={0}
        y1={HEADER_H}
        x2={totalWidth}
        y2={HEADER_H}
        className="stroke-border"
      />
    </svg>
  );
}
