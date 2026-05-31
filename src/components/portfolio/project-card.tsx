'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, TrendingUp, Flag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RAGBadge } from './rag-badge';
import { formatCurrencyCompact, clampPct } from '@/lib/utils/format';
import type { Project } from '@/lib/types/domain';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const pct = clampPct(project.budgetConsumedPct);
  const isOverBudget = project.budgetConsumedPct > 100;

  const msText =
    project.nextMilestoneDaysAway !== null
      ? project.nextMilestoneDaysAway < 0
        ? `Retard de ${Math.abs(project.nextMilestoneDaysAway)} j`
        : project.nextMilestoneDaysAway === 0
        ? "Aujourd'hui"
        : `dans ${project.nextMilestoneDaysAway} j`
      : null;

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 h-full">
        <CardContent className="p-5 flex flex-col gap-3 h-full">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-mono text-xs text-muted-foreground">{project.code}</p>
              <h3 className="font-semibold text-sm leading-snug mt-0.5 group-hover:text-primary transition-colors line-clamp-2">
                {project.description}
              </h3>
            </div>
            <div className="flex-shrink-0">
              <RAGBadge status={project.ragStatus} size="sm" showLabel={false} />
            </div>
          </div>

          <RAGBadge status={project.ragStatus} size="sm" />

          {/* Budget bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Budget consommé
              </span>
              <span
                className={cn(
                  'font-medium',
                  isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-foreground'
                )}
              >
                {pct.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={Math.min(pct, 100)}
              className={cn(
                'h-2',
                isOverBudget
                  ? '[&>div]:bg-red-500'
                  : pct > 85
                  ? '[&>div]:bg-amber-500'
                  : '[&>div]:bg-primary'
              )}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrencyCompact(project.actualCost, project.currency)}</span>
              <span>/ {formatCurrencyCompact(project.plannedCost, project.currency)}</span>
            </div>
          </div>

          <div className="border-t pt-3 mt-auto space-y-1.5">
            {/* Schedule */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span>
                {format(project.startDate, 'd MMM', { locale: fr })} →{' '}
                {format(project.endDate, 'd MMM yyyy', { locale: fr })}
              </span>
            </div>

            {/* Next milestone */}
            {msText && project.nextMilestoneDescription && (
              <div className="flex items-center gap-1.5 text-xs">
                <Flag
                  className={cn(
                    'h-3 w-3 flex-shrink-0',
                    (project.nextMilestoneDaysAway ?? 0) < 0
                      ? 'text-red-500'
                      : (project.nextMilestoneDaysAway ?? 99) <= 14
                      ? 'text-amber-500'
                      : 'text-muted-foreground'
                  )}
                />
                <span className="truncate text-muted-foreground">
                  {project.nextMilestoneDescription}
                </span>
                <span
                  className={cn(
                    'flex-shrink-0 font-medium',
                    (project.nextMilestoneDaysAway ?? 0) < 0
                      ? 'text-red-600'
                      : (project.nextMilestoneDaysAway ?? 99) <= 14
                      ? 'text-amber-600'
                      : 'text-muted-foreground'
                  )}
                >
                  {msText}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
