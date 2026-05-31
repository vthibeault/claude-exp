'use client';

import { useReducer, useCallback } from 'react';
import type { GanttRow } from '@/lib/types/domain';
import { computeFitViewport, type Viewport } from './gantt-utils';

export interface GanttState {
  viewport: Viewport;
  expandedIds: Set<string>;
  selectedId: string | null;
}

type GanttAction =
  | { type: 'ZOOM'; pxPerDay: number }
  | { type: 'TOGGLE_ROW'; id: string }
  | { type: 'SELECT'; id: string | null }
  | { type: 'FIT'; rows: GanttRow[]; containerWidth: number }
  | { type: 'PAN'; deltaDays: number }
  | { type: 'MOVE_BAR'; id: string; newStart: Date; newEnd: Date };

function reducer(state: GanttState, action: GanttAction): GanttState {
  switch (action.type) {
    case 'ZOOM':
      return {
        ...state,
        viewport: { ...state.viewport, pxPerDay: action.pxPerDay },
      };

    case 'TOGGLE_ROW': {
      const next = new Set(state.expandedIds);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return { ...state, expandedIds: next };
    }

    case 'SELECT':
      return { ...state, selectedId: action.id };

    case 'FIT': {
      const viewport = computeFitViewport(action.rows, action.containerWidth);
      return { ...state, viewport };
    }

    case 'PAN': {
      const { startDate, pxPerDay } = state.viewport;
      const newStart = new Date(startDate);
      newStart.setDate(newStart.getDate() + action.deltaDays);
      return { ...state, viewport: { pxPerDay, startDate: newStart } };
    }

    case 'MOVE_BAR':
      // In read-only MVP this is a no-op but wired for future SAP write-back
      return state;

    default:
      return state;
  }
}

export function useGantt(initialRows: GanttRow[] = []) {
  const [state, dispatch] = useReducer(reducer, {
    viewport: computeFitViewport(initialRows, 900),
    expandedIds: new Set(
      initialRows.filter((r) => r.isExpanded).map((r) => r.id)
    ),
    selectedId: null,
  });

  const zoom = useCallback(
    (pxPerDay: number) => dispatch({ type: 'ZOOM', pxPerDay }),
    []
  );
  const toggleRow = useCallback(
    (id: string) => dispatch({ type: 'TOGGLE_ROW', id }),
    []
  );
  const select = useCallback(
    (id: string | null) => dispatch({ type: 'SELECT', id }),
    []
  );
  const fit = useCallback(
    (rows: GanttRow[], containerWidth: number) =>
      dispatch({ type: 'FIT', rows, containerWidth }),
    []
  );
  const pan = useCallback(
    (deltaDays: number) => dispatch({ type: 'PAN', deltaDays }),
    []
  );

  return { state, zoom, toggleRow, select, fit, pan };
}
