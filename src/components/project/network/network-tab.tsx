'use client';

import { useMemo } from 'react';
import { NetworkGraph } from './network-graph';
import type { Activity } from '@/lib/types/domain';
import type { NetworkNode, NetworkEdge } from '@/lib/types/domain';

interface NetworkTabProps {
  activities: Activity[];
}

export function NetworkTab({ activities }: NetworkTabProps) {
  const { nodes, edges } = useMemo(() => {
    const nodes: NetworkNode[] = activities.map((a) => ({
      id: a.id,
      activityNumber: a.activityNumber,
      description: a.description,
      workCenter: a.workCenter,
      duration: a.duration,
      earliestStart: a.earliestStart,
      earliestEnd: a.earliestEnd,
      latestStart: a.latestStart,
      latestEnd: a.latestEnd,
      completionPct: a.completionPct,
      float: 0, // populated by CPM in network-utils
    }));

    const edges: NetworkEdge[] = activities.flatMap((a) =>
      a.predecessors.map((pred) => ({
        id: pred.sourceId + '->' + pred.targetId,
        sourceId: pred.sourceId,
        targetId: pred.targetId,
        type: pred.type,
      }))
    );

    return { nodes, edges };
  }, [activities]);

  if (!nodes.length) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        Aucune activité réseau disponible
      </div>
    );
  }

  return <NetworkGraph nodes={nodes} edges={edges} />;
}
