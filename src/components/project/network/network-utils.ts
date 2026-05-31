// Critical path method: forward/backward pass.
// Returns a Set of activity IDs that are on the critical path (float === 0).

import type { NetworkNode, NetworkEdge } from '@/lib/types/domain';

export interface CPMResult {
  criticalIds: Set<string>;
  earlyStart: Map<string, number>;
  earlyFinish: Map<string, number>;
  lateStart: Map<string, number>;
  lateFinish: Map<string, number>;
  totalFloat: Map<string, number>;
}

export function computeCriticalPath(
  nodes: NetworkNode[],
  edges: NetworkEdge[]
): CPMResult {
  const ids = nodes.map((n) => n.id);
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Build successor/predecessor maps
  const successors = new Map<string, string[]>();
  const predecessors = new Map<string, string[]>();
  for (const id of ids) {
    successors.set(id, []);
    predecessors.set(id, []);
  }
  for (const e of edges) {
    successors.get(e.sourceId)?.push(e.targetId);
    predecessors.get(e.targetId)?.push(e.sourceId);
  }

  // Topological sort (Kahn's algorithm)
  const inDegree = new Map<string, number>();
  for (const id of ids) inDegree.set(id, predecessors.get(id)?.length ?? 0);
  const queue: string[] = ids.filter((id) => (inDegree.get(id) ?? 0) === 0);
  const topoOrder: string[] = [];
  while (queue.length) {
    const cur = queue.shift()!;
    topoOrder.push(cur);
    for (const succ of successors.get(cur) ?? []) {
      inDegree.set(succ, (inDegree.get(succ) ?? 1) - 1);
      if (inDegree.get(succ) === 0) queue.push(succ);
    }
  }

  // Forward pass
  const es = new Map<string, number>();
  const ef = new Map<string, number>();
  for (const id of topoOrder) {
    const node = nodeMap.get(id)!;
    const maxPredEF =
      predecessors.get(id)?.reduce((max, pid) => Math.max(max, ef.get(pid) ?? 0), 0) ?? 0;
    es.set(id, maxPredEF);
    ef.set(id, maxPredEF + node.duration);
  }

  // Project end = max EF
  const projectEnd = Math.max(...ids.map((id) => ef.get(id) ?? 0));

  // Backward pass
  const ls = new Map<string, number>();
  const lf = new Map<string, number>();
  for (const id of [...topoOrder].reverse()) {
    const node = nodeMap.get(id)!;
    const succs = successors.get(id) ?? [];
    const minSuccLS =
      succs.length > 0
        ? succs.reduce((min, sid) => Math.min(min, ls.get(sid) ?? Infinity), Infinity)
        : projectEnd;
    lf.set(id, minSuccLS);
    ls.set(id, minSuccLS - node.duration);
  }

  // Float
  const totalFloat = new Map<string, number>();
  for (const id of ids) {
    totalFloat.set(id, (ls.get(id) ?? 0) - (es.get(id) ?? 0));
  }

  const criticalIds = new Set(
    ids.filter((id) => (totalFloat.get(id) ?? 1) <= 0)
  );

  return { criticalIds, earlyStart: es, earlyFinish: ef, lateStart: ls, lateFinish: lf, totalFloat };
}
