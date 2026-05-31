'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { ProjectGrid } from '@/components/portfolio/project-grid';
import { PortfolioFilters } from '@/components/portfolio/portfolio-filters';
import type { ProjectFilters } from '@/lib/query-keys';

export default function PortfolioPage() {
  const [filters, setFilters] = useState<ProjectFilters>({});

  return (
    <AppShell>
      <div className="px-6 py-6 space-y-5 max-w-screen-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Portefeuille de projets</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Vue d&apos;ensemble de tous les projets SAP PS actifs
          </p>
        </div>
        <PortfolioFilters filters={filters} onChange={setFilters} />
        <ProjectGrid filters={filters} />
      </div>
    </AppShell>
  );
}
