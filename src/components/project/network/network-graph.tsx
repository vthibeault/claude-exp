'use client';

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type WheelEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { ZoomIn, ZoomOut, Maximize2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { NetworkNodeComponent } from './network-node';
import { NetworkEdges } from './network-edge';
import { useNetworkLayout, NODE_WIDTH, NODE_HEIGHT } from './use-network-layout';
import { computeCriticalPath } from './network-utils';
import type { NetworkNode, NetworkEdge } from '@/lib/types/domain';

interface NetworkGraphProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

interface Transform {
  tx: number;
  ty: number;
  scale: number;
}

export function NetworkGraph({ nodes, edges }: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({ tx: 20, ty: 20, scale: 1 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const layout = useNetworkLayout(nodes, edges);
  const { criticalIds } = computeCriticalPath(nodes, edges);

  // Highlight chain on selection
  const getHighlightedIds = useCallback(
    (id: string | null): Set<string> => {
      if (!id) return new Set();
      const highlighted = new Set<string>([id]);

      // Walk predecessors
      function walkBack(nodeId: string) {
        for (const e of edges) {
          if (e.targetId === nodeId && !highlighted.has(e.sourceId)) {
            highlighted.add(e.sourceId);
            walkBack(e.sourceId);
          }
        }
      }

      // Walk successors
      function walkForward(nodeId: string) {
        for (const e of edges) {
          if (e.sourceId === nodeId && !highlighted.has(e.targetId)) {
            highlighted.add(e.targetId);
            walkForward(e.targetId);
          }
        }
      }

      walkBack(id);
      walkForward(id);
      return highlighted;
    },
    [edges]
  );

  const highlightedIds = getHighlightedIds(selectedId);

  // Search filtering
  const searchMatches = searchQuery
    ? new Set(
        nodes
          .filter(
            (n) =>
              n.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
              n.activityNumber.includes(searchQuery)
          )
          .map((n) => n.id)
      )
    : null;

  // Fit to view
  function fitToView() {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const padding = 40;
    const scaleX = (width - padding * 2) / (layout.totalWidth || 1);
    const scaleY = (height - padding * 2) / (layout.totalHeight || 1);
    const scale = Math.min(1.5, Math.max(0.2, Math.min(scaleX, scaleY)));
    const tx = (width - layout.totalWidth * scale) / 2;
    const ty = (height - layout.totalHeight * scale) / 2;
    setTransform({ tx, ty, scale });
  }

  useEffect(() => {
    if (nodes.length) fitToView();
  }, [nodes.length, layout.totalWidth]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pan
  function onMouseDown(e: ReactMouseEvent) {
    if (e.button !== 0) return;
    if ((e.target as Element).closest('foreignObject')) return;
    isPanning.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!isPanning.current) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      setTransform((t) => ({ ...t, tx: t.tx + dx, ty: t.ty + dy }));
    }
    function onUp() {
      isPanning.current = false;
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // Zoom on wheel
  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setTransform((t) => {
      const newScale = Math.max(0.2, Math.min(3, t.scale * factor));
      // Zoom around cursor
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const scaleDelta = newScale - t.scale;
      const tx = t.tx - ((cx - t.tx) / t.scale) * scaleDelta;
      const ty = t.ty - ((cy - t.ty) / t.scale) * scaleDelta;
      return { tx, ty, scale: newScale };
    });
  }

  if (!nodes.length) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        Aucune activité réseau disponible
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Rechercher une activité…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 w-52 text-xs"
          />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setTransform((t) => ({ ...t, scale: Math.min(3, t.scale * 1.2) }))}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoomer</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setTransform((t) => ({ ...t, scale: Math.max(0.2, t.scale * 0.8) }))}
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Dézoomer</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={fitToView}>
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ajuster à la fenêtre</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="flex items-center gap-3 ml-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border-2 border-red-500 inline-block" />
            Chemin critique
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border-2 border-blue-500 inline-block" />
            Sélectionné
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950"
        style={{ height: 520, cursor: isPanning.current ? 'grabbing' : 'grab' }}
        onMouseDown={onMouseDown}
        onWheel={onWheel}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          style={{ userSelect: 'none' }}
          onClick={(e) => {
            if ((e.target as Element).tagName === 'svg') setSelectedId(null);
          }}
        >
          <g
            transform={`translate(${transform.tx}, ${transform.ty}) scale(${transform.scale})`}
          >
            {/* Edges first (behind nodes) */}
            <NetworkEdges
              edges={edges}
              layout={layout}
              criticalIds={criticalIds}
              selectedId={selectedId}
            />

            {/* Nodes */}
            {nodes.map((node) => {
              const pos = layout.nodes.get(node.id);
              if (!pos) return null;
              const isSearchDimmed =
                searchMatches !== null && !searchMatches.has(node.id);
              const isChainDimmed =
                selectedId !== null && !highlightedIds.has(node.id);

              return (
                <NetworkNodeComponent
                  key={node.id}
                  node={node}
                  x={pos.x}
                  y={pos.y}
                  isCritical={criticalIds.has(node.id)}
                  isSelected={selectedId === node.id}
                  isHighlighted={highlightedIds.has(node.id) && node.id !== selectedId}
                  isDimmed={isSearchDimmed || isChainDimmed}
                  onClick={() =>
                    setSelectedId((prev) => (prev === node.id ? null : node.id))
                  }
                />
              );
            })}
          </g>
        </svg>
      </div>
      <p className="text-xs text-muted-foreground">
        Cliquez sur un nœud pour mettre en évidence sa chaîne · Molette pour zoomer · Glissez pour naviguer
      </p>
    </div>
  );
}
