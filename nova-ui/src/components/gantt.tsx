import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type GanttViewMode = "day" | "week" | "month";

export interface GanttTask {
  id: string;
  groupId?: string;
  label: string;
  start: Date;
  end: Date;
  progress?: number;
  color?: string;
  milestone?: boolean;
  dependencies?: string[];
}

export interface GanttGroup {
  id: string;
  label: string;
  color?: string;
}

export interface GanttChartProps {
  tasks: GanttTask[];
  groups?: GanttGroup[];
  defaultViewMode?: GanttViewMode;
  startDate?: Date;
  endDate?: Date;
  onTasksChange?: (tasks: GanttTask[]) => void;
  onGroupsChange?: (groups: GanttGroup[]) => void;
  rowHeight?: number;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const LABEL_PANEL_WIDTH = 240;
const DAY_WIDTHS: Record<GanttViewMode, number> = { day: 30, week: 120 / 7, month: 100 / 30 };
const TASK_COLORS = [
  "oklch(0.65 0.18 262)",
  "oklch(0.65 0.18 145)",
  "oklch(0.65 0.18 28)",
  "oklch(0.65 0.18 320)",
  "oklch(0.65 0.18 200)",
];
const HEADER_HEIGHT = 52; // two-row header

// ─────────────────────────────────────────────────────────────────────────────
// Pixel math utilities
// ─────────────────────────────────────────────────────────────────────────────

function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / 86400000;
}

function dateToX(date: Date, startDate: Date, dayWidth: number): number {
  return daysBetween(startDate, date) * dayWidth;
}

function xToDate(x: number, startDate: Date, dayWidth: number): Date {
  const ms = (x / dayWidth) * 86400000;
  return new Date(startDate.getTime() + ms);
}

function snapX(x: number, dayWidth: number): number {
  return Math.round(x / dayWidth) * dayWidth;
}


function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Header column generation
// ─────────────────────────────────────────────────────────────────────────────

interface HeaderColumn {
  label: string;
  superLabel: string;
  x: number;
  width: number;
}

function buildHeaderColumns(
  startDate: Date,
  endDate: Date,
  viewMode: GanttViewMode,
): HeaderColumn[] {
  const cols: HeaderColumn[] = [];
  const dayWidth = DAY_WIDTHS[viewMode];

  if (viewMode === "day") {
    const cur = new Date(startDate);
    cur.setHours(0, 0, 0, 0);
    while (cur <= endDate) {
      const x = dateToX(cur, startDate, dayWidth);
      cols.push({
        label: String(cur.getDate()),
        superLabel: cur.toLocaleString("default", { month: "short", year: "numeric" }),
        x,
        width: dayWidth,
      });
      cur.setDate(cur.getDate() + 1);
    }
  } else if (viewMode === "week") {
    // Start from the Monday of the week containing startDate
    const cur = new Date(startDate);
    cur.setHours(0, 0, 0, 0);
    const dow = cur.getDay(); // 0=Sun
    cur.setDate(cur.getDate() - ((dow + 6) % 7)); // rewind to Monday
    let weekNum = 1;
    while (cur <= endDate) {
      const x = dateToX(cur, startDate, dayWidth);
      const monthYear = cur.toLocaleString("default", { month: "short", year: "numeric" });
      cols.push({
        label: `W${weekNum}`,
        superLabel: monthYear,
        x,
        width: 7 * dayWidth,
      });
      cur.setDate(cur.getDate() + 7);
      weekNum++;
    }
  } else {
    // month view
    const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    while (cur <= endDate) {
      const x = dateToX(cur, startDate, dayWidth);
      const daysInMonth = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
      cols.push({
        label: cur.toLocaleString("default", { month: "short" }),
        superLabel: String(cur.getFullYear()),
        x,
        width: daysInMonth * dayWidth,
      });
      cur.setMonth(cur.getMonth() + 1);
    }
  }

  return cols;
}

// ─────────────────────────────────────────────────────────────────────────────
// useGantt hook
// ─────────────────────────────────────────────────────────────────────────────

export function useGantt(initialTasks: GanttTask[], initialGroups: GanttGroup[] = []) {
  const [tasks, setTasks] = useState<GanttTask[]>(initialTasks);
  const [groups, setGroups] = useState<GanttGroup[]>(initialGroups);

  const addTask = useCallback((task?: Partial<GanttTask>) => {
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const start = startOfDay(new Date());
    const end = addDays(start, 7);
    setTasks((prev) => [...prev, { id, label: "New task", start, end, ...task }]);
    return id;
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<GanttTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const moveTask = useCallback((id: string, start: Date, end: Date) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, start, end } : t)));
  }, []);

  const resizeTask = useCallback((id: string, start: Date, end: Date) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, start, end } : t)));
  }, []);

  const addGroup = useCallback((group?: Partial<GanttGroup>) => {
    const id = `group-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setGroups((prev) => {
      const colorIdx = prev.length % TASK_COLORS.length;
      return [...prev, { id, label: "New group", color: TASK_COLORS[colorIdx], ...group }];
    });
    return id;
  }, []);

  const removeGroup = useCallback((id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
    setTasks((prev) => prev.map((t) => (t.groupId === id ? { ...t, groupId: undefined } : t)));
  }, []);

  const updateGroup = useCallback((id: string, patch: Partial<GanttGroup>) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }, []);

  return { tasks, groups, addTask, removeTask, updateTask, addGroup, removeGroup, updateGroup, moveTask, resizeTask };
}

// ─────────────────────────────────────────────────────────────────────────────
// Dependency arrow SVG
// ─────────────────────────────────────────────────────────────────────────────

interface ArrowProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  markerId: string;
}

function DepArrow({ fromX, fromY, toX, toY, markerId }: ArrowProps) {
  const midX = fromX + Math.max(20, (toX - fromX) * 0.5);
  const d = `M ${fromX} ${fromY} H ${midX} V ${toY} H ${toX}`;
  return (
    <path
      d={d}
      stroke="var(--nova-border-strong)"
      fill="none"
      strokeWidth={1.5}
      markerEnd={`url(#${markerId})`}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main GanttChart component
// ─────────────────────────────────────────────────────────────────────────────

export function GanttChart({
  tasks: tasksProp,
  groups: groupsProp = [],
  defaultViewMode = "week",
  startDate: startDateProp,
  endDate: endDateProp,
  onTasksChange,
  onGroupsChange,
  rowHeight = 40,
  className,
}: GanttChartProps) {
  const hookState = useGantt(tasksProp, groupsProp);
  const isControlled = onTasksChange !== undefined;

  const tasks = isControlled ? tasksProp : hookState.tasks;
  const groups = isControlled ? (groupsProp ?? []) : hookState.groups;

  const updateTask = useCallback(
    (id: string, patch: Partial<GanttTask>) => {
      if (isControlled) {
        onTasksChange?.(tasksProp.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      } else {
        hookState.updateTask(id, patch);
      }
    },
    [isControlled, onTasksChange, tasksProp, hookState],
  );

  const removeTask = useCallback(
    (id: string) => {
      if (isControlled) {
        onTasksChange?.(tasksProp.filter((t) => t.id !== id));
      } else {
        hookState.removeTask(id);
      }
    },
    [isControlled, onTasksChange, tasksProp, hookState],
  );

  const addTask = useCallback(
    (patch?: Partial<GanttTask>) => {
      const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const start = startOfDay(new Date());
      const end = addDays(start, 7);
      const newTask: GanttTask = { id, label: "New task", start, end, ...patch };
      if (isControlled) {
        onTasksChange?.([...tasksProp, newTask]);
      } else {
        hookState.addTask(patch);
      }
    },
    [isControlled, onTasksChange, tasksProp, hookState],
  );

  const addGroup = useCallback(() => {
    const id = `group-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const colorIdx = groups.length % TASK_COLORS.length;
    const newGroup: GanttGroup = { id, label: "New group", color: TASK_COLORS[colorIdx] };
    if (isControlled) {
      onGroupsChange?.([...groups, newGroup]);
    } else {
      hookState.addGroup();
    }
  }, [isControlled, onGroupsChange, groups, hookState]);

  const [viewMode, setViewMode] = useState<GanttViewMode>(defaultViewMode);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const timelineRef = useRef<HTMLDivElement>(null);
  const labelScrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Derived dates
  const chartStartDate = useMemo(() => {
    if (startDateProp) return startOfDay(startDateProp);
    if (tasks.length === 0) return startOfDay(new Date());
    const min = tasks.reduce(
      (m, t) => (t.start < m ? t.start : m),
      tasks[0].start,
    );
    const d = startOfDay(min);
    d.setDate(d.getDate() - 7); // buffer
    return d;
  }, [startDateProp, tasks]);

  const chartEndDate = useMemo(() => {
    if (endDateProp) return startOfDay(endDateProp);
    if (tasks.length === 0) return addDays(chartStartDate, 60);
    const max = tasks.reduce(
      (m, t) => (t.end > m ? t.end : m),
      tasks[0].end,
    );
    const d = startOfDay(max);
    d.setDate(d.getDate() + 14); // buffer
    return d;
  }, [endDateProp, tasks, chartStartDate]);

  const dayWidth = DAY_WIDTHS[viewMode];

  const headerColumns = useMemo(
    () => buildHeaderColumns(chartStartDate, chartEndDate, viewMode),
    [chartStartDate, chartEndDate, viewMode],
  );

  const totalWidth = useMemo(
    () => dateToX(chartEndDate, chartStartDate, dayWidth),
    [chartEndDate, chartStartDate, dayWidth],
  );

  // Color helpers
  const getTaskColor = useCallback(
    (task: GanttTask): string => {
      if (task.color) return task.color;
      if (task.groupId) {
        const group = groups.find((g) => g.id === task.groupId);
        if (group?.color) return group.color;
      }
      const idx = tasks.indexOf(task) % TASK_COLORS.length;
      return TASK_COLORS[Math.max(0, idx)];
    },
    [groups, tasks],
  );

  // Flat visible rows (groups + tasks respecting collapse)
  const visibleRows = useMemo(() => {
    type Row =
      | { kind: "group"; group: GanttGroup; colorIdx: number }
      | { kind: "task"; task: GanttTask; indent: boolean };
    const rows: Row[] = [];
    const ungrouped = tasks.filter((t) => !t.groupId);

    groups.forEach((group, gi) => {
      rows.push({ kind: "group", group, colorIdx: gi % TASK_COLORS.length });
      if (!collapsedGroups.has(group.id)) {
        tasks
          .filter((t) => t.groupId === group.id)
          .forEach((task) => rows.push({ kind: "task", task, indent: true }));
      }
    });
    ungrouped.forEach((task) => rows.push({ kind: "task", task, indent: false }));
    return rows;
  }, [tasks, groups, collapsedGroups]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  // ── Drag state refs (avoids re-renders during drag) ──────────────────────
  const dragRef = useRef<{
    type: "move" | "resize-left" | "resize-right" | "progress";
    taskId: string;
    startClientX: number;
    origStart: Date;
    origEnd: Date;
    origProgress: number;
    barEl: HTMLElement;
    dayWidth: number;
    chartStart: Date;
    chartEnd: Date;
  } | null>(null);

  const onBarPointerDown = (
    e: ReactPointerEvent<HTMLElement>,
    task: GanttTask,
    type: "move" | "resize-left" | "resize-right",
  ) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      type,
      taskId: task.id,
      startClientX: e.clientX,
      origStart: new Date(task.start),
      origEnd: new Date(task.end),
      origProgress: task.progress ?? 0,
      barEl: e.currentTarget as HTMLElement,
      dayWidth,
      chartStart: chartStartDate,
      chartEnd: chartEndDate,
    };
  };

  const onBarPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || !e.currentTarget.hasPointerCapture(e.pointerId)) return;

    const dx = e.clientX - drag.startClientX;
    const dDays = dx / drag.dayWidth;
    const { type, origStart, origEnd, barEl } = drag;

    if (type === "move") {
      const dur = origEnd.getTime() - origStart.getTime();
      let newStart = new Date(origStart.getTime() + dDays * 86400000);
      newStart = startOfDay(newStart);
      // Snap
      const snappedX = snapX(dateToX(newStart, drag.chartStart, drag.dayWidth), drag.dayWidth);
      newStart = xToDate(snappedX, drag.chartStart, drag.dayWidth);
      const newEnd = new Date(newStart.getTime() + dur);
      // Update DOM directly
      const left = dateToX(newStart, drag.chartStart, drag.dayWidth);
      barEl.style.left = `${left}px`;
      barEl.dataset.pendingStart = newStart.toISOString();
      barEl.dataset.pendingEnd = newEnd.toISOString();
    } else if (type === "resize-right") {
      let newEnd = new Date(origEnd.getTime() + dDays * 86400000);
      newEnd = startOfDay(newEnd);
      // Snap
      const snappedX = snapX(dateToX(newEnd, drag.chartStart, drag.dayWidth), drag.dayWidth);
      newEnd = xToDate(snappedX, drag.chartStart, drag.dayWidth);
      // Min 1 day
      if (newEnd.getTime() <= origStart.getTime() + 86400000) {
        newEnd = addDays(origStart, 1);
      }
      const width =
        dateToX(newEnd, drag.chartStart, drag.dayWidth) -
        dateToX(origStart, drag.chartStart, drag.dayWidth);
      barEl.style.width = `${Math.max(drag.dayWidth, width)}px`;
      barEl.dataset.pendingEnd = newEnd.toISOString();
    } else if (type === "resize-left") {
      let newStart = new Date(origStart.getTime() + dDays * 86400000);
      newStart = startOfDay(newStart);
      // Snap
      const snappedX = snapX(dateToX(newStart, drag.chartStart, drag.dayWidth), drag.dayWidth);
      newStart = xToDate(snappedX, drag.chartStart, drag.dayWidth);
      // Min 1 day
      if (newStart.getTime() >= origEnd.getTime() - 86400000) {
        newStart = addDays(origEnd, -1);
      }
      const left = dateToX(newStart, drag.chartStart, drag.dayWidth);
      const width =
        dateToX(origEnd, drag.chartStart, drag.dayWidth) - left;
      barEl.style.left = `${left}px`;
      barEl.style.width = `${Math.max(drag.dayWidth, width)}px`;
      barEl.dataset.pendingStart = newStart.toISOString();
    }
  };

  const onBarPointerUp = (e: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    e.currentTarget.releasePointerCapture(e.pointerId);

    const { barEl, taskId } = drag;
    const pendingStart = barEl.dataset.pendingStart
      ? new Date(barEl.dataset.pendingStart)
      : drag.origStart;
    const pendingEnd = barEl.dataset.pendingEnd
      ? new Date(barEl.dataset.pendingEnd)
      : drag.origEnd;

    delete barEl.dataset.pendingStart;
    delete barEl.dataset.pendingEnd;

    updateTask(taskId, { start: pendingStart, end: pendingEnd });
    dragRef.current = null;
  };

  // ── Progress drag ──────────────────────────────────────────────────────────
  const onProgressPointerDown = (e: ReactPointerEvent<HTMLElement>, task: GanttTask) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      type: "progress",
      taskId: task.id,
      startClientX: e.clientX,
      origStart: task.start,
      origEnd: task.end,
      origProgress: task.progress ?? 0,
      barEl: e.currentTarget.parentElement as HTMLElement,
      dayWidth,
      chartStart: chartStartDate,
      chartEnd: chartEndDate,
    };
  };

  const onProgressPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.type !== "progress" || !e.currentTarget.hasPointerCapture(e.pointerId))
      return;
    const barRect = drag.barEl.getBoundingClientRect();
    const pct = Math.round(((e.clientX - barRect.left) / barRect.width) * 100);
    const clamped = Math.min(100, Math.max(0, pct));
    // Update fill directly (no re-render)
    const fill = drag.barEl.querySelector<HTMLElement>("[data-progress-fill]");
    if (fill) fill.style.width = `${clamped}%`;
    drag.barEl.dataset.pendingProgress = String(clamped);
  };

  const onProgressPointerUp = (e: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.type !== "progress") return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    const val = drag.barEl.dataset.pendingProgress;
    if (val !== undefined) {
      updateTask(drag.taskId, { progress: Number(val) });
      delete drag.barEl.dataset.pendingProgress;
    }
    dragRef.current = null;
  };

  // ── Today marker ──────────────────────────────────────────────────────────
  const todayX = dateToX(startOfDay(new Date()), chartStartDate, dayWidth);

  // ── Dependency arrows ──────────────────────────────────────────────────────
  const taskIndex = useMemo(() => {
    const map = new Map<string, number>();
    let rowIdx = 0;
    visibleRows.forEach((row) => {
      if (row.kind === "task") {
        map.set(row.task.id, rowIdx);
      }
      rowIdx++;
    });
    return map;
  }, [visibleRows]);

  const arrows = useMemo(() => {
    const result: { key: string; from: Omit<ArrowProps, "markerId"> }[] = [];
    tasks.forEach((task) => {
      if (!task.dependencies?.length) return;
      const toRowIdx = taskIndex.get(task.id);
      if (toRowIdx === undefined) return;
      const toX = dateToX(task.start, chartStartDate, dayWidth);
      const toY = toRowIdx * rowHeight + rowHeight / 2;

      task.dependencies.forEach((depId) => {
        const fromTask = tasks.find((t) => t.id === depId);
        if (!fromTask) return;
        const fromRowIdx = taskIndex.get(depId);
        if (fromRowIdx === undefined) return;
        const fromX = dateToX(fromTask.end, chartStartDate, dayWidth);
        const fromY = fromRowIdx * rowHeight + rowHeight / 2;
        result.push({
          key: `${depId}->${task.id}`,
          from: { fromX, fromY, toX, toY },
        });
      });
    });
    return result;
  }, [tasks, taskIndex, chartStartDate, dayWidth, rowHeight]);

  // ── Unique ID for SVG marker ───────────────────────────────────────────────
  const markerId = useId();

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const totalRows = visibleRows.length;
  const timelineBodyHeight = totalRows * rowHeight;

  return (
    <div className={cn("flex flex-col rounded-nova border border-border bg-surface overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 bg-surface-2 flex-shrink-0">
        {/* View mode segmented control */}
        <div className="flex items-center rounded-nova-sm border border-border overflow-hidden text-xs font-medium">
          {(["day", "week", "month"] as GanttViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "px-3 py-1.5 capitalize transition-colors",
                viewMode === mode
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface text-foreground hover:bg-surface-2",
              )}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <Button variant="outline" size="sm" onClick={addGroup}>
          <Plus />
          Add group
        </Button>
        <Button variant="outline" size="sm" onClick={() => addTask()}>
          <Plus />
          Add task
        </Button>
      </div>

      {/* Main chart area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left label panel */}
        <div
          className="flex-shrink-0 border-r border-border bg-surface flex flex-col"
          style={{ width: LABEL_PANEL_WIDTH }}
        >
          {/* Header placeholder to align with timeline header */}
          <div
            className="flex-shrink-0 border-b border-border bg-surface-2"
            style={{ height: HEADER_HEIGHT }}
          >
            <div className="flex h-full items-end px-3 pb-2 text-xs font-semibold text-muted">
              Tasks
            </div>
          </div>

          {/* Task rows — scroll synced via shared container */}
          <div ref={labelScrollRef} className="overflow-hidden flex-1">
            <div style={{ height: timelineBodyHeight }}>
              {visibleRows.map((row) => {
                if (row.kind === "group") {
                  const { group } = row;
                  const isCollapsed = collapsedGroups.has(group.id);
                  return (
                    <LabelGroupRow
                      key={group.id}
                      group={group}
                      height={rowHeight}
                      collapsed={isCollapsed}
                      onToggle={() => toggleGroup(group.id)}
                      onLabelChange={(label) => {
                        if (isControlled) {
                          onGroupsChange?.(groups.map((g) => (g.id === group.id ? { ...g, label } : g)));
                        } else {
                          hookState.updateGroup(group.id, { label });
                        }
                      }}
                    />
                  );
                }
                const { task, indent } = row;
                return (
                  <LabelTaskRow
                    key={task.id}
                    task={task}
                    height={rowHeight}
                    indent={indent}
                    onLabelChange={(label) => updateTask(task.id, { label })}
                    onDelete={() => removeTask(task.id)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Right timeline panel */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto"
          onScroll={(e) => {
            // sync label panel vertical scroll
            if (labelScrollRef.current) {
              labelScrollRef.current.scrollTop = (e.currentTarget as HTMLElement).scrollTop;
            }
          }}
        >
          <div style={{ width: Math.max(totalWidth, 800), minWidth: "100%" }}>
            {/* Sticky timeline header */}
            <div
              className="sticky top-0 z-10 bg-surface-2 border-b border-border"
              style={{ height: HEADER_HEIGHT }}
              ref={timelineRef}
            >
              <TimelineHeader
                columns={headerColumns}
                totalWidth={totalWidth}
              />
            </div>

            {/* Timeline body */}
            <div
              className="relative"
              style={{ height: timelineBodyHeight, width: totalWidth }}
            >
              {/* Grid lines */}
              <GridLines
                columns={headerColumns}
                height={timelineBodyHeight}
                rowHeight={rowHeight}
                totalRows={totalRows}
              />

              {/* Today marker */}
              {todayX >= 0 && todayX <= totalWidth && (
                <div
                  className="absolute top-0 bottom-0 z-20 pointer-events-none"
                  style={{ left: todayX, width: 2, background: "var(--nova-accent)", opacity: 0.7 }}
                >
                  <span className="absolute -top-0 left-1 text-[10px] font-semibold text-accent whitespace-nowrap">
                    Today
                  </span>
                </div>
              )}

              {/* Task bars */}
              {visibleRows.map((row, i) => {
                if (row.kind === "group") {
                  return (
                    <div
                      key={`group-${row.group.id}`}
                      className="absolute left-0 right-0 bg-surface-2/40"
                      style={{ top: i * rowHeight, height: rowHeight }}
                    />
                  );
                }
                const { task } = row;
                const color = getTaskColor(task);
                return (
                  <TaskBar
                    key={task.id}
                    task={task}
                    rowIndex={i}
                    rowHeight={rowHeight}
                    color={color}
                    chartStartDate={chartStartDate}
                    dayWidth={dayWidth}
                    onBarPointerDown={onBarPointerDown}
                    onBarPointerMove={onBarPointerMove}
                    onBarPointerUp={onBarPointerUp}
                    onProgressPointerDown={onProgressPointerDown}
                    onProgressPointerMove={onProgressPointerMove}
                    onProgressPointerUp={onProgressPointerUp}
                  />
                );
              })}

              {/* Dependency arrows SVG overlay */}
              {arrows.length > 0 && (
                <svg
                  className="absolute inset-0 pointer-events-none overflow-visible"
                  style={{ width: totalWidth, height: timelineBodyHeight }}
                >
                  <defs>
                    <marker
                      id={markerId}
                      markerWidth="8"
                      markerHeight="8"
                      refX="6"
                      refY="3"
                      orient="auto"
                    >
                      <path d="M0,0 L0,6 L8,3 z" fill="var(--nova-border-strong)" />
                    </marker>
                  </defs>
                  {arrows.map(({ key, from }) => (
                    <DepArrow key={key} {...from} markerId={markerId} />
                  ))}
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

interface TimelineHeaderProps {
  columns: HeaderColumn[];
  totalWidth: number;
}

function TimelineHeader({ columns, totalWidth }: TimelineHeaderProps) {
  // Group columns by superLabel for the top row
  const superGroups = useMemo(() => {
    const groups: { label: string; x: number; width: number }[] = [];
    columns.forEach((col) => {
      const last = groups[groups.length - 1];
      if (last && last.label === col.superLabel) {
        last.width += col.width;
      } else {
        groups.push({ label: col.superLabel, x: col.x, width: col.width });
      }
    });
    return groups;
  }, [columns]);

  return (
    <div className="relative overflow-hidden" style={{ height: "100%", width: totalWidth }}>
      {/* Super row (month/year) */}
      <div className="absolute top-0 left-0 right-0 flex" style={{ height: 24 }}>
        {superGroups.map((sg, i) => (
          <div
            key={i}
            className="absolute flex items-center px-2 text-[10px] font-semibold text-muted border-r border-border truncate"
            style={{ left: sg.x, width: sg.width, height: 24 }}
          >
            {sg.label}
          </div>
        ))}
      </div>
      {/* Sub row (day/week/month) */}
      <div className="absolute left-0 right-0 flex border-t border-border" style={{ top: 24, height: 28 }}>
        {columns.map((col, i) => (
          <div
            key={i}
            className="absolute flex items-center justify-center text-[10px] text-subtle border-r border-border"
            style={{ left: col.x, width: col.width, height: 28 }}
          >
            {col.label}
          </div>
        ))}
      </div>
    </div>
  );
}

interface GridLinesProps {
  columns: HeaderColumn[];
  height: number;
  rowHeight: number;
  totalRows: number;
}

function GridLines({ columns, height, rowHeight, totalRows }: GridLinesProps) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: "100%", height }}
      preserveAspectRatio="none"
    >
      {/* Vertical column lines */}
      {columns.map((col, i) => (
        <line
          key={`v-${i}`}
          x1={col.x}
          y1={0}
          x2={col.x}
          y2={height}
          stroke="var(--nova-border)"
          strokeWidth={1}
        />
      ))}
      {/* Horizontal row lines */}
      {Array.from({ length: totalRows }).map((_, i) => (
        <line
          key={`h-${i}`}
          x1={0}
          y1={(i + 1) * rowHeight}
          x2="100%"
          y2={(i + 1) * rowHeight}
          stroke="var(--nova-border)"
          strokeWidth={1}
        />
      ))}
    </svg>
  );
}

interface LabelGroupRowProps {
  group: GanttGroup;
  height: number;
  collapsed: boolean;
  onToggle: () => void;
  onLabelChange: (label: string) => void;
}

function EditableLabel({
  value,
  onCommit,
  className,
}: {
  value: string;
  onCommit: (v: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const spanRef = useRef<HTMLSpanElement>(null);

  const startEdit = () => {
    setEditing(true);
    requestAnimationFrame(() => {
      const el = spanRef.current;
      if (!el) return;
      el.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(el);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    });
  };

  const commit = () => {
    setEditing(false);
    const val = (spanRef.current?.textContent ?? "").trim();
    if (val && val !== value) onCommit(val);
    else if (spanRef.current) spanRef.current.textContent = value;
  };

  return (
    <span
      ref={spanRef}
      contentEditable={editing || undefined}
      suppressContentEditableWarning
      onDoubleClick={startEdit}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); commit(); }
        if (e.key === "Escape") { setEditing(false); if (spanRef.current) spanRef.current.textContent = value; }
      }}
      title="Double-click to rename"
      className={cn("outline-none rounded px-0.5 cursor-default select-none", editing && "cursor-text select-text bg-surface ring-1 ring-ring", className)}
    >
      {value}
    </span>
  );
}

function LabelGroupRow({ group, height, collapsed, onToggle, onLabelChange }: LabelGroupRowProps) {
  return (
    <div
      className="flex items-center gap-1 px-2 bg-surface-2/60 border-b border-border group/row"
      style={{ height }}
    >
      <button
        onClick={onToggle}
        className="shrink-0 text-subtle hover:text-foreground transition-colors p-1"
        aria-label={collapsed ? "Expand group" : "Collapse group"}
      >
        {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronDown className="size-3.5" />}
      </button>
      {group.color && (
        <div className="shrink-0 size-2.5 rounded-sm" style={{ background: group.color }} />
      )}
      <EditableLabel
        value={group.label}
        onCommit={onLabelChange}
        className="flex-1 text-xs font-semibold text-foreground truncate"
      />
    </div>
  );
}

interface LabelTaskRowProps {
  task: GanttTask;
  height: number;
  indent: boolean;
  onLabelChange: (label: string) => void;
  onDelete: () => void;
}

function LabelTaskRow({ task, height, indent, onLabelChange, onDelete }: LabelTaskRowProps) {
  return (
    <div
      className="flex items-center gap-1 border-b border-border group/row"
      style={{ height, paddingLeft: indent ? 28 : 8, paddingRight: 4 }}
    >
      <EditableLabel
        value={task.label}
        onCommit={onLabelChange}
        className="flex-1 text-xs text-foreground truncate"
      />
      <button
        onClick={onDelete}
        className="shrink-0 opacity-0 group-hover/row:opacity-100 focus:opacity-100 text-subtle hover:text-danger transition-opacity p-1 rounded touch-manipulation"
        aria-label="Delete task"
      >
        <Trash2 className="size-3" />
      </button>
    </div>
  );
}

interface TaskBarProps {
  task: GanttTask;
  rowIndex: number;
  rowHeight: number;
  color: string;
  chartStartDate: Date;
  dayWidth: number;
  onBarPointerDown: (
    e: ReactPointerEvent<HTMLElement>,
    task: GanttTask,
    type: "move" | "resize-left" | "resize-right",
  ) => void;
  onBarPointerMove: (e: ReactPointerEvent<HTMLElement>) => void;
  onBarPointerUp: (e: ReactPointerEvent<HTMLElement>) => void;
  onProgressPointerDown: (e: ReactPointerEvent<HTMLElement>, task: GanttTask) => void;
  onProgressPointerMove: (e: ReactPointerEvent<HTMLElement>) => void;
  onProgressPointerUp: (e: ReactPointerEvent<HTMLElement>) => void;
}

function TaskBar({
  task,
  rowIndex,
  rowHeight,
  color,
  chartStartDate,
  dayWidth,
  onBarPointerDown,
  onBarPointerMove,
  onBarPointerUp,
  onProgressPointerDown,
  onProgressPointerMove,
  onProgressPointerUp,
}: TaskBarProps) {
  const top = rowIndex * rowHeight + 4;
  const barHeight = rowHeight - 8;

  if (task.milestone) {
    const x = dateToX(task.start, chartStartDate, dayWidth);
    const size = 14;
    return (
      <div
        className="absolute z-10 flex items-center justify-center"
        style={{
          top: rowIndex * rowHeight,
          left: x - size / 2,
          width: size * 2,
          height: rowHeight,
        }}
        title={task.label}
      >
        <div
          className="rotate-45 rounded-sm shadow-nova-sm"
          style={{
            width: size,
            height: size,
            background: color,
          }}
        />
      </div>
    );
  }

  const left = dateToX(task.start, chartStartDate, dayWidth);
  const width = dateToX(task.end, chartStartDate, dayWidth) - left;
  const progress = task.progress ?? 0;

  // Darken the color for progress fill
  const progressColor = `color-mix(in oklch, black 20%, ${color})`;

  return (
    <div
      className="absolute z-10 flex items-center rounded group/bar"
      style={{
        top,
        left,
        width: Math.max(dayWidth, width),
        height: barHeight,
        background: color,
        opacity: 0.9,
        cursor: "grab",
        userSelect: "none",
        touchAction: "none",
      }}
      onPointerDown={(e) => onBarPointerDown(e, task, "move")}
      onPointerMove={onBarPointerMove}
      onPointerUp={onBarPointerUp}
      title={task.label}
    >
      {/* Progress fill */}
      {progress > 0 && (
        <div
          data-progress-fill
          className="absolute top-0 left-0 bottom-0 rounded-l pointer-events-none"
          style={{
            width: `${progress}%`,
            background: progressColor,
          }}
        />
      )}

      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 z-20 cursor-col-resize"
        style={{ width: 6 }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onBarPointerDown(e, task, "resize-left");
        }}
        onPointerMove={onBarPointerMove}
        onPointerUp={onBarPointerUp}
      />

      {/* Label inside bar */}
      <span className="relative z-10 px-2 text-[11px] font-medium text-white truncate pointer-events-none select-none flex-1">
        {task.label}
        {progress > 0 && ` (${progress}%)`}
      </span>

      {/* Progress drag handle */}
      <div
        className="absolute top-0 bottom-0 z-20 cursor-ew-resize opacity-0 group-hover/bar:opacity-100 transition-opacity"
        style={{
          left: `${progress}%`,
          width: 8,
          marginLeft: -4,
          background: "rgba(255,255,255,0.35)",
          borderRadius: 2,
        }}
        onPointerDown={(e) => onProgressPointerDown(e, task)}
        onPointerMove={onProgressPointerMove}
        onPointerUp={onProgressPointerUp}
      />

      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 z-20 cursor-col-resize"
        style={{ width: 6 }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onBarPointerDown(e, task, "resize-right");
        }}
        onPointerMove={onBarPointerMove}
        onPointerUp={onBarPointerUp}
      />
    </div>
  );
}
