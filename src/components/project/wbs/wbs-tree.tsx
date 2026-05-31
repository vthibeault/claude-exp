'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrencyCompact, formatPct } from '@/lib/utils/format';
import type { WBSElement } from '@/lib/types/domain';

interface WBSRowProps {
  element: WBSElement;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}

function WBSRow({ element, expandedIds, onToggle }: WBSRowProps) {
  const hasChildren = element.children.length > 0;
  const isExpanded = expandedIds.has(element.id);
  const variance = element.variancePct;

  return (
    <>
      <tr className="border-b transition-colors hover:bg-muted/40 group">
        <td
          className="py-2 pr-4 text-sm"
          style={{ paddingLeft: `${element.level * 20 + 8}px` }}
        >
          <div className="flex items-center gap-1.5">
            {hasChildren ? (
              <button
                onClick={() => onToggle(element.id)}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                aria-label={isExpanded ? 'Réduire' : 'Développer'}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <span className="w-4 flex-shrink-0" />
            )}
            <span>
              <span className="font-mono text-xs text-muted-foreground mr-1.5">
                {element.code}
              </span>
              <span className={cn('font-medium', element.level === 1 && 'text-foreground')}>
                {element.description}
              </span>
            </span>
          </div>
        </td>
        <td className="py-2 px-3 text-sm text-right tabular-nums text-muted-foreground">
          {formatCurrencyCompact(element.plannedCost)}
        </td>
        <td className="py-2 px-3 text-sm text-right tabular-nums">
          {formatCurrencyCompact(element.actualCost)}
        </td>
        <td className="py-2 px-3 text-sm text-right tabular-nums">
          {formatCurrencyCompact(element.forecastCost)}
        </td>
        <td className="py-2 pl-3 text-sm text-right tabular-nums">
          <span
            className={cn(
              'font-medium',
              variance > 10 && 'text-red-600 dark:text-red-400',
              variance > 0 && variance <= 10 && 'text-amber-600 dark:text-amber-400',
              variance < 0 && 'text-green-600 dark:text-green-400'
            )}
          >
            {variance > 0 ? '+' : ''}{formatPct(variance, 1)}
          </span>
        </td>
        {element.responsiblePerson && (
          <td className="py-2 pl-3 text-xs text-muted-foreground hidden lg:table-cell">
            {element.responsiblePerson}
          </td>
        )}
      </tr>
      {hasChildren &&
        isExpanded &&
        element.children.map((child) => (
          <WBSRow
            key={child.id}
            element={child}
            expandedIds={expandedIds}
            onToggle={onToggle}
          />
        ))}
    </>
  );
}

interface WBSTreeProps {
  elements: WBSElement[];
}

export function WBSTree({ elements }: WBSTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(elements.map((e) => e.id))
  );

  function toggle(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="rounded-md border overflow-auto">
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Élément WBS
            </th>
            <th className="py-2 px-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Prévu
            </th>
            <th className="py-2 px-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Réel
            </th>
            <th className="py-2 px-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Prévision
            </th>
            <th className="py-2 pl-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Écart
            </th>
            <th className="py-2 pl-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
              Responsable
            </th>
          </tr>
        </thead>
        <tbody>
          {elements.map((el) => (
            <WBSRow
              key={el.id}
              element={el}
              expandedIds={expandedIds}
              onToggle={toggle}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
