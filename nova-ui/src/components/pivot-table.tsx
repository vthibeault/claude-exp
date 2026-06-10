import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  AGGREGATION_LABELS,
  buildPivot,
  leafCount,
  type PivotAggregation,
  type PivotConfig,
  type PivotNode,
  type PivotValueConfig,
} from "@/lib/pivot";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export interface PivotField {
  key: string;
  label?: string;
  /** Offered in the Values zone (defaults to true for numeric-looking fields). */
  numeric?: boolean;
}

export interface PivotTableProps<T> {
  data: T[];
  fields: PivotField[];
  defaultConfig: PivotConfig;
  onConfigChange?: (config: PivotConfig) => void;
  /** Format a cell value; receives the value config for per-measure formatting. */
  format?: (value: number, valueConfig: PivotValueConfig) => string;
  /** Show the Rows/Columns/Values configuration bar. */
  configurable?: boolean;
  className?: string;
}

const defaultNumberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

const AGGREGATIONS: PivotAggregation[] = ["sum", "avg", "count", "min", "max"];

function FieldChip({
  children,
  onRemove,
  removeLabel,
}: {
  children: ReactNode;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft py-0.5 pl-2.5 pr-1 text-xs font-medium text-accent-soft-foreground">
      {children}
      <button
        type="button"
        aria-label={removeLabel}
        onClick={onRemove}
        className="rounded-full p-0.5 outline-none transition-colors hover:bg-accent/20 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

function AddFieldMenu({
  label,
  options,
  onAdd,
}: {
  label: string;
  options: PivotField[];
  onAdd: (key: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <DropdownMenu align="start">
      <DropdownMenuTrigger>
        <button
          type="button"
          aria-label={label}
          className="inline-flex size-5 items-center justify-center rounded-full border border-dashed border-border-strong text-muted outline-none transition-colors hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {options.map((f) => (
          <DropdownMenuItem key={f.key} onSelect={() => onAdd(f.key)}>
            {f.label ?? f.key}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Pivot table with configurable row/column/value fields, collapsible
 * row groups, subtotals on every group level, and grand totals.
 * Group rows display their subtree's aggregate (the subtotal), so a
 * collapsed group still reads correctly.
 */
export function PivotTable<T>({
  data,
  fields,
  defaultConfig,
  onConfigChange,
  format,
  configurable = true,
  className,
}: PivotTableProps<T>) {
  const [config, setConfig] = useState<PivotConfig>(defaultConfig);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const pivot = useMemo(() => buildPivot(data, config), [data, config]);
  const { rows, columns, values } = config;

  const fieldLabel = (key: string) => fields.find((f) => f.key === key)?.label ?? key;
  const valueLabel = (v: PivotValueConfig) =>
    v.label ?? `${AGGREGATION_LABELS[v.aggregation]} of ${fieldLabel(v.key)}`;
  const fmt = (n: number, v: PivotValueConfig) =>
    format ? format(n, v) : defaultNumberFormat.format(n);

  const update = (next: PivotConfig) => {
    setConfig(next);
    setCollapsed(new Set());
    onConfigChange?.(next);
  };

  const usedAsDimension = new Set([...rows, ...columns]);
  const dimensionOptions = fields.filter((f) => !usedAsDimension.has(f.key));
  const valueOptions = fields.filter((f) => f.numeric !== false);

  const toggleCollapse = (path: string[]) => {
    const key = path.join("");
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ----- header geometry -------------------------------------------------
  const hasColumnDim = columns.length > 0;
  const valueHeaderRow = values.length > 1 || !hasColumnDim;
  const headerRowCount = columns.length + (valueHeaderRow ? 1 : 0) || 1;

  const columnLevels: PivotNode[][] = [];
  {
    let level = pivot.columnTree;
    while (level.length > 0) {
      columnLevels.push(level);
      level = level.flatMap((n) => n.children);
    }
  }

  // ----- body rows --------------------------------------------------------
  const renderValueCells = (rowPath: string[], emphasize: boolean) => (
    <>
      {pivot.columnLeaves.map((colPath) =>
        values.map((v, vi) => {
          const n = pivot.getValue(rowPath, colPath, v);
          return (
            <td
              key={`${colPath.join("|")}-${vi}`}
              className={cn("px-3 py-2 text-right tabular-nums", emphasize && "font-medium")}
            >
              {n == null ? <span className="text-subtle">–</span> : fmt(n, v)}
            </td>
          );
        }),
      )}
      {hasColumnDim &&
        values.map((v, vi) => {
          const n = pivot.getValue(rowPath, [], v);
          return (
            <td
              key={`total-${vi}`}
              className={cn(
                "border-l bg-surface-2/40 px-3 py-2 text-right font-medium tabular-nums",
              )}
            >
              {n == null ? <span className="text-subtle">–</span> : fmt(n, v)}
            </td>
          );
        })}
    </>
  );

  const bodyRows: ReactNode[] = [];
  const walkRows = (nodes: PivotNode[], level: number) => {
    for (const node of nodes) {
      const key = node.path.join("");
      const isGroup = node.children.length > 0;
      const isCollapsed = collapsed.has(key);

      bodyRows.push(
        <tr
          key={key}
          data-level={level}
          className={cn(
            "border-b transition-colors last:border-b-0",
            isGroup ? "bg-surface-2/50" : "hover:bg-surface-2/40",
          )}
        >
          <th
            scope="row"
            className={cn(
              "sticky left-0 z-10 whitespace-nowrap px-3 py-2 text-left font-normal",
              isGroup ? "bg-surface-2 font-medium" : "bg-surface",
            )}
            style={{ paddingLeft: `${0.75 + level * 1.1}rem` }}
          >
            {isGroup ? (
              <button
                type="button"
                onClick={() => toggleCollapse(node.path)}
                aria-expanded={!isCollapsed}
                className="inline-flex items-center gap-1 rounded-nova-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {isCollapsed ? (
                  <ChevronRight className="size-3.5 text-muted" />
                ) : (
                  <ChevronDown className="size-3.5 text-muted" />
                )}
                {node.label}
              </button>
            ) : (
              node.label
            )}
          </th>
          {renderValueCells(node.path, isGroup)}
        </tr>,
      );

      if (isGroup && !isCollapsed) walkRows(node.children, level + 1);
    }
  };
  walkRows(pivot.rowTree, 0);

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      {configurable && (
        <div className="flex flex-col gap-2 rounded-nova-lg border bg-surface p-3 text-sm">
          {(
            [
              ["Rows", rows, "rows"],
              ["Columns", columns, "columns"],
            ] as const
          ).map(([zoneLabel, zoneKeys, zoneProp]) => (
            <div key={zoneProp} className="flex flex-wrap items-center gap-1.5">
              <span className="w-16 shrink-0 text-xs font-medium uppercase tracking-wide text-subtle">
                {zoneLabel}
              </span>
              {zoneKeys.map((k) => (
                <FieldChip
                  key={k}
                  removeLabel={`Remove ${fieldLabel(k)} from ${zoneLabel.toLowerCase()}`}
                  onRemove={() => update({ ...config, [zoneProp]: zoneKeys.filter((x) => x !== k) })}
                >
                  {fieldLabel(k)}
                </FieldChip>
              ))}
              <AddFieldMenu
                label={`Add field to ${zoneLabel.toLowerCase()}`}
                options={dimensionOptions}
                onAdd={(k) => update({ ...config, [zoneProp]: [...zoneKeys, k] })}
              />
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="w-16 shrink-0 text-xs font-medium uppercase tracking-wide text-subtle">
              Values
            </span>
            {values.map((v, i) => (
              <span
                key={`${v.key}-${v.aggregation}-${i}`}
                className="inline-flex items-center gap-1 rounded-full bg-accent-soft py-0.5 pl-1 pr-1 text-xs font-medium text-accent-soft-foreground"
              >
                <DropdownMenu align="start">
                  <DropdownMenuTrigger>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 outline-none transition-colors hover:bg-accent/15 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {valueLabel(v)}
                      <ChevronDown className="size-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Aggregation</DropdownMenuLabel>
                    {AGGREGATIONS.map((agg) => (
                      <DropdownMenuItem
                        key={agg}
                        onSelect={() =>
                          update({
                            ...config,
                            values: values.map((x, xi) =>
                              xi === i ? { ...x, aggregation: agg } : x,
                            ),
                          })
                        }
                      >
                        {AGGREGATION_LABELS[agg]}
                        {agg === v.aggregation && <span className="ml-auto text-accent">✓</span>}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Field</DropdownMenuLabel>
                    {valueOptions.map((f) => (
                      <DropdownMenuItem
                        key={f.key}
                        onSelect={() =>
                          update({
                            ...config,
                            values: values.map((x, xi) => (xi === i ? { ...x, key: f.key } : x)),
                          })
                        }
                      >
                        {f.label ?? f.key}
                        {f.key === v.key && <span className="ml-auto text-accent">✓</span>}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {values.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Remove ${valueLabel(v)}`}
                    onClick={() => update({ ...config, values: values.filter((_, xi) => xi !== i) })}
                    className="rounded-full p-0.5 outline-none transition-colors hover:bg-accent/20 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </span>
            ))}
            <AddFieldMenu
              label="Add value"
              options={valueOptions}
              onAdd={(k) => update({ ...config, values: [...values, { key: k, aggregation: "sum" }] })}
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-nova-lg border bg-surface">
        <table className="w-full text-sm">
          <thead>
            {columnLevels.length > 0 ? (
              columnLevels.map((levelNodes, li) => (
                <tr key={li} className="border-b bg-surface-2/50">
                  {li === 0 && (
                    <th
                      rowSpan={headerRowCount}
                      className="sticky left-0 z-20 min-w-44 bg-surface-2 px-3 py-2 text-left align-bottom font-medium text-muted"
                    >
                      {rows.map(fieldLabel).join(" / ") || ""}
                    </th>
                  )}
                  {levelNodes.map((node) => (
                    <th
                      key={node.path.join("|")}
                      colSpan={leafCount(node) * values.length}
                      className="border-l px-3 py-2 text-center font-medium text-muted first:border-l-0"
                    >
                      {node.label}
                    </th>
                  ))}
                  {li === 0 && hasColumnDim && (
                    <th
                      rowSpan={columns.length}
                      colSpan={values.length}
                      className="border-l bg-surface-2 px-3 py-2 text-center align-bottom font-semibold text-foreground"
                    >
                      Total
                    </th>
                  )}
                </tr>
              ))
            ) : (
              <tr className="border-b bg-surface-2/50">
                <th className="sticky left-0 z-20 min-w-44 bg-surface-2 px-3 py-2 text-left font-medium text-muted">
                  {rows.map(fieldLabel).join(" / ") || ""}
                </th>
                {values.map((v, vi) => (
                  <th key={vi} className="border-l px-3 py-2 text-right font-medium text-muted first:border-l-0">
                    {valueLabel(v)}
                  </th>
                ))}
              </tr>
            )}

            {valueHeaderRow && columnLevels.length > 0 && (
              <tr className="border-b bg-surface-2/30">
                {pivot.columnLeaves.map((colPath) =>
                  values.map((v, vi) => (
                    <th
                      key={`${colPath.join("|")}-${vi}`}
                      className="whitespace-nowrap border-l px-3 py-1.5 text-right text-xs font-normal text-subtle first:border-l-0"
                    >
                      {valueLabel(v)}
                    </th>
                  )),
                )}
                {values.map((v, vi) => (
                  <th
                    key={`t-${vi}`}
                    className="whitespace-nowrap border-l bg-surface-2/60 px-3 py-1.5 text-right text-xs font-normal text-subtle"
                  >
                    {valueLabel(v)}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {bodyRows.length > 0 ? (
              bodyRows
            ) : (
              <tr>
                <td className="px-3 py-8 text-center text-muted" colSpan={99}>
                  Add at least one row field.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 bg-surface-2/70 font-semibold">
              <th scope="row" className="sticky left-0 z-10 bg-surface-2 px-3 py-2 text-left">
                Total
              </th>
              {pivot.columnLeaves.map((colPath) =>
                values.map((v, vi) => {
                  const n = pivot.getValue([], colPath, v);
                  return (
                    <td key={`${colPath.join("|")}-${vi}`} className="px-3 py-2 text-right tabular-nums">
                      {n == null ? <span className="text-subtle">–</span> : fmt(n, v)}
                    </td>
                  );
                }),
              )}
              {hasColumnDim &&
                values.map((v, vi) => {
                  const n = pivot.getValue([], [], v);
                  return (
                    <td key={`g-${vi}`} className="border-l bg-surface-2 px-3 py-2 text-right tabular-nums">
                      {n == null ? <span className="text-subtle">–</span> : fmt(n, v)}
                    </td>
                  );
                })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
