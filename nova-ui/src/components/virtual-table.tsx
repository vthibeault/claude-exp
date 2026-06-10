import { useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Checkbox } from "./checkbox";
import type { DataTableColumn } from "./data-table";

export type { DataTableColumn };

export interface VirtualTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  rowHeight?: number;
  height?: number;
  className?: string;
  sortable?: boolean;
  selectable?: boolean;
  selected?: Set<string>;
  onSelectionChange?: (s: Set<string>) => void;
  onRowClick?: (row: T) => void;
  emptyState?: ReactNode;
}

type SortDir = "asc" | "desc";

const alignClass = { left: "text-left", center: "text-center", right: "text-right" };

export function VirtualTable<T>({
  data,
  columns,
  getRowId,
  rowHeight = 40,
  height = 400,
  className,
  sortable = false,
  selectable = false,
  selected,
  onSelectionChange,
  onRowClick,
  emptyState = "No results.",
}: VirtualTableProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [sort, setSort] = useState<{ key: keyof T & string; dir: SortDir } | null>(null);

  // The scroll container — we keep a ref only to read scrollTop on mount if needed.
  const outerRef = useRef<HTMLDivElement>(null);

  // ── Sorting ────────────────────────────────────────────────────────────────
  const sortedData = useMemo(() => {
    if (!sort) return data;
    const { key, dir } = sort;
    const mul = dir === "asc" ? 1 : -1;
    return [...data].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * mul;
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * mul;
    });
  }, [data, sort]);

  const toggleSort = (key: keyof T & string) => {
    if (!sortable) return;
    setSort((prev) =>
      prev?.key !== key ? { key, dir: "asc" } : prev.dir === "asc" ? { key, dir: "desc" } : null,
    );
  };

  // ── Virtualization ─────────────────────────────────────────────────────────
  const overscan = 3 * rowHeight;
  const totalHeight = sortedData.length * rowHeight;

  const { startIndex, endIndex } = useMemo(() => {
    const start = Math.max(0, Math.floor((scrollTop - overscan) / rowHeight));
    const end = Math.min(
      sortedData.length - 1,
      Math.ceil((scrollTop + height + overscan) / rowHeight),
    );
    return { startIndex: start, endIndex: end };
  }, [scrollTop, overscan, rowHeight, height, sortedData.length]);

  const visibleRows = sortedData.slice(startIndex, endIndex + 1);

  // ── Selection helpers ──────────────────────────────────────────────────────
  const sel = selected ?? new Set<string>();

  const allSelected = sortedData.length > 0 && sortedData.every((r) => sel.has(getRowId(r)));

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      const next = new Set(sel);
      sortedData.forEach((r) => next.delete(getRowId(r)));
      onSelectionChange(next);
    } else {
      const next = new Set(sel);
      sortedData.forEach((r) => next.add(getRowId(r)));
      onSelectionChange(next);
    }
  };

  const handleSelectRow = (id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(sel);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  // ── Header width — we need the table to be full width inside the scroll div.
  const colCount = columns.length + (selectable ? 1 : 0);

  return (
    <div className={cn("rounded-nova-lg border bg-surface overflow-x-auto", className)}>
      {/* Sticky header */}
      <div
        style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--nova-surface)" }}
        className="border-b"
      >
        <div className="flex w-full bg-surface-2/50">
          {selectable && (
            <div className="flex w-10 shrink-0 items-center px-3 py-2.5">
              <Checkbox
                checked={allSelected}
                onChange={handleSelectAll}
                aria-label="Select all rows"
              />
            </div>
          )}
          {columns.map((col) => {
            const isSorted = sort?.key === col.key;
            return (
              <div
                key={col.key}
                style={col.width ? { width: col.width, flex: "none" } : { flex: 1, minWidth: 0 }}
                className={cn(
                  "px-3 py-2.5 font-medium text-sm text-muted",
                  alignClass[col.align ?? "left"],
                )}
              >
                {col.sortable && sortable ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    aria-sort={isSorted ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                    className="inline-flex items-center gap-1 rounded-nova-sm outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {col.header}
                    {isSorted ? (
                      sort!.dir === "asc" ? (
                        <ChevronUp className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      )
                    ) : (
                      <ChevronsUpDown className="size-3.5 opacity-40" />
                    )}
                  </button>
                ) : (
                  col.header
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scroll container */}
      <div
        ref={outerRef}
        style={{ height, overflowY: "auto", contain: "strict" as React.CSSProperties["contain"] }}
        onScroll={(e) => setScrollTop((e.currentTarget as HTMLDivElement).scrollTop)}
      >
        {sortedData.length === 0 ? (
          <div
            className="flex items-center justify-center text-sm text-muted"
            style={{ height }}
          >
            {emptyState}
          </div>
        ) : (
          /* Inner spacer — full virtual height */
          <div style={{ height: totalHeight, position: "relative" }}>
            {visibleRows.map((row, localIdx) => {
              const rowIndex = startIndex + localIdx;
              const id = getRowId(row);
              const isSelected = sel.has(id);
              return (
                <div
                  key={id}
                  role="row"
                  aria-selected={selectable ? isSelected : undefined}
                  onClick={() => onRowClick?.(row)}
                  style={{
                    position: "absolute",
                    top: rowIndex * rowHeight,
                    width: "100%",
                    height: rowHeight,
                  }}
                  className={cn(
                    "flex items-center border-b text-sm transition-colors last:border-b-0",
                    "hover:bg-surface-2/60",
                    isSelected && "bg-accent-soft/40",
                    onRowClick && "cursor-pointer",
                  )}
                >
                  {selectable && (
                    <div className="flex w-10 shrink-0 items-center px-3">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSelectRow(id)}
                        aria-label={`Select row ${rowIndex + 1}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  {columns.map((col) => (
                    <div
                      key={col.key}
                      style={
                        col.width ? { width: col.width, flex: "none" } : { flex: 1, minWidth: 0 }
                      }
                      className={cn(
                        "truncate px-3",
                        alignClass[col.align ?? "left"],
                      )}
                    >
                      {col.render ? col.render(row) : String(row[col.key] ?? "")}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer row count */}
      <div className="border-t px-3 py-2 text-xs text-muted">
        {sortedData.length.toLocaleString()} row{sortedData.length === 1 ? "" : "s"}
        {colCount > 0 && sort && (
          <span className="ml-2 opacity-60">
            sorted by {String(sort.key)} {sort.dir}
          </span>
        )}
      </div>
    </div>
  );
}
