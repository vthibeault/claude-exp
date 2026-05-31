'use client';

import { useProjects } from '@/hooks/use-projects';
import type { ProjectFilters } from '@/lib/query-keys';
import { ProjectCard } from './project-card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, FolderOpen } from 'lucide-react';

interface ProjectGridProps {
  filters?: ProjectFilters;
}

function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-2 w-full mt-2" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function ProjectGrid({ filters = {} }: ProjectGridProps) {
  const { data: projects, isLoading, isError, error } = useProjects(filters);

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-3" />
        <p className="font-semibold">Impossible de charger les projets</p>
        <p className="text-sm text-muted-foreground mt-1">
          {error instanceof Error ? error.message : 'Erreur inconnue'}
        </p>
      </div>
    );
  }

  if (!projects?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FolderOpen className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="font-semibold">Aucun projet trouvé</p>
        <p className="text-sm text-muted-foreground mt-1">
          Modifiez vos filtres ou vérifiez la connexion SAP
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
