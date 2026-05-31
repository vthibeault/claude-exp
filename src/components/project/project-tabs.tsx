'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewTab } from './overview/overview-tab';
import { WBSTree } from './wbs/wbs-tree';
import { GanttTab } from './gantt/gantt-tab';
import { NetworkTab } from './network/network-tab';
import { CostsTab } from './costs/costs-tab';
import type { Project, Activity, Milestone, CostLine } from '@/lib/types/domain';

interface ProjectTabsProps {
  project: Project;
  activities: Activity[];
  milestones: Milestone[];
  costLines: CostLine[];
}

export function ProjectTabs({
  project,
  activities,
  milestones,
  costLines,
}: ProjectTabsProps) {
  return (
    <Tabs defaultValue="overview">
      <TabsList className="mb-4">
        <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
        <TabsTrigger value="wbs">WBS</TabsTrigger>
        <TabsTrigger value="gantt">Gantt</TabsTrigger>
        <TabsTrigger value="network">Réseau</TabsTrigger>
        <TabsTrigger value="costs">Coûts</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <OverviewTab
          project={project}
          activities={activities}
          milestones={milestones}
        />
      </TabsContent>

      <TabsContent value="wbs">
        <WBSTree elements={project.wbsElements} />
      </TabsContent>

      <TabsContent value="gantt">
        <GanttTab wbsElements={project.wbsElements} activities={activities} />
      </TabsContent>

      <TabsContent value="network">
        <NetworkTab activities={activities} />
      </TabsContent>

      <TabsContent value="costs">
        <CostsTab costLines={costLines} />
      </TabsContent>
    </Tabs>
  );
}
