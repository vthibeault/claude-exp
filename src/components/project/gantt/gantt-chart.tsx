'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { GanttHeader } from './gantt-header';
import { GanttGrid } from './gantt-grid';
import { GanttBar } from './gantt-bar';
import { GanttLinks } from './gantt-link';
import { GanttToolbar } from './gantt-toolbar';
import { useGantt } from './use-gantt';
import { useGanttDrag } from './use-gantt-drag';
import { flattenVisibleRows } from '@/lib/utils/gantt-adapter';
import {
  HEADER_H,
  LABEL_WIDTH,
  ROW_HEIGHT,
  dateToX,
} from './gantt-utils';
import type { GanttRow, GanttLink } from '@/lib/types/domain';

interface GanttChartProps {
  rows: GanttRow[];
  links: GanttLink[];
}

export function GanttChart({ rows, links }: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgScrollRef = useRef<HTMLDivElement>(null);
  const labelScrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(900);

  const { state, zoom, toggleRow, select, fit } = useGantt(rows);
  const { startDrag } = useGanttDrag(state.viewport);

  // Observe container width changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fit on first load
  useEffect(() => {
    if (rows.length && containerWidth > 0) {
      fit(rows, containerWidth);
    }
  }, [rows.length, containerWidth]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync vertical scroll between label pane and SVG pane
  useEffect(() => {
    const svgEl = svgScrollRef.current;
    const labelEl = labelScrollRef.current;
    if (!svgEl || !labelEl) return;

    function onSvgScroll() {
      if (labelEl) labelEl.scrollTop = svgEl!.scrollTop;
    }
    function onLabelScroll() {
      if (svgEl) svgEl.scrollTop = labelEl!.scrollTop;
    }

    svgEl.addEventListener('scroll', onSvgScroll);
    labelEl.addEventListener('scroll', onLabelScroll);
    return () => {
      svgEl.removeEventListener('scroll', onSvgScroll);
      labelEl.removeEventListener('scroll', onLabelScroll);
    };
  }, []);

  function jumpToToday() {
    const todayX = dateToX(new Date(), state.viewport);
    if (svgScrollRef.current) {
      svgScrollRef.current.scrollLeft = Math.max(0, todayX - 200);
    }
  }

  // Apply expand/collapse state to rows
  const rowsWithExpand = rows.map((r) => ({
    ...r,
    isExpanded: state.expandedIds.has(r.id),
  }));
  const visibleRows = flattenVisibleRows(rowsWithExpand);

  const totalSvgWidth = Math.max(
    containerWidth - LABEL_WIDTH,
    visibleRows.reduce((max, r) => {
      const endX = dateToX(r.end, state.viewport);
      const baseEndX = dateToX(r.baselineEnd, state.viewport);
      return Math.max(max, endX, baseEndX);
    }, 0) + 40
  );

  const totalHeight = visibleRows.length * ROW_HEIGHT;
  const rowIndexMap = new Map(visibleRows.map((r, i) => [r.id, i]));

  return (
    <div className="flex flex-col gap-2" ref={containerRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {visibleRows.length} tâche{visibleRows.length !== 1 ? 's' : ''} visibles
        </div>
        <GanttToolbar
          pxPerDay={state.viewport.pxPerDay}
          onZoom={zoom}
          onFit={() => fit(rows, containerWidth)}
          onJumpToday={jumpToToday}
        />
      </div>

      {/* Main chart area */}
      <div className="flex border rounded-lg overflow-hidden bg-background">
        {/* Left: label pane */}
        <div
          className="flex-shrink-0 border-r bg-muted/20"
          style={{ width: LABEL_WIDTH }}
        >
          {/* Label header */}
          <div
            className="flex items-center px-3 border-b bg-muted/40 text-xs font-medium text-muted-foreground uppercase tracking-wide"
            style={{ height: HEADER_H }}
          >
            Tâche
          </div>
          {/* Label rows — scrolled by JS in sync with SVG */}
          <div
            ref={labelScrollRef}
            className="overflow-y-auto overflow-x-hidden"
            style={{ maxHeight: Math.min(totalHeight, 520) }}
          >
            {visibleRows.map((row) => {
              const hasChildren = rows.some((r) => r.parentId === row.id);
              const isExpanded = state.expandedIds.has(row.id);

              return (
                <div
                  key={row.id}
                  className={cn(
                    'flex items-center gap-1 px-2 text-xs border-b transition-colors cursor-pointer',
                    state.selectedId === row.id
                      ? 'bg-primary/10'
                      : 'hover:bg-muted/60'
                  )}
                  style={{ height: ROW_HEIGHT, paddingLeft: 8 + row.level * 14 }}
                  onClick={() =>
                    select(state.selectedId === row.id ? null : row.id)
                  }
                >
                  {hasChildren ? (
                    <button
                      className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRow(row.id);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                  ) : (
                    <span className="w-3.5 flex-shrink-0" />
                  )}
                  <span className="truncate">{row.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: SVG timeline */}
        <div
          ref={svgScrollRef}
          className="flex-1 overflow-auto gantt-scroll"
          style={{ maxHeight: Math.min(totalHeight + HEADER_H, 520 + HEADER_H) }}
        >
          <div style={{ width: totalSvgWidth, position: 'relative' }}>
            {/* Sticky header */}
            <div className="sticky top-0 z-10 bg-background border-b">
              <GanttHeader viewport={state.viewport} totalWidth={totalSvgWidth} />
            </div>

            {/* Task SVG */}
            <svg
              width={totalSvgWidth}
              height={totalHeight}
              className="overflow-visible"
            >
              <GanttGrid
                viewport={state.viewport}
                totalWidth={totalSvgWidth}
                rowCount={visibleRows.length}
              />
              <GanttLinks
                links={links}
                rows={visibleRows}
                rowIndexMap={rowIndexMap}
                viewport={state.viewport}
              />
              {visibleRows.map((row, i) => (
                <GanttBar
                  key={row.id}
                  row={row}
                  rowIndex={i}
                  viewport={state.viewport}
                  isSelected={state.selectedId === row.id}
                  onSelect={() =>
                    select(state.selectedId === row.id ? null : row.id)
                  }
                  onDragMove={(e) => startDrag(e, row, 'move')}
                  onDragLeft={(e) => startDrag(e, row, 'resize-left')}
                  onDragRight={(e) => startDrag(e, row, 'resize-right')}
                />
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-6 rounded bg-slate-400/50 inline-block" />
          Référence (prévu)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-4 w-6 rounded bg-blue-400 inline-block" />
          En cours
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-4 w-6 rounded bg-red-400 inline-block" />
          En retard
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block"
            style={{
              width: 10,
              height: 10,
              background: '#f59e0b',
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            }}
          />
          Jalon
        </span>
      </div>
    </div>
  );
}
