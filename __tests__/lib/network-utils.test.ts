import { describe, it, expect } from 'vitest';
import { computeCriticalPath } from '@/components/project/network/network-utils';
import type { NetworkNode, NetworkEdge } from '@/lib/types/domain';

function makeNode(id: string, duration: number): NetworkNode {
  return {
    id,
    activityNumber: id,
    description: `Activity ${id}`,
    workCenter: 'WC',
    duration,
    earliestStart: new Date('2025-01-01'),
    earliestEnd: new Date('2025-01-10'),
    latestStart: new Date('2025-01-01'),
    latestEnd: new Date('2025-01-10'),
    completionPct: 0,
    float: 0,
  };
}

function makeEdge(source: string, target: string): NetworkEdge {
  return { id: `${source}->${target}`, sourceId: source, targetId: target, type: 'FS' };
}

describe('computeCriticalPath', () => {
  it('identifies all nodes critical in a simple chain', () => {
    // A(2) -> B(3) -> C(1)  — all on critical path
    const nodes = [makeNode('A', 2), makeNode('B', 3), makeNode('C', 1)];
    const edges = [makeEdge('A', 'B'), makeEdge('B', 'C')];

    const { criticalIds, totalFloat } = computeCriticalPath(nodes, edges);

    expect(criticalIds.has('A')).toBe(true);
    expect(criticalIds.has('B')).toBe(true);
    expect(criticalIds.has('C')).toBe(true);
    expect(totalFloat.get('A')).toBe(0);
    expect(totalFloat.get('B')).toBe(0);
    expect(totalFloat.get('C')).toBe(0);
  });

  it('identifies non-critical path with float > 0', () => {
    // A(5) -> C(1)  ← critical path (6 days)
    // B(1) -> C(1)  ← B starts at 0 independently, EF=1, float=4
    const nodes = [makeNode('A', 5), makeNode('B', 1), makeNode('C', 1)];
    const edges = [makeEdge('A', 'C'), makeEdge('B', 'C')];

    const { criticalIds, totalFloat } = computeCriticalPath(nodes, edges);

    expect(criticalIds.has('A')).toBe(true);
    expect(criticalIds.has('C')).toBe(true);
    expect(criticalIds.has('B')).toBe(false);
    expect((totalFloat.get('B') ?? 0) > 0).toBe(true);
  });

  it('handles empty inputs gracefully', () => {
    const result = computeCriticalPath([], []);
    expect(result.criticalIds.size).toBe(0);
  });

  it('handles a single node with no edges', () => {
    const { criticalIds } = computeCriticalPath([makeNode('A', 3)], []);
    expect(criticalIds.has('A')).toBe(true);
  });
});
