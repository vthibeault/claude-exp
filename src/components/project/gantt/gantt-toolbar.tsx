'use client';

import {
  ZoomIn,
  ZoomOut,
  Calendar,
  AlignJustify,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { GanttRow } from '@/lib/types/domain';
import { MIN_PX_PER_DAY, MAX_PX_PER_DAY } from './gantt-utils';

const ZOOM_STEPS = [3, 5, 8, 12, 16, 24, 32];

interface GanttToolbarProps {
  pxPerDay: number;
  onZoom: (pxPerDay: number) => void;
  onFit: () => void;
  onJumpToday: () => void;
}

export function GanttToolbar({
  pxPerDay,
  onZoom,
  onFit,
  onJumpToday,
}: GanttToolbarProps) {
  function zoomIn() {
    const next = ZOOM_STEPS.find((s) => s > pxPerDay);
    if (next) onZoom(next);
  }

  function zoomOut() {
    const prev = [...ZOOM_STEPS].reverse().find((s) => s < pxPerDay);
    if (prev) onZoom(prev);
  }

  const canZoomIn = pxPerDay < Math.max(...ZOOM_STEPS);
  const canZoomOut = pxPerDay > Math.min(...ZOOM_STEPS);

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={zoomOut}
              disabled={!canZoomOut}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Dézoomer</TooltipContent>
        </Tooltip>

        <span className="text-xs text-muted-foreground w-16 text-center">
          {pxPerDay}px/j
        </span>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={zoomIn}
              disabled={!canZoomIn}
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
              onClick={onJumpToday}
            >
              <Calendar className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Aller à aujourd&apos;hui</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={onFit}
            >
              <AlignJustify className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ajuster à la fenêtre</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
