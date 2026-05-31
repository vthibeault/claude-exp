'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DollarSign, Calendar, Flag, Activity } from 'lucide-react';
import { KpiCard } from './kpi-card';
import { RAGBadge } from '@/components/portfolio/rag-badge';
import { formatCurrencyCompact, formatPct } from '@/lib/utils/format';
import type { Project, Activity as DomainActivity, Milestone } from '@/lib/types/domain';

interface OverviewTabProps {
  project: Project;
  activities: DomainActivity[];
  milestones: Milestone[];
}

export function OverviewTab({ project, activities, milestones }: OverviewTabProps) {
  const completedActivities = activities.filter((a) => a.completionPct >= 100).length;
  const overdueMilestones = milestones.filter((m) => !m.isComplete && m.daysAway < 0);

  const budgetVariant =
    project.budgetConsumedPct > 110
      ? 'danger'
      : project.budgetConsumedPct > 90
      ? 'warning'
      : 'default';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <RAGBadge status={project.ragStatus} />
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Budget consommé"
          value={formatPct(project.budgetConsumedPct)}
          subValue={`${formatCurrencyCompact(project.actualCost)} / ${formatCurrencyCompact(project.plannedCost, project.currency)}`}
          icon={<DollarSign className="h-4 w-4" />}
          variant={budgetVariant}
        />
        <KpiCard
          label="Activités terminées"
          value={`${completedActivities} / ${activities.length}`}
          subValue={
            activities.length > 0
              ? `${((completedActivities / activities.length) * 100).toFixed(0)}% complété`
              : undefined
          }
          icon={<Activity className="h-4 w-4" />}
          variant={
            activities.length > 0 && completedActivities === activities.length
              ? 'success'
              : 'default'
          }
        />
        <KpiCard
          label="Fin prévue"
          value={format(project.endDate, 'd MMM yyyy', { locale: fr })}
          subValue={`Début: ${format(project.startDate, 'd MMM yyyy', { locale: fr })}`}
          icon={<Calendar className="h-4 w-4" />}
        />
        <KpiCard
          label="Jalons en retard"
          value={String(overdueMilestones.length)}
          subValue={`${milestones.filter((m) => m.isComplete).length} / ${milestones.length} complétés`}
          icon={<Flag className="h-4 w-4" />}
          variant={overdueMilestones.length > 0 ? 'danger' : milestones.every((m) => m.isComplete) ? 'success' : 'default'}
        />
      </div>

      {/* Milestones list */}
      {milestones.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Jalons</h3>
          <div className="space-y-2">
            {milestones
              .sort((a, b) => a.plannedDate.getTime() - b.plannedDate.getTime())
              .map((ms) => (
                <div
                  key={ms.id}
                  className="flex items-center justify-between gap-4 rounded-md border p-3 text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`h-2 w-2 rounded-full flex-shrink-0 ${
                        ms.isComplete
                          ? 'bg-green-500'
                          : ms.daysAway < 0
                          ? 'bg-red-500'
                          : ms.daysAway <= 14
                          ? 'bg-amber-500'
                          : 'bg-slate-300'
                      }`}
                    />
                    <span className="truncate font-medium">{ms.description}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 text-xs text-muted-foreground">
                    <span>{format(ms.plannedDate, 'd MMM yyyy', { locale: fr })}</span>
                    {ms.isComplete ? (
                      <span className="text-green-600 font-medium">Complété</span>
                    ) : ms.daysAway < 0 ? (
                      <span className="text-red-600 font-medium">
                        {Math.abs(ms.daysAway)} j de retard
                      </span>
                    ) : (
                      <span>dans {ms.daysAway} j</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
