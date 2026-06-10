import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Columns3, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Input } from "./input";
import { Pagination } from "./pagination";

export interface DataTableColumn<T> {
  key: keyof T & string;
  header: ReactNode;
  sortable?: boolean;
  /** Custom cell renderer; defaults to String(row[key]). */
  render?: (row: T) => ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
  /** Hide from the column-visibility menu (always shown). */
  pinned?: boolean;
}

export type SortDirection = "asc" | "desc";

export interface UseDataTableOptions<T> {
  data: T[];
  columns: Array<DataTableColumn<T>>;
  pageSize?: number;
  /** Stable row identity for selection; defaults to the row index. */
  getRowId?: (row: T, index: number) => string;
}

/**
 * Headless table state: global search, column sorting, pagination,
 * row selection, column visibility. Bring your own markup, or feed
 * the result straight into <DataTable>.
 */
export function useDataTable<T>({ data, columns, pageSize = 10, getRowId }: UseDataTableOptions<T>) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: keyof T & string; dir: SortDirection } | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const rowId = getRowId ?? ((_: T, i: number) => String(i));

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((c) => {
        const v = row[c.key];
        return v != null && String(v).toLowerCase().includes(q);
      }),
    );
  }, [data, columns, search]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const { key, dir } = sort;
    const mul = dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * mul;
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * mul;
    });
  }, [filtered, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const visibleColumns = columns.filter((c) => !hidden.has(c.key));

  const toggleSort = (key: keyof T & string) => {
    setSort((prev) =>
      prev?.key !== key ? { key, dir: "asc" } : prev.dir === "asc" ? { key, dir: "desc" } : null,
    );
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pageIds = pageRows.map((r, i) => rowId(r, (safePage - 1) * pageSize + i));
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const togglePage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleColumn = (key: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return {
    // state
    search,
    sort,
    page: safePage,
    pageCount,
    selected,
    hidden,
    // derived
    rows: pageRows,
    totalRows: sorted.length,
    visibleColumns,
    allPageSelected,
    rowId,
    pageStartIndex: (safePage - 1) * pageSize,
    // actions
    setSearch: (q: string) => {
      setSearch(q);
      setPage(1);
    },
    setPage,
    toggleSort,
    toggleRow,
    togglePage,
    toggleColumn,
    clearSelection: () => setSelected(new Set()),
  };
}

export interface DataTableProps<T> extends UseDataTableOptions<T> {
  /** Show the global search box. */
  searchable?: boolean;
  /** Show row-selection checkboxes. */
  selectable?: boolean;
  /** Show the column-visibility menu. */
  columnToggle?: boolean;
  onSelectionChange?: (ids: Set<string>) => void;
  emptyMessage?: ReactNode;
  className?: string;
}

const alignClass = { left: "text-left", center: "text-center", right: "text-right" };

/** Batteries-included table: search, sort, paginate, select, hide columns. */
export function DataTable<T>({
  searchable = true,
  selectable = false,
  columnToggle = true,
  onSelectionChange,
  emptyMessage = "No results.",
  className,
  ...options
}: DataTableProps<T>) {
  const t = useDataTable(options);
  const { columns } = options;

  const select = (fn: () => void) => {
    fn();
    // Selection state updates async; report on next microtask.
    queueMicrotask(() => onSelectionChange?.(t.selected));
  };

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      {(searchable || columnToggle) && (
        <div className="flex items-center gap-2">
          {searchable && (
            <div className="relative max-w-64 flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <Input
                value={t.search}
                onChange={(e) => t.setSearch(e.target.value)}
                placeholder="Search…"
                className="pl-8"
                aria-label="Search table"
              />
            </div>
          )}
          {selectable && t.selected.size > 0 && (
            <span className="text-sm text-muted">{t.selected.size} selected</span>
          )}
          {columnToggle && (
            <div className="ml-auto">
              <DropdownMenu align="end">
                <DropdownMenuTrigger>
                  <Button variant="outline" size="sm">
                    <Columns3 /> Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                  {columns
                    .filter((c) => !c.pinned)
                    .map((c) => (
                      <DropdownMenuItem
                        key={c.key}
                        onClick={(e) => e.preventDefault()}
                        onSelect={() => {}}
                      >
                        <span onClick={() => t.toggleColumn(c.key)} className="flex w-full items-center gap-2">
                          <Checkbox checked={!t.hidden.has(c.key)} readOnly tabIndex={-1} />
                          {c.header}
                        </span>
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-nova-lg border bg-surface">
        <table className="w-full caption-bottom text-sm">
          <thead>
            <tr className="border-b bg-surface-2/50">
              {selectable && (
                <th className="w-10 px-3 py-2.5">
                  <Checkbox
                    checked={t.allPageSelected}
                    onChange={() => select(t.togglePage)}
                    aria-label="Select all rows on this page"
                  />
                </th>
              )}
              {t.visibleColumns.map((c) => (
                <th
                  key={c.key}
                  style={c.width ? { width: c.width } : undefined}
                  aria-sort={
                    t.sort?.key === c.key ? (t.sort.dir === "asc" ? "ascending" : "descending") : undefined
                  }
                  className={cn(
                    "px-3 py-2.5 font-medium text-muted",
                    alignClass[c.align ?? "left"],
                  )}
                >
                  {c.sortable ? (
                    <button
                      type="button"
                      onClick={() => t.toggleSort(c.key)}
                      className="inline-flex items-center gap-1 rounded-nova-sm outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {c.header}
                      {t.sort?.key === c.key ? (
                        t.sort.dir === "asc" ? (
                          <ArrowUp className="size-3.5" />
                        ) : (
                          <ArrowDown className="size-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3.5 opacity-40" />
                      )}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={t.visibleColumns.length + (selectable ? 1 : 0)}
                  className="px-3 py-10 text-center text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              t.rows.map((row, i) => {
                const id = t.rowId(row, t.pageStartIndex + i);
                const isSelected = t.selected.has(id);
                return (
                  <tr
                    key={id}
                    data-state={isSelected ? "selected" : undefined}
                    className={cn(
                      "border-b transition-colors last:border-b-0 hover:bg-surface-2/60",
                      isSelected && "bg-accent-soft/40",
                    )}
                  >
                    {selectable && (
                      <td className="px-3 py-2.5">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => select(() => t.toggleRow(id))}
                          aria-label={`Select row ${i + 1}`}
                        />
                      </td>
                    )}
                    {t.visibleColumns.map((c) => (
                      <td key={c.key} className={cn("px-3 py-2.5", alignClass[c.align ?? "left"])}>
                        {c.render ? c.render(row) : String(row[c.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">
          {t.totalRows} row{t.totalRows === 1 ? "" : "s"}
          {t.search && ` (filtered)`}
        </p>
        <Pagination page={t.page} pageCount={t.pageCount} onPageChange={t.setPage} />
      </div>
    </div>
  );
}
