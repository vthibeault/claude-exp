'use client';

import { useRef, useCallback } from 'react';
import type { GanttRow } from '@/lib/types/domain';
import { xToDate, snapToDay, type Viewport } from './gantt-utils';

type DragMode = 'move' | 'resize-left' | 'resize-right';

interface DragState {
  mode: DragMode;
  rowId: string;
  startX: number;
  originalStart: Date;
  originalEnd: Date;
}

export function useGanttDrag(
  viewport: Viewport,
  onUpdate?: (id: string, newStart: Date, newEnd: Date) => void
) {
  const dragRef = useRef<DragState | null>(null);
  const previewRef = useRef<Map<string, { start: Date; end: Date }>>(new Map());

  const startDrag = useCallback(
    (
      e: React.MouseEvent,
      row: GanttRow,
      mode: DragMode
    ) => {
      e.preventDefault();
      e.stopPropagation();

      dragRef.current = {
        mode,
        rowId: row.id,
        startX: e.clientX,
        originalStart: new Date(row.start),
        originalEnd: new Date(row.end),
      };

      function onMove(ev: MouseEvent) {
        if (!dragRef.current) return;
        const { mode, rowId, startX, originalStart, originalEnd } = dragRef.current;
        const deltaX = ev.clientX - startX;
        const snappedDelta = snapToDay(deltaX, viewport);
        const deltaDays = Math.round(snappedDelta / viewport.pxPerDay);

        let newStart = new Date(originalStart);
        let newEnd = new Date(originalEnd);

        if (mode === 'move') {
          newStart = new Date(originalStart);
          newStart.setDate(newStart.getDate() + deltaDays);
          newEnd = new Date(originalEnd);
          newEnd.setDate(newEnd.getDate() + deltaDays);
        } else if (mode === 'resize-left') {
          newStart = new Date(originalStart);
          newStart.setDate(newStart.getDate() + deltaDays);
          if (newStart >= newEnd) {
            newStart = new Date(newEnd);
            newStart.setDate(newStart.getDate() - 1);
          }
        } else if (mode === 'resize-right') {
          newEnd = new Date(originalEnd);
          newEnd.setDate(newEnd.getDate() + deltaDays);
          if (newEnd <= newStart) {
            newEnd = new Date(newStart);
            newEnd.setDate(newEnd.getDate() + 1);
          }
        }

        previewRef.current.set(rowId, { start: newStart, end: newEnd });
      }

      function onUp() {
        if (!dragRef.current) return;
        const { rowId } = dragRef.current;
        const preview = previewRef.current.get(rowId);
        if (preview && onUpdate) {
          onUpdate(rowId, preview.start, preview.end);
        }
        dragRef.current = null;
        previewRef.current.delete(rowId);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      }

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [viewport, onUpdate]
  );

  return { startDrag, previewRef };
}
