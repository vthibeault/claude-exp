import {
  addDays,
  differenceInCalendarDays,
  startOfDay,
  eachMonthOfInterval,
} from 'date-fns';
import { dateToX, ROW_HEIGHT, HEADER_H } from './gantt-utils';
import type { Viewport } from './gantt-utils';

interface GanttGridProps {
  viewport: Viewport;
  totalWidth: number;
  rowCount: number;
}

export function GanttGrid({ viewport, totalWidth, rowCount }: GanttGridProps) {
  const totalHeight = rowCount * ROW_HEIGHT;
  const today = startOfDay(new Date());
  const todayX = dateToX(today, viewport);
  const endDate = addDays(viewport.startDate, Math.ceil(totalWidth / viewport.pxPerDay));

  // Month separators
  const monthStarts = eachMonthOfInterval({ start: viewport.startDate, end: endDate });

  // Weekend bands
  const weekendRects: { x: number; width: number }[] = [];
  if (viewport.pxPerDay >= 5) {
    const totalDays = differenceInCalendarDays(endDate, viewport.startDate);
    for (let i = 0; i < totalDays; i++) {
      const d = addDays(viewport.startDate, i);
      const day = d.getDay();
      if (day === 6 || day === 0) {
        weekendRects.push({
          x: i * viewport.pxPerDay,
          width: viewport.pxPerDay,
        });
      }
    }
  }

  return (
    <g>
      {/* Weekend shading */}
      {weekendRects.map((r, i) => (
        <rect
          key={i}
          x={r.x}
          y={0}
          width={r.width}
          height={totalHeight}
          className="fill-muted/30"
        />
      ))}

      {/* Month grid lines */}
      {monthStarts.map((ms, i) => {
        const x = dateToX(ms, viewport);
        return (
          <line
            key={i}
            x1={x}
            y1={0}
            x2={x}
            y2={totalHeight}
            className="stroke-border/60"
            strokeDasharray="2 4"
          />
        );
      })}

      {/* Row dividers */}
      {Array.from({ length: rowCount }).map((_, i) => (
        <line
          key={`row-${i}`}
          x1={0}
          y1={(i + 1) * ROW_HEIGHT}
          x2={totalWidth}
          y2={(i + 1) * ROW_HEIGHT}
          className="stroke-border/40"
        />
      ))}

      {/* Today line */}
      {todayX >= 0 && todayX <= totalWidth && (
        <g>
          <line
            x1={todayX}
            y1={0}
            x2={todayX}
            y2={totalHeight}
            stroke="#3b82f6"
            strokeWidth={1.5}
          />
          <text
            x={todayX + 3}
            y={10}
            fontSize={9}
            fill="#3b82f6"
            fontWeight={600}
          >
            Aujourd&apos;hui
          </text>
        </g>
      )}
    </g>
  );
}
