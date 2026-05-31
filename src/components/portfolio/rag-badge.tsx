import { cn } from '@/lib/utils';
import { ragColor, ragLabel } from '@/lib/utils/rag';
import type { RAGStatus } from '@/lib/types/domain';

interface RAGBadgeProps {
  status: RAGStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function RAGBadge({ status, showLabel = true, size = 'md' }: RAGBadgeProps) {
  const color = ragColor(status);
  const label = ragLabel(status);

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          'rounded-full flex-shrink-0',
          size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5'
        )}
        style={{ backgroundColor: color }}
        aria-label={label}
      />
      {showLabel && (
        <span
          className={cn(
            'font-medium',
            size === 'sm' ? 'text-xs' : 'text-sm',
            status === 'red' && 'text-red-600 dark:text-red-400',
            status === 'amber' && 'text-amber-600 dark:text-amber-400',
            status === 'green' && 'text-green-600 dark:text-green-400',
            status === 'unknown' && 'text-slate-500'
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}
