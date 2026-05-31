'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { CostLine } from '@/lib/types/domain';
import { formatCurrencyCompact } from '@/lib/utils/format';

interface CostVarianceChartProps {
  costLines: CostLine[];
}

export function CostVarianceChart({ costLines }: CostVarianceChartProps) {
  // Aggregate by WBS element
  const byWbs = new Map<
    string,
    { wbs: string; planned: number; actual: number; forecast: number }
  >();

  for (const line of costLines) {
    const existing = byWbs.get(line.wbsElementId);
    if (existing) {
      existing.planned += line.planned;
      existing.actual += line.actual;
      existing.forecast += line.forecast;
    } else {
      byWbs.set(line.wbsElementId, {
        wbs: line.wbsElementId,
        planned: line.planned,
        actual: line.actual,
        forecast: line.forecast,
      });
    }
  }

  const data = Array.from(byWbs.values()).map((d) => ({
    ...d,
    wbs: d.wbs.split('.').slice(-2).join('.'), // shorten label
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="wbs"
            tick={{ fontSize: 11 }}
            className="text-muted-foreground"
          />
          <YAxis
            tickFormatter={(v: number) => formatCurrencyCompact(v)}
            tick={{ fontSize: 11 }}
            className="text-muted-foreground"
          />
          <Tooltip
            formatter={(value: number) => [formatCurrencyCompact(value)]}
            contentStyle={{
              borderRadius: '6px',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--popover))',
              color: 'hsl(var(--popover-foreground))',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="planned" name="Prévu" fill="hsl(var(--primary))" opacity={0.5} radius={[3, 3, 0, 0]} />
          <Bar dataKey="actual" name="Réel" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
          <Bar dataKey="forecast" name="Prévision" fill="#f59e0b" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
