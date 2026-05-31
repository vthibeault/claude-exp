'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys, type ProjectFilters } from '@/lib/query-keys';
import { ProjectSchema } from '@/lib/schemas/project';
import { NetworkHeaderSchema } from '@/lib/schemas/network';
import { mapProject } from '@/lib/utils/mappers';
import type { Project } from '@/lib/types/domain';

async function fetchProjects(): Promise<Project[]> {
  const [projectsRes, networksRes] = await Promise.all([
    fetch('/api/sap/API_PROJECT_V2/Project?$expand=to_WBSElement'),
    fetch(
      '/api/sap/API_PROJECT_NETWORK_SRV/NetworkHeader?$expand=to_NetworkActivity,to_NetworkActivity/to_Milestone'
    ),
  ]);

  if (!projectsRes.ok) throw new Error('Failed to fetch projects');

  const projectsData = await projectsRes.json();
  const networksData = networksRes.ok ? await networksRes.json() : { d: { results: [] } };

  const rawProjects = projectsData.d?.results ?? [];
  const rawNetworks = networksData.d?.results ?? [];

  return rawProjects.map((raw: unknown) => {
    const parsed = ProjectSchema.parse(raw);
    const networks = rawNetworks
      .filter((n: { ProjectInternalID: string }) => n.ProjectInternalID === parsed.ProjectInternalID)
      .map((n: unknown) => NetworkHeaderSchema.parse(n));
    return mapProject(parsed, networks);
  });
}

export function useProjects(filters: ProjectFilters = {}) {
  return useQuery({
    queryKey: queryKeys.projects.list(filters),
    queryFn: fetchProjects,
    select: (projects) => {
      let result = projects;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(
          (p) =>
            p.description.toLowerCase().includes(q) ||
            p.code.toLowerCase().includes(q)
        );
      }
      if (filters.status) {
        result = result.filter((p) => p.status === filters.status);
      }
      return result;
    },
  });
}
