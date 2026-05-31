import { dateToX, ROW_HEIGHT, BAR_Y_OFFSET, BAR_HEIGHT } from './gantt-utils';
import type { GanttRow, GanttLink as GanttLinkType } from '@/lib/types/domain';
import type { Viewport } from './gantt-utils';

interface GanttLinksProps {
  links: GanttLinkType[];
  rows: GanttRow[];
  rowIndexMap: Map<string, number>;
  viewport: Viewport;
}

export function GanttLinks({ links, rows, rowIndexMap, viewport }: GanttLinksProps) {
  return (
    <g>
      <defs>
        <marker
          id="gantt-arrowhead"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M 0 0 L 6 3 L 0 6 Z" fill="#94a3b8" />
        </marker>
      </defs>
      {links.map((link) => {
        const srcIdx = rowIndexMap.get(link.sourceId);
        const tgtIdx = rowIndexMap.get(link.targetId);
        const srcRow = rows.find((r) => r.id === link.sourceId);
        const tgtRow = rows.find((r) => r.id === link.targetId);
        if (srcIdx === undefined || tgtIdx === undefined || !srcRow || !tgtRow)
          return null;

        const x1 = dateToX(srcRow.end, viewport);
        const y1 = srcIdx * ROW_HEIGHT + BAR_Y_OFFSET + BAR_HEIGHT / 2;
        const x2 = dateToX(tgtRow.start, viewport) - 4;
        const y2 = tgtIdx * ROW_HEIGHT + BAR_Y_OFFSET + BAR_HEIGHT / 2;

        const mx = (x1 + x2) / 2;

        return (
          <path
            key={link.id}
            d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
            stroke="#94a3b8"
            strokeWidth={1.5}
            fill="none"
            markerEnd="url(#gantt-arrowhead)"
            opacity={0.7}
          />
        );
      })}
    </g>
  );
}
