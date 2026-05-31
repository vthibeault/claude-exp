'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { ProjectTabs } from '@/components/project/project-tabs';
import { RAGBadge } from '@/components/portfolio/rag-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjectDetail } from '@/hooks/use-project-detail';
import { formatCurrencyCompact } from '@/lib/utils/format';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { project, activities, milestones, costLines, isLoading, isError } =
    useProjectDetail(params.id);

  return (
    <AppShell>
      <div className="px-6 py-6 space-y-5 max-w-screen-2xl mx-auto">
        {/* Breadcrumb */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Portefeuille
          </Link>
        </div>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-96 w-full" />
          </div>
        )}

        {isError && (
          <div className="text-destructive">
            Erreur lors du chargement du projet.
          </div>
        )}

        {project && (
          <>
            {/* Project header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm text-muted-foreground">
                    {project.code}
                  </span>
                  <RAGBadge status={project.ragStatus} size="sm" />
                </div>
                <h1 className="text-2xl font-bold">{project.description}</h1>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                  <span>
                    {format(project.startDate, 'd MMM yyyy', { locale: fr })} →{' '}
                    {format(project.endDate, 'd MMM yyyy', { locale: fr })}
                  </span>
                  <span>
                    Budget:{' '}
                    {formatCurrencyCompact(project.plannedCost, project.currency)}
                  </span>
                  <span>CC: {project.responsibleCostCenter}</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <ProjectTabs
              project={project}
              activities={activities}
              milestones={milestones}
              costLines={costLines}
            />
          </>
        )}
      </div>
    </AppShell>
  );
}
