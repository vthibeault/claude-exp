import { startOfDay, isAfter } from 'date-fns';
import {
  dateToX,
  ROW_HEIGHT,
  BAR_HEIGHT,
  BAR_Y_OFFSET,
  BASELINE_HEIGHT,
} from './gantt-utils';
import type { Viewport } from './gantt-utils';
import type { GanttRow } from '@/lib/types/domain';

const HANDLE_W = 8;

interface GanttBarProps {
  row: GanttRow;
  rowIndex: number;
  viewport: Viewport;
  isSelected: boolean;
  onSelect: () => void;
  onDragMove: (e: React.MouseEvent) => void;
  onDragLeft: (e: React.MouseEvent) => void;
  onDragRight: (e: React.MouseEvent) => void;
}

export function GanttBar({
  row,
  rowIndex,
  viewport,
  isSelected,
  onSelect,
  onDragMove,
  onDragLeft,
  onDragRight,
}: GanttBarProps) {
  const y = rowIndex * ROW_HEIGHT;
  const barY = y + BAR_Y_OFFSET;

  const barX = dateToX(row.start, viewport);
  const barEndX = dateToX(row.end, viewport);
  const barW = Math.max(viewport.pxPerDay, barEndX - barX);

  const baseX = dateToX(row.baselineStart, viewport);
  const baseEndX = dateToX(row.baselineEnd, viewport);
  const baseW = Math.max(viewport.pxPerDay, baseEndX - baseX);

  const today = startOfDay(new Date());
  const isOverdue =
    row.type !== 'milestone' &&
    row.progress < 1 &&
    isAfter(today, row.end);

  // Colour logic
  const trackColor =
    row.type === 'wbs'
      ? '#bfdbfe' // blue-200
      : isOverdue
      ? '#fecaca' // red-200
      : '#93c5fd'; // blue-300

  const fillColor =
    row.type === 'wbs'
      ? '#3b82f6' // blue-500
      : isOverdue
      ? '#ef4444' // red-500
      : '#2563eb'; // blue-600

  const selectedStroke = isSelected ? '#1d4ed8' : 'transparent';

  if (row.type === 'milestone') {
    const cx = dateToX(row.start, viewport);
    const cy = y + ROW_HEIGHT / 2;
    const r = 8;
    const milestoneColor =
      row.progress >= 1 ? '#22c55e' : isOverdue ? '#ef4444' : '#f59e0b';

    return (
      <g onClick={onSelect} className="cursor-pointer">
        <polygon
          points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`}
          fill={milestoneColor}
          stroke={isSelected ? '#1d4ed8' : milestoneColor}
          strokeWidth={isSelected ? 2 : 0}
          opacity={0.9}
        />
      </g>
    );
  }

  const progressW = barW * Math.min(1, Math.max(0, row.progress));
  const showLabel = barW > 60;

  return (
    <g>
      {/* Baseline bar (thin, grey) */}
      <rect
        x={baseX}
        y={barY + BAR_HEIGHT / 2 - BASELINE_HEIGHT / 2}
        width={baseW}
        height={BASELINE_HEIGHT}
        rx={2}
        fill="#94a3b8"
        opacity={0.5}
      />

      {/* Track */}
      <rect
        x={barX}
        y={barY}
        width={barW}
        height={BAR_HEIGHT}
        rx={4}
        fill={trackColor}
        stroke={selectedStroke}
        strokeWidth={1.5}
        className="cursor-pointer"
        onClick={onSelect}
      />

      {/* Progress fill */}
      {progressW > 0 && (
        <rect
          x={barX}
          y={barY}
          width={progressW}
          height={BAR_HEIGHT}
          rx={4}
          fill={fillColor}
          className="pointer-events-none"
        />
      )}

      {/* Overrun indicator (current end > baseline end) */}
      {isAfter(row.end, row.baselineEnd) && (
        <rect
          x={baseEndX}
          y={barY + 6}
          width={barEndX - baseEndX}
          height={BAR_HEIGHT - 12}
          fill="#ef4444"
          opacity={0.6}
          className="pointer-events-none"
        />
      )}

      {/* Label inside bar */}
      {showLabel && (
        <text
          x={barX + 6}
          y={barY + BAR_HEIGHT / 2 + 4}
          fontSize={10}
          fill="white"
          className="pointer-events-none select-none"
        >
          {row.label.length > 30
            ? row.label.substring(0, 28) + '…'
            : row.label}
        </text>
      )}

      {/* Left resize handle */}
      <rect
        x={barX - HANDLE_W / 2}
        y={barY + 2}
        width={HANDLE_W}
        height={BAR_HEIGHT - 4}
        fill="transparent"
        className="cursor-ew-resize"
        onMouseDown={onDragLeft}
      />

      {/* Right resize handle */}
      <rect
        x={barX + barW - HANDLE_W / 2}
        y={barY + 2}
        width={HANDLE_W}
        height={BAR_HEIGHT - 4}
        fill="transparent"
        className="cursor-ew-resize"
        onMouseDown={onDragRight}
      />

      {/* Move handle (centre) */}
      <rect
        x={barX + HANDLE_W}
        y={barY}
        width={Math.max(0, barW - HANDLE_W * 2)}
        height={BAR_HEIGHT}
        fill="transparent"
        className="cursor-grab active:cursor-grabbing"
        onMouseDown={onDragMove}
      />
    </g>
  );
}
