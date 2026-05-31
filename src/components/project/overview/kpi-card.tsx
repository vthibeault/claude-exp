import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'warning' | 'danger' | 'success';
}

export function KpiCard({
  label,
  value,
  subValue,
  icon,
  trend,
  variant = 'default',
}: KpiCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4 bg-card',
        variant === 'danger' && 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20',
        variant === 'warning' && 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20',
        variant === 'success' && 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        {icon && (
          <span
            className={cn(
              'text-muted-foreground',
              variant === 'danger' && 'text-red-500',
              variant === 'warning' && 'text-amber-500',
              variant === 'success' && 'text-green-500'
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p
        className={cn(
          'mt-2 text-2xl font-bold',
          variant === 'danger' && 'text-red-700 dark:text-red-400',
          variant === 'warning' && 'text-amber-700 dark:text-amber-400',
          variant === 'success' && 'text-green-700 dark:text-green-400'
        )}
      >
        {value}
      </p>
      {subValue && (
        <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
      )}
    </div>
  );
}
