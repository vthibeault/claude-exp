import { NODE_WIDTH, NODE_HEIGHT } from './use-network-layout';
import type { NetworkEdge } from '@/lib/types/domain';
import type { NetworkLayout } from '@/lib/types/domain';

interface NetworkEdgesProps {
  edges: NetworkEdge[];
  layout: NetworkLayout;
  criticalIds: Set<string>;
  selectedId: string | null;
}

export function NetworkEdges({ edges, layout, criticalIds, selectedId }: NetworkEdgesProps) {
  return (
    <g>
      <defs>
        <marker
          id="net-arrow-normal"
          markerWidth="7"
          markerHeight="7"
          refX="6"
          refY="3.5"
          orient="auto"
        >
          <path d="M 0 0 L 7 3.5 L 0 7 Z" fill="#94a3b8" />
        </marker>
        <marker
          id="net-arrow-critical"
          markerWidth="7"
          markerHeight="7"
          refX="6"
          refY="3.5"
          orient="auto"
        >
          <path d="M 0 0 L 7 3.5 L 0 7 Z" fill="#ef4444" />
        </marker>
        <marker
          id="net-arrow-selected"
          markerWidth="7"
          markerHeight="7"
          refX="6"
          refY="3.5"
          orient="auto"
        >
          <path d="M 0 0 L 7 3.5 L 0 7 Z" fill="#3b82f6" />
        </marker>
      </defs>

      {edges.map((edge) => {
        const srcPos = layout.nodes.get(edge.sourceId);
        const tgtPos = layout.nodes.get(edge.targetId);
        if (!srcPos || !tgtPos) return null;

        const x1 = srcPos.x + NODE_WIDTH;
        const y1 = srcPos.y + NODE_HEIGHT / 2;
        const x2 = tgtPos.x - 4;
        const y2 = tgtPos.y + NODE_HEIGHT / 2;
        const mx = (x1 + x2) / 2;

        const isCritical = criticalIds.has(edge.sourceId) && criticalIds.has(edge.targetId);
        const isSelected =
          selectedId === edge.sourceId || selectedId === edge.targetId;

        const strokeColor = isCritical
          ? '#ef4444'
          : isSelected
          ? '#3b82f6'
          : '#94a3b8';

        const markerId = isCritical
          ? 'url(#net-arrow-critical)'
          : isSelected
          ? 'url(#net-arrow-selected)'
          : 'url(#net-arrow-normal)';

        return (
          <path
            key={edge.id}
            d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
            stroke={strokeColor}
            strokeWidth={isCritical ? 2 : 1.5}
            fill="none"
            markerEnd={markerId}
            opacity={isSelected || isCritical ? 1 : 0.6}
          />
        );
      })}
    </g>
  );
}
