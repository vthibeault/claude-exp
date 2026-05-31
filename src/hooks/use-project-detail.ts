'use client';

import { useQueries } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { ProjectSchema } from '@/lib/schemas/project';
import { NetworkHeaderSchema } from '@/lib/schemas/network';
import { CostItemSchema } from '@/lib/schemas/cost';
import { mapProject, mapActivity, mapMilestone, mapCostLine } from '@/lib/utils/mappers';
import type { Project, Activity, Milestone, CostLine } from '@/lib/types/domain';
import type { ValidatedNetworkHeader } from '@/lib/schemas/network';

async function fetchProject(id: string) {
  const res = await fetch(
    `/api/sap/API_PROJECT_V2/Project?$filter=ProjectInternalID eq '${encodeURIComponent(id)}'&$expand=to_WBSElement,to_WBSElement/to_WBSElement`
  );
  if (!res.ok) throw new Error('Failed to fetch project');
  const data = await res.json();
  const results = data.d?.results ?? [];
  if (!results.length) throw new Error('Project not found');
  return ProjectSchema.parse(results[0]);
}

async function fetchNetworks(projectId: string) {
  const res = await fetch(
    `/api/sap/API_PROJECT_NETWORK_SRV/NetworkHeader?$filter=ProjectInternalID eq '${encodeURIComponent(projectId)}'&$expand=to_NetworkActivity,to_NetworkActivity/to_ActivityRelationship,to_NetworkActivity/to_Milestone`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.d?.results ?? []).map((n: unknown) => NetworkHeaderSchema.parse(n));
}

async function fetchCosts(projectId: string) {
  const res = await fetch(
    `/api/sap/PS_PROJECT_SRV/CostItem?$filter=ProjectInternalID eq '${encodeURIComponent(projectId)}'`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.d?.results ?? []).map((c: unknown) => CostItemSchema.parse(c));
}

export interface ProjectDetailResult {
  project: Project | undefined;
  activities: Activity[];
  milestones: Milestone[];
  costLines: CostLine[];
  isLoading: boolean;
  isError: boolean;
}

export function useProjectDetail(id: string): ProjectDetailResult {
  const [projectQuery, networksQuery, costsQuery] = useQueries({
    queries: [
      {
        queryKey: queryKeys.projects.detail(id),
        queryFn: () => fetchProject(id),
        staleTime: 2 * 60 * 1000,
      },
      {
        queryKey: queryKeys.projects.networks(id),
        queryFn: () => fetchNetworks(id),
        staleTime: 2 * 60 * 1000,
      },
      {
        queryKey: queryKeys.projects.costs(id),
        queryFn: () => fetchCosts(id),
        staleTime: 5 * 60 * 1000,
      },
    ],
  });

  const networks: ValidatedNetworkHeader[] = networksQuery.data ?? [];
  const activities = networks.flatMap((n: ValidatedNetworkHeader) =>
    n.to_NetworkActivity.map((a) => mapActivity(a))
  );
  const milestones = networks.flatMap((n: ValidatedNetworkHeader) =>
    n.to_NetworkActivity.flatMap((a) => a.to_Milestone.map(mapMilestone))
  );
  const costLines = (costsQuery.data ?? []).map(mapCostLine);

  const project = projectQuery.data
    ? mapProject(projectQuery.data, networks)
    : undefined;

  return {
    project,
    activities,
    milestones,
    costLines,
    isLoading:
      projectQuery.isLoading ||
      networksQuery.isLoading ||
      costsQuery.isLoading,
    isError:
      projectQuery.isError ||
      networksQuery.isError,
  };
}
