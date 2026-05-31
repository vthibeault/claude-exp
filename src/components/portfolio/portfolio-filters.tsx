'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ProjectFilters } from '@/lib/query-keys';

interface PortfolioFiltersProps {
  filters: ProjectFilters;
  onChange: (filters: ProjectFilters) => void;
}

export function PortfolioFilters({ filters, onChange }: PortfolioFiltersProps) {
  const hasFilters = filters.search || filters.status;

  function clearFilters() {
    onChange({});
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Rechercher un projet…"
          value={filters.search ?? ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
          className="pl-9"
        />
      </div>

      <Select
        value={filters.status ?? 'all'}
        onValueChange={(v) =>
          onChange({ ...filters, status: v === 'all' ? undefined : v })
        }
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="I">En cours</SelectItem>
          <SelectItem value="E">Terminé</SelectItem>
          <SelectItem value="H">En attente</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
