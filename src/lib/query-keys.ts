export interface ProjectFilters {
  status?: string;
  pm?: string;
  search?: string;
}

export const queryKeys = {
  projects: {
    all: ['projects'] as const,
    list: (filters: ProjectFilters) => ['projects', 'list', filters] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
    wbs: (id: string) => ['projects', id, 'wbs'] as const,
    networks: (id: string) => ['projects', id, 'networks'] as const,
    costs: (id: string) => ['projects', id, 'costs'] as const,
    milestones: (id: string) => ['projects', id, 'milestones'] as const,
  },
} as const;
