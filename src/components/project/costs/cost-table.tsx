'use client';

import { formatCurrencyCompact, formatPct } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import type { CostLine } from '@/lib/types/domain';

interface CostTableProps {
  costLines: CostLine[];
}

export function CostTable({ costLines }: CostTableProps) {
  const totals = costLines.reduce(
    (acc, c) => ({
      planned: acc.planned + c.planned,
      actual: acc.actual + c.actual,
      commitment: acc.commitment + c.commitment,
      forecast: acc.forecast + c.forecast,
      variance: acc.variance + c.variance,
    }),
    { planned: 0, actual: 0, commitment: 0, forecast: 0, variance: 0 }
  );

  const totalVariancePct =
    totals.planned > 0 ? (totals.variance / totals.planned) * 100 : 0;

  return (
    <div className="rounded-md border overflow-auto">
      <table className="w-full min-w-[750px] text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Élément WBS
            </th>
            <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Élément de coût
            </th>
            <th className="py-2 px-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Prévu
            </th>
            <th className="py-2 px-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Réel
            </th>
            <th className="py-2 px-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Engagement
            </th>
            <th className="py-2 px-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Prévision
            </th>
            <th className="py-2 pl-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Écart%
            </th>
          </tr>
        </thead>
        <tbody>
          {costLines.map((line, i) => (
            <tr key={i} className="border-b transition-colors hover:bg-muted/40">
              <td className="py-2 px-3 font-mono text-xs text-muted-foreground">
                {line.wbsElementId}
              </td>
              <td className="py-2 px-3 text-muted-foreground">{line.costElementName}</td>
              <td className="py-2 px-3 text-right tabular-nums">
                {formatCurrencyCompact(line.planned)}
              </td>
              <td className="py-2 px-3 text-right tabular-nums">
                {formatCurrencyCompact(line.actual)}
              </td>
              <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">
                {formatCurrencyCompact(line.commitment)}
              </td>
              <td className="py-2 px-3 text-right tabular-nums font-medium">
                {formatCurrencyCompact(line.forecast)}
              </td>
              <td className="py-2 pl-3 text-right tabular-nums">
                <span
                  className={cn(
                    'font-medium',
                    line.variancePct < -10 && 'text-red-600 dark:text-red-400',
                    line.variancePct < 0 && line.variancePct >= -10 && 'text-amber-600 dark:text-amber-400',
                    line.variancePct >= 0 && 'text-green-600 dark:text-green-400'
                  )}
                >
                  {line.variancePct > 0 ? '+' : ''}{formatPct(line.variancePct, 1)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 bg-muted/30 font-semibold">
            <td className="py-2 px-3" colSpan={2}>Total</td>
            <td className="py-2 px-3 text-right tabular-nums">{formatCurrencyCompact(totals.planned)}</td>
            <td className="py-2 px-3 text-right tabular-nums">{formatCurrencyCompact(totals.actual)}</td>
            <td className="py-2 px-3 text-right tabular-nums">{formatCurrencyCompact(totals.commitment)}</td>
            <td className="py-2 px-3 text-right tabular-nums">{formatCurrencyCompact(totals.forecast)}</td>
            <td className="py-2 pl-3 text-right tabular-nums">
              <span
                className={cn(
                  totalVariancePct < -10 && 'text-red-600',
                  totalVariancePct < 0 && totalVariancePct >= -10 && 'text-amber-600',
                  totalVariancePct >= 0 && 'text-green-600'
                )}
              >
                {totalVariancePct > 0 ? '+' : ''}{formatPct(totalVariancePct, 1)}
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
