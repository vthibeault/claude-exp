// Transform domain WBSElement[] + Activity[] → GanttRow[] for the custom Gantt chart.

import { differenceInCalendarDays } from 'date-fns';
import type { WBSElement, Activity, GanttRow, GanttLink } from '@/lib/types/domain';

interface GanttData {
  rows: GanttRow[];
  links: GanttLink[];
}

export function buildGanttData(
  wbsElements: WBSElement[],
  activities: Activity[]
): GanttData {
  const rows: GanttRow[] = [];
  const links: GanttLink[] = [];
  const linkSet = new Set<string>();

  // Flatten WBS tree into ordered list (depth-first)
  function addWBS(el: WBSElement) {
    const duration = Math.max(
      1,
      differenceInCalendarDays(el.plannedEnd, el.plannedStart)
    );
    rows.push({
      id: el.id,
      label: `${el.code} – ${el.description}`,
      type: 'wbs',
      start: el.plannedStart,
      end: el.plannedEnd,
      baselineStart: el.plannedStart,
      baselineEnd: el.plannedEnd,
      progress: el.plannedCost > 0 ? el.actualCost / el.plannedCost : 0,
      parentId: el.parentId,
      level: el.level,
      isExpanded: el.level < 2,
      links: [],
    });
    for (const child of el.children) addWBS(child);
  }

  for (const el of wbsElements) addWBS(el);

  // Add activity rows under their WBS parent
  for (const act of activities) {
    rows.push({
      id: act.id,
      label: `${act.activityNumber} – ${act.description}`,
      type: 'activity',
      start: act.earliestStart,
      end: act.earliestEnd,
      baselineStart: act.plannedStart,
      baselineEnd: act.plannedEnd,
      progress: act.completionPct / 100,
      parentId: act.wbsElementId,
      level: 3,
      isExpanded: false,
      links: [],
    });

    // Collect links from predecessors
    for (const pred of act.predecessors) {
      const linkId = `${pred.sourceId}->${pred.targetId}`;
      if (!linkSet.has(linkId)) {
        linkSet.add(linkId);
        links.push({
          id: linkId,
          sourceId: pred.sourceId,
          targetId: pred.targetId,
          type: pred.type,
        });
      }
    }
  }

  return { rows, links };
}

export function flattenVisibleRows(rows: GanttRow[]): GanttRow[] {
  const expandedIds = new Set(
    rows.filter((r) => r.isExpanded).map((r) => r.id)
  );

  return rows.filter((row) => {
    if (!row.parentId) return true;
    // Walk up to check all ancestors are expanded
    let pid: string | null = row.parentId;
    while (pid) {
      const parent = rows.find((r) => r.id === pid);
      if (!parent) return true; // orphan — show it
      if (!parent.isExpanded) return false;
      pid = parent.parentId;
    }
    return true;
  });
}
