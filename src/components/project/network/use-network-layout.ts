'use client';

import { useMemo } from 'react';
import type { NetworkNode, NetworkEdge, NetworkLayout } from '@/lib/types/domain';

export const NODE_WIDTH = 190;
export const NODE_HEIGHT = 88;
export const COL_GAP = 100;
export const ROW_GAP = 30;

export function useNetworkLayout(
  nodes: NetworkNode[],
  edges: NetworkEdge[]
): NetworkLayout {
  return useMemo(() => computeLayout(nodes, edges), [nodes, edges]);
}

function computeLayout(nodes: NetworkNode[], edges: NetworkEdge[]): NetworkLayout {
  if (!nodes.length) {
    return { nodes: new Map(), totalWidth: 0, totalHeight: 0 };
  }

  const ids = nodes.map((n) => n.id);
  const successors = new Map<string, string[]>();
  const predecessors = new Map<string, string[]>();
  for (const id of ids) {
    successors.set(id, []);
    predecessors.set(id, []);
  }
  for (const e of edges) {
    if (successors.has(e.sourceId)) successors.get(e.sourceId)!.push(e.targetId);
    if (predecessors.has(e.targetId)) predecessors.get(e.targetId)!.push(e.sourceId);
  }

  // Kahn's BFS — assign column (level) to each node
  const column = new Map<string, number>();
  const inDegree = new Map<string, number>(
    ids.map((id) => [id, predecessors.get(id)?.length ?? 0])
  );
  const queue: string[] = ids.filter((id) => (inDegree.get(id) ?? 0) === 0);

  let maxCol = 0;
  while (queue.length) {
    const cur = queue.shift()!;
    const col = column.get(cur) ?? 0;
    maxCol = Math.max(maxCol, col);
    for (const succ of successors.get(cur) ?? []) {
      const newCol = col + 1;
      if ((column.get(succ) ?? -1) < newCol) column.set(succ, newCol);
      inDegree.set(succ, (inDegree.get(succ) ?? 1) - 1);
      if ((inDegree.get(succ) ?? 0) <= 0) queue.push(succ);
    }
  }

  // Handle any nodes not assigned (cycles / disconnected)
  for (const id of ids) {
    if (!column.has(id)) column.set(id, 0);
  }

  // Group by column, sort by earliestStart within each column
  const byCol = new Map<number, NetworkNode[]>();
  for (const node of nodes) {
    const col = column.get(node.id) ?? 0;
    if (!byCol.has(col)) byCol.set(col, []);
    byCol.get(col)!.push(node);
  }

  for (const [, colNodes] of byCol) {
    colNodes.sort((a, b) => a.earliestStart.getTime() - b.earliestStart.getTime());
  }

  // Assign x/y positions
  const positions = new Map<string, { x: number; y: number; width: number; height: number }>();

  for (const [col, colNodes] of Array.from(byCol.entries()).sort(([a], [b]) => a - b)) {
    const x = col * (NODE_WIDTH + COL_GAP);
    for (let row = 0; row < colNodes.length; row++) {
      const y = row * (NODE_HEIGHT + ROW_GAP);
      positions.set(colNodes[row].id, { x, y, width: NODE_WIDTH, height: NODE_HEIGHT });
    }
  }

  const allPositions = Array.from(positions.values());
  const totalWidth = allPositions.reduce((max, p) => Math.max(max, p.x + p.width), 0) + COL_GAP;
  const totalHeight = allPositions.reduce((max, p) => Math.max(max, p.y + p.height), 0) + ROW_GAP;

  return { nodes: positions, totalWidth, totalHeight };
}
