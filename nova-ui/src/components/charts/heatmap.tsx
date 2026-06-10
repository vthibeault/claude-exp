import React, { useMemo } from "react";
import { cn } from "@/lib/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HeatmapCell {
  x: string;
  y: string;
  value: number;
}

export interface HeatmapProps {
  data: HeatmapCell[];
  /** Explicit column order; defaults to sorted unique x values. */
  xLabels?: string[];
  /** Explicit row order; defaults to sorted unique y values. */
  yLabels?: string[];
  /**
   * [low color, high color] as CSS color values.
   * Defaults to a green OKLCH gradient.
   */
  colorScale?: [string, string];
  /** Defaults to min of data. */
  minValue?: number;
  /** Defaults to max of data. */
  maxValue?: number;
  /** Cell size in px. Default 32. */
  cellSize?: number;
  /** Show numeric values in cells. */
  showValues?: boolean;
  onCellClick?: (cell: HeatmapCell) => void;
  className?: string;
  title?: string;
  /** Render as a GitHub-style contribution calendar. */
  mode?: "grid" | "calendar";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function unique(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

/** Date → YYYY-MM-DD string. */
function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ---------------------------------------------------------------------------
// Calendar Heatmap (GitHub-style)
// ---------------------------------------------------------------------------

interface CalendarHeatmapProps {
  data: HeatmapCell[];
  colorScale: [string, string];
  minValue: number;
  maxValue: number;
  cellSize: number;
  showValues: boolean;
  onCellClick?: (cell: HeatmapCell) => void;
  className?: string;
  title?: string;
}

function CalendarHeatmap({
  data,
  colorScale,
  minValue,
  maxValue,
  cellSize,
  showValues,
  onCellClick,
  className,
  title,
}: CalendarHeatmapProps) {
  const { weeks, monthLabels } = useMemo(() => {
    // Span one year ending today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    // Start from the Sunday of the week one year ago
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    oneYearAgo.setDate(oneYearAgo.getDate() + 1); // day after one year ago
    // Rewind to Sunday
    const startSunday = new Date(oneYearAgo);
    startSunday.setDate(oneYearAgo.getDate() - oneYearAgo.getDay());

    // Build lookup map: date string → value
    const lookup = new Map<string, number>();
    for (const cell of data) {
      lookup.set(cell.x, cell.value);
    }

    // Build weeks array
    const weeksArr: Array<Array<{ date: Date; dateStr: string; value: number | null }>> = [];
    const cur = new Date(startSunday);
    const monthLabelMap = new Map<number, string>(); // weekIndex → month label

    while (cur <= end) {
      const week: Array<{ date: Date; dateStr: string; value: number | null }> = [];
      const weekIndex = weeksArr.length;
      for (let dow = 0; dow < 7; dow++) {
        const d = new Date(cur);
        d.setDate(cur.getDate() + dow);
        const ds = formatDate(d);
        const val = lookup.has(ds) ? (lookup.get(ds) ?? 0) : null;
        week.push({ date: d, dateStr: ds, value: d <= end ? val : null });
        // Record month label on first day of month
        if (d.getDate() === 1 && d <= end) {
          monthLabelMap.set(weekIndex, d.toLocaleString("default", { month: "short" }));
        }
      }
      weeksArr.push(week);
      cur.setDate(cur.getDate() + 7);
    }

    const mLabels: Array<{ weekIndex: number; label: string }> = [];
    monthLabelMap.forEach((label, weekIndex) => mLabels.push({ weekIndex, label }));
    mLabels.sort((a, b) => a.weekIndex - b.weekIndex);

    return { weeks: weeksArr, monthLabels: mLabels };
  }, [data]);

  const range = maxValue - minValue || 1;
  const [lowColor, highColor] = colorScale;

  const cellStyle = (value: number | null): React.CSSProperties => {
    if (value === null) return { background: "var(--nova-surface-2)" };
    const pct = Math.round(((value - minValue) / range) * 100);
    return {
      background: `color-mix(in oklch, ${highColor} ${pct}%, ${lowColor})`,
    };
  };

  const labelOffset = 32; // px reserved for DOW labels on the left
  const gap = 3;

  return (
    <div className={cn("inline-block select-none", className)}>
      {title && <p className="mb-2 text-sm font-medium text-foreground">{title}</p>}
      <div className="relative" style={{ paddingLeft: labelOffset, paddingTop: 20 }}>
        {/* Month labels row */}
        <div className="absolute top-0" style={{ left: labelOffset }}>
          {monthLabels.map(({ weekIndex, label }) => (
            <span
              key={weekIndex}
              className="absolute text-[10px] text-subtle"
              style={{ left: weekIndex * (cellSize + gap) }}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="flex gap-[3px]">
          {/* DOW labels column */}
          <div
            className="absolute left-0 top-5 flex flex-col gap-[3px]"
            style={{ width: labelOffset - gap }}
          >
            {DOW_LABELS.map((d, i) =>
              i % 2 === 1 ? (
                <div
                  key={d}
                  className="flex items-center justify-end pr-1 text-[10px] text-subtle"
                  style={{ height: cellSize }}
                >
                  {d}
                </div>
              ) : (
                <div key={d} style={{ height: cellSize }} />
              ),
            )}
          </div>

          {/* Week columns */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map(({ date, dateStr, value }, di) => (
                <div
                  key={di}
                  style={{ width: cellSize, height: cellSize, ...cellStyle(value) }}
                  title={value !== null ? `${dateStr}: ${value}` : dateStr}
                  role={onCellClick && value !== null ? "button" : undefined}
                  tabIndex={onCellClick && value !== null ? 0 : undefined}
                  onClick={
                    onCellClick && value !== null
                      ? () =>
                          onCellClick({
                            x: dateStr,
                            y: DOW_LABELS[date.getDay()],
                            value: value!,
                          })
                      : undefined
                  }
                  className={cn(
                    "rounded-sm transition-opacity",
                    onCellClick && value !== null && "cursor-pointer hover:opacity-80",
                  )}
                >
                  {showValues && value !== null && (
                    <span className="flex h-full items-center justify-center text-[8px] font-mono text-foreground/70">
                      {value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Heatmap
// ---------------------------------------------------------------------------

export function Heatmap({
  data,
  xLabels: xLabelsProp,
  yLabels: yLabelsProp,
  colorScale,
  minValue: minProp,
  maxValue: maxProp,
  cellSize = 32,
  showValues = false,
  onCellClick,
  className,
  title,
  mode = "grid",
}: HeatmapProps) {
  const resolvedColorScale: [string, string] = colorScale ?? [
    "oklch(0.97 0.01 0)",
    "oklch(0.7 0.15 145)",
  ];

  // Delegate to calendar variant
  if (mode === "calendar") {
    const values = data.map((c) => c.value);
    const min = minProp ?? Math.min(...values, 0);
    const max = maxProp ?? Math.max(...values, 1);
    return (
      <CalendarHeatmap
        data={data}
        colorScale={resolvedColorScale}
        minValue={min}
        maxValue={max}
        cellSize={cellSize < 16 ? 16 : cellSize > 48 ? 48 : cellSize}
        showValues={showValues}
        onCellClick={onCellClick}
        className={className}
        title={title}
      />
    );
  }

  // ── Grid mode ──────────────────────────────────────────────────────────────
  const xLabels = useMemo(
    () => xLabelsProp ?? unique(data.map((c) => c.x)).sort(),
    [xLabelsProp, data],
  );
  const yLabels = useMemo(
    () => yLabelsProp ?? unique(data.map((c) => c.y)).sort(),
    [yLabelsProp, data],
  );

  const values = data.map((c) => c.value);
  const min = minProp ?? Math.min(...values);
  const max = maxProp ?? Math.max(...values);
  const range = max - min || 1;

  // Fast lookup: "x__y" → value
  const lookup = useMemo(() => {
    const m = new Map<string, number>();
    for (const cell of data) {
      m.set(`${cell.x}__${cell.y}`, cell.value);
    }
    return m;
  }, [data]);

  const [lowColor, highColor] = resolvedColorScale;

  const cellBackground = (value: number) => {
    const pct = Math.round(((value - min) / range) * 100);
    return `color-mix(in oklch, ${highColor} ${pct}%, ${lowColor})`;
  };

  const cols = xLabels.length;

  return (
    <div className={cn("inline-grid gap-1", className)}>
      {title && (
        <p
          className="mb-1 text-sm font-medium text-foreground"
          style={{ gridColumn: `1 / ${cols + 2}` }}
        >
          {title}
        </p>
      )}

      {/* Grid with auto first column (y-labels) + N fixed columns */}
      <div
        className="inline-grid gap-1"
        style={{
          gridTemplateColumns: `auto repeat(${cols}, ${cellSize}px)`,
        }}
      >
        {/* Header row: empty corner + x labels */}
        <div />
        {xLabels.map((xl) => (
          <div
            key={xl}
            className="flex items-end justify-center pb-0.5 text-xs text-subtle"
            style={{ height: 20 }}
            title={xl}
          >
            <span className="truncate max-w-full text-[10px]">{xl}</span>
          </div>
        ))}

        {/* Data rows */}
        {yLabels.map((yl) => (
          <React.Fragment key={yl}>
            {/* Row label */}
            <div
              className="flex items-center justify-end pr-2 text-xs text-subtle"
              style={{ height: cellSize }}
            >
              {yl}
            </div>

            {/* Cells */}
            {xLabels.map((xl) => {
              const value = lookup.get(`${xl}__${yl}`);
              const hasValue = value !== undefined;
              const bg = hasValue ? cellBackground(value!) : "var(--nova-surface-2)";
              const cell: HeatmapCell = { x: xl, y: yl, value: value ?? 0 };

              return (
                <div
                  key={`${xl}-${yl}`}
                  style={{ width: cellSize, height: cellSize, background: bg }}
                  title={hasValue ? `${xl} / ${yl}: ${value}` : `${xl} / ${yl}: —`}
                  role={onCellClick && hasValue ? "button" : undefined}
                  tabIndex={onCellClick && hasValue ? 0 : undefined}
                  onClick={onCellClick && hasValue ? () => onCellClick(cell) : undefined}
                  onKeyDown={
                    onCellClick && hasValue
                      ? (e) => (e.key === "Enter" || e.key === " ") && onCellClick(cell)
                      : undefined
                  }
                  className={cn(
                    "rounded-sm transition-opacity",
                    "aspect-square flex items-center justify-center",
                    onCellClick && hasValue && "cursor-pointer hover:opacity-80",
                  )}
                >
                  {showValues && hasValue && (
                    <span className="text-xs font-mono text-foreground/70 leading-none">
                      {value}
                    </span>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
