'use client';

import { useMemo } from 'react';
import { GanttChart } from './gantt-chart';
import { buildGanttData } from '@/lib/utils/gantt-adapter';
import type { WBSElement, Activity } from '@/lib/types/domain';

interface GanttTabProps {
  wbsElements: WBSElement[];
  activities: Activity[];
}

export function GanttTab({ wbsElements, activities }: GanttTabProps) {
  const { rows, links } = useMemo(
    () => buildGanttData(wbsElements, activities),
    [wbsElements, activities]
  );

  if (!rows.length) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        Aucune donnée de planification disponible
      </div>
    );
  }

  return <GanttChart rows={rows} links={links} />;
}
