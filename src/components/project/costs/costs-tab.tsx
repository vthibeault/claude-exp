'use client';

import { CostTable } from './cost-table';
import { CostVarianceChart } from './cost-variance-chart';
import type { CostLine } from '@/lib/types/domain';

interface CostsTabProps {
  costLines: CostLine[];
}

export function CostsTab({ costLines }: CostsTabProps) {
  if (!costLines.length) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        Aucune donnée de coûts disponible
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Détail des coûts par élément WBS</h3>
        <CostTable costLines={costLines} />
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-3">Comparaison Prévu vs Prévision par WBS</h3>
        <CostVarianceChart costLines={costLines} />
      </div>
    </div>
  );
}
