import {
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

export type DataGridColumnType = "text" | "number" | "select";

export interface DataGridColumn<T> {
  key: keyof T & string;
  header: ReactNode;
  type?: DataGridColumnType;
  /** Options for type="select". */
  options?: string[];
  editable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (row: T) => ReactNode;
}

export interface DataGridProps<T> {
  data: T[];
  columns: Array<DataGridColumn<T>>;
  /** Called with the updated row when a cell edit is committed. */
  onRowChange?: (row: T, rowIndex: number, key: keyof T & string) => void;
  className?: string;
}

const alignClass = { left: "text-left", center: "text-center", right: "text-right" };

/**
 * Spreadsheet-style editable grid:
 * - Arrow keys move the focused cell (roving tabindex, role="grid")
 * - Enter or F2 starts editing; Enter commits; Esc cancels
 * - Typing a character on a text/number cell starts editing immediately
 */
export function DataGrid<T extends object>({
  data,
  columns,
  onRowChange,
  className,
}: DataGridProps<T>) {
  const [focus, setFocus] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const [editing, setEditing] = useState<{ r: number; c: number; seed?: string } | null>(null);
  const gridRef = useRef<HTMLTableElement>(null);

  const focusCell = (r: number, c: number) => {
    const clamped = {
      r: Math.max(0, Math.min(data.length - 1, r)),
      c: Math.max(0, Math.min(columns.length - 1, c)),
    };
    setFocus(clamped);
    requestAnimationFrame(() => {
      gridRef.current
        ?.querySelector<HTMLElement>(`[data-cell="${clamped.r}-${clamped.c}"]`)
        ?.focus();
    });
  };

  const commit = (r: number, c: number, raw: string) => {
    const col = columns[c];
    const row = data[r];
    const value = col.type === "number" ? (raw === "" ? null : Number(raw)) : raw;
    const next = { ...row, [col.key]: value } as T;
    setEditing(null);
    onRowChange?.(next, r, col.key);
    focusCell(r, c);
  };

  const onCellKeyDown = (e: KeyboardEvent<HTMLTableCellElement>, r: number, c: number) => {
    if (editing) return;
    const col = columns[c];

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        focusCell(r - 1, c);
        return;
      case "ArrowDown":
        e.preventDefault();
        focusCell(r + 1, c);
        return;
      case "ArrowLeft":
        e.preventDefault();
        focusCell(r, c - 1);
        return;
      case "ArrowRight":
        e.preventDefault();
        focusCell(r, c + 1);
        return;
      case "Home":
        e.preventDefault();
        focusCell(r, 0);
        return;
      case "End":
        e.preventDefault();
        focusCell(r, columns.length - 1);
        return;
      case "Enter":
      case "F2":
        if (col.editable) {
          e.preventDefault();
          setEditing({ r, c });
        }
        return;
    }

    // Type-to-edit: a printable character replaces the cell content.
    if (
      col.editable &&
      col.type !== "select" &&
      e.key.length === 1 &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      e.preventDefault();
      setEditing({ r, c, seed: e.key });
    }
  };

  return (
    <div className={cn("overflow-x-auto rounded-nova-lg border bg-surface", className)}>
      <table ref={gridRef} role="grid" aria-rowcount={data.length} className="w-full text-sm">
        <thead>
          <tr className="border-b bg-surface-2/50">
            {columns.map((col) => (
              <th
                key={col.key}
                role="columnheader"
                style={col.width ? { width: col.width } : undefined}
                className={cn("px-3 py-2.5 font-medium text-muted", alignClass[col.align ?? "left"])}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, r) => (
            <tr key={r} className="border-b last:border-b-0">
              {columns.map((col, c) => {
                const isFocused = focus.r === r && focus.c === c;
                const isEditing = editing?.r === r && editing?.c === c;
                const rawValue = row[col.key];

                return (
                  <td
                    key={col.key}
                    role="gridcell"
                    data-cell={`${r}-${c}`}
                    tabIndex={isFocused ? 0 : -1}
                    aria-readonly={!col.editable}
                    onFocus={() => setFocus({ r, c })}
                    onKeyDown={(e) => onCellKeyDown(e, r, c)}
                    onDoubleClick={() => col.editable && setEditing({ r, c })}
                    className={cn(
                      "relative px-3 py-2 outline-none transition-shadow",
                      alignClass[col.align ?? "left"],
                      "focus:ring-2 focus:ring-inset focus:ring-ring",
                      col.editable && "cursor-cell",
                      isEditing && "p-0",
                    )}
                  >
                    {isEditing ? (
                      col.type === "select" ? (
                        <select
                          autoFocus
                          defaultValue={String(rawValue ?? "")}
                          onChange={(e) => commit(r, c, e.target.value)}
                          onBlur={(e) => commit(r, c, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              e.stopPropagation();
                              setEditing(null);
                              focusCell(r, c);
                            }
                          }}
                          className="size-full bg-accent-soft/30 px-3 py-2 text-sm outline-none"
                        >
                          {col.options?.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          autoFocus
                          type={col.type === "number" ? "number" : "text"}
                          defaultValue={editing.seed ?? String(rawValue ?? "")}
                          onFocus={(e) => {
                            if (editing.seed === undefined) e.target.select();
                          }}
                          onBlur={(e) => commit(r, c, e.target.value)}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter") commit(r, c, e.currentTarget.value);
                            if (e.key === "Escape") {
                              setEditing(null);
                              focusCell(r, c);
                            }
                          }}
                          className={cn(
                            "size-full bg-accent-soft/30 px-3 py-2 text-sm outline-none",
                            alignClass[col.align ?? "left"],
                          )}
                        />
                      )
                    ) : (
                      (col.render ? col.render(row) : String(rawValue ?? "")) || " "
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
