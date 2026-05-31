import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { NODE_WIDTH, NODE_HEIGHT } from './use-network-layout';
import type { NetworkNode } from '@/lib/types/domain';

interface NetworkNodeProps {
  node: NetworkNode;
  x: number;
  y: number;
  isCritical: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  onClick: () => void;
}

export function NetworkNodeComponent({
  node,
  x,
  y,
  isCritical,
  isSelected,
  isHighlighted,
  isDimmed,
  onClick,
}: NetworkNodeProps) {
  const isComplete = node.completionPct >= 100;
  const borderColor = isCritical
    ? '#ef4444'
    : isSelected || isHighlighted
    ? '#3b82f6'
    : '#e2e8f0';

  const bgColor = isComplete ? '#f0fdf4' : isCritical ? '#fef2f2' : '#ffffff';

  return (
    <foreignObject
      x={x}
      y={y}
      width={NODE_WIDTH}
      height={NODE_HEIGHT}
      className="cursor-pointer"
      onClick={onClick}
      style={{ opacity: isDimmed ? 0.35 : 1 }}
    >
      {/* biome-ignore lint: nested p tag is fine here for SVG foreignObject */}
      <div
        style={{
          border: `${isSelected ? 2 : 1.5}px solid ${borderColor}`,
          background: bgColor,
          borderRadius: 8,
          padding: '8px 10px',
          height: NODE_HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          boxShadow: isSelected
            ? '0 0 0 3px rgba(59,130,246,0.3)'
            : '0 1px 3px rgba(0,0,0,0.08)',
          transition: 'all 0.15s',
          overflow: 'hidden',
        }}
      >
        {/* Activity number */}
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: 10,
            color: isCritical ? '#ef4444' : '#94a3b8',
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          {node.activityNumber}
          {isCritical && (
            <span
              style={{
                marginLeft: 4,
                background: '#ef4444',
                color: 'white',
                borderRadius: 3,
                padding: '0 4px',
                fontSize: 9,
              }}
            >
              CRITIQUE
            </span>
          )}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#1e293b',
            lineHeight: 1.3,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {node.description}
        </div>

        {/* Dates + duration row */}
        <div
          style={{
            fontSize: 10,
            color: '#64748b',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            marginTop: 'auto',
          }}
        >
          <span>
            {format(node.earliestStart, 'd MMM', { locale: fr })} →{' '}
            {format(node.earliestEnd, 'd MMM', { locale: fr })}
          </span>
          <span style={{ background: '#f1f5f9', borderRadius: 3, padding: '1px 4px' }}>
            {node.duration}j
          </span>
          {node.completionPct > 0 && (
            <span
              style={{
                background: isComplete ? '#dcfce7' : '#dbeafe',
                color: isComplete ? '#166534' : '#1e40af',
                borderRadius: 3,
                padding: '1px 4px',
              }}
            >
              {node.completionPct}%
            </span>
          )}
        </div>
      </div>
    </foreignObject>
  );
}
