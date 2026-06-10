import { useCallback, useId, useRef, useState, type KeyboardEvent } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Checkbox } from "./checkbox";

export interface TreeNode<T = unknown> {
  id: string;
  label: string;
  icon?: React.ReactNode;
  data?: T;
  children?: TreeNode<T>[];
}

export interface TreeProps<T = unknown> {
  nodes: TreeNode<T>[];
  selectable?: boolean;
  selected?: Set<string>;
  onSelectionChange?: (selected: Set<string>) => void;
  defaultExpanded?: Set<string>;
  onNodeClick?: (node: TreeNode<T>) => void;
  className?: string;
}

function getAllDescendantIds(node: TreeNode): string[] {
  if (!node.children?.length) return [];
  return node.children.flatMap((c) => [c.id, ...getAllDescendantIds(c)]);
}

function getVisibleNodes<T>(nodes: TreeNode<T>[], expanded: Set<string>): TreeNode<T>[] {
  const result: TreeNode<T>[] = [];
  for (const node of nodes) {
    result.push(node);
    if (expanded.has(node.id) && node.children?.length) {
      result.push(...getVisibleNodes(node.children, expanded));
    }
  }
  return result;
}

function getNodeParentMap<T>(nodes: TreeNode<T>[], parentId: string | null = null, map = new Map<string, string | null>()) {
  for (const node of nodes) {
    map.set(node.id, parentId);
    if (node.children?.length) getNodeParentMap(node.children, node.id, map);
  }
  return map;
}

interface TreeItemProps<T> {
  node: TreeNode<T>;
  level: number;
  expanded: Set<string>;
  selected: Set<string>;
  selectable: boolean;
  focusedId: string | null;
  itemId: string;
  onToggleExpand: (id: string) => void;
  onToggleSelect: (node: TreeNode<T>) => void;
  onNodeClick?: (node: TreeNode<T>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLLIElement>, node: TreeNode<T>) => void;
  onFocus: (id: string) => void;
}

function getSelectionState(node: TreeNode, selected: Set<string>): "checked" | "unchecked" | "indeterminate" {
  if (!node.children?.length) return selected.has(node.id) ? "checked" : "unchecked";
  const descendants = getAllDescendantIds(node);
  const selectedCount = descendants.filter((id) => selected.has(id)).length;
  if (selectedCount === 0) return "unchecked";
  if (selectedCount === descendants.length) return "checked";
  return "indeterminate";
}

function TreeItem<T>({
  node, level, expanded, selected, selectable, focusedId, itemId,
  onToggleExpand, onToggleSelect, onNodeClick, onKeyDown, onFocus,
}: TreeItemProps<T>) {
  const hasChildren = !!node.children?.length;
  const isExpanded = expanded.has(node.id);
  const selState = selectable ? getSelectionState(node, selected) : "unchecked";
  const ref = useRef<HTMLLIElement>(null);

  return (
    <li
      ref={ref}
      id={itemId}
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={selectable ? selState === "checked" : selected.has(node.id)}
      aria-level={level}
      tabIndex={focusedId === node.id ? 0 : -1}
      onFocus={() => onFocus(node.id)}
      onKeyDown={(e) => onKeyDown(e, node)}
      className="outline-none"
    >
      <div
        className={cn(
          "flex items-center gap-1 rounded-nova-sm px-1 py-0.5 text-sm cursor-pointer",
          "hover:bg-surface-2 focus-within:bg-surface-2",
          selected.has(node.id) && !selectable && "bg-primary/10 text-primary",
        )}
        style={{ paddingLeft: `${level * 1.25}rem` }}
        onClick={() => onNodeClick?.(node)}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={(e) => { e.stopPropagation(); onToggleExpand(node.id); }}
          className={cn(
            "shrink-0 rounded p-0.5 transition-transform duration-150",
            hasChildren ? "hover:bg-surface-2" : "invisible",
          )}
        >
          <ChevronRight
            className={cn("size-3.5 text-foreground-muted transition-transform duration-150", isExpanded && "rotate-90")}
          />
        </button>

        {selectable && (
          <span onClick={(e) => { e.stopPropagation(); onToggleSelect(node); }}>
            <Checkbox
              tabIndex={-1}
              checked={selState === "checked"}
              ref={(el) => {
                if (el) (el as HTMLInputElement & { indeterminate: boolean }).indeterminate = selState === "indeterminate";
              }}
              onChange={() => {}}
              aria-label={node.label}
            />
          </span>
        )}

        {node.icon && <span className="shrink-0 [&_svg]:size-4">{node.icon}</span>}
        <span className="flex-1 truncate text-foreground">{node.label}</span>
      </div>

      {hasChildren && isExpanded && (
        <ul role="group">
          {node.children!.map((child) => (
            <TreeItemConnected
              key={child.id}
              node={child}
              level={level + 1}
              expanded={expanded}
              selected={selected}
              selectable={selectable}
              focusedId={focusedId}
              onToggleExpand={onToggleExpand}
              onToggleSelect={onToggleSelect}
              onNodeClick={onNodeClick}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// Wrapper that generates a stable itemId per child node
function TreeItemConnected<T>(props: Omit<TreeItemProps<T>, "itemId">) {
  const itemId = useId();
  return <TreeItem {...props} itemId={itemId} />;
}

export function Tree<T = unknown>({
  nodes,
  selectable = false,
  selected: controlledSelected,
  onSelectionChange,
  defaultExpanded = new Set(),
  onNodeClick,
  className,
}: TreeProps<T>) {
  const [expanded, setExpanded] = useState<Set<string>>(defaultExpanded);
  const [internalSelected, setInternalSelected] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState<string | null>(nodes[0]?.id ?? null);
  const treeRef = useRef<HTMLUListElement>(null);

  const selected = controlledSelected ?? internalSelected;

  const setSelected = useCallback(
    (next: Set<string>) => {
      if (!controlledSelected) setInternalSelected(next);
      onSelectionChange?.(next);
    },
    [controlledSelected, onSelectionChange],
  );

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelect = useCallback(
    (node: TreeNode<T>) => {
      const next = new Set(selected);
      const descendants = getAllDescendantIds(node as TreeNode);
      const state = getSelectionState(node as TreeNode, selected);
      if (state === "checked") {
        next.delete(node.id);
        descendants.forEach((id) => next.delete(id));
      } else {
        next.add(node.id);
        descendants.forEach((id) => next.add(id));
      }
      setSelected(next);
    },
    [selected, setSelected],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLLIElement>, node: TreeNode<T>) => {
      const visible = getVisibleNodes(nodes, expanded);
      const idx = visible.findIndex((n) => n.id === node.id);
      const parentMap = getNodeParentMap(nodes);

      const moveTo = (targetId: string) => {
        setFocusedId(targetId);
        requestAnimationFrame(() => {
          treeRef.current?.querySelector<HTMLElement>(`[id="${targetId}"]`)?.focus();
        });
      };

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (idx < visible.length - 1) moveTo(visible[idx + 1].id);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (idx > 0) moveTo(visible[idx - 1].id);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (node.children?.length) {
          if (!expanded.has(node.id)) {
            setExpanded((prev) => new Set([...prev, node.id]));
          } else {
            moveTo(node.children[0].id);
          }
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (expanded.has(node.id) && node.children?.length) {
          setExpanded((prev) => { const n = new Set(prev); n.delete(node.id); return n; });
        } else {
          const parentId = parentMap.get(node.id);
          if (parentId) moveTo(parentId);
        }
      } else if (e.key === "Home") {
        e.preventDefault();
        if (visible[0]) moveTo(visible[0].id);
      } else if (e.key === "End") {
        e.preventDefault();
        if (visible[visible.length - 1]) moveTo(visible[visible.length - 1].id);
      } else if (e.key === " " && selectable) {
        e.preventDefault();
        toggleSelect(node);
      } else if (e.key === "Enter") {
        e.preventDefault();
        onNodeClick?.(node);
      }
    },
    [nodes, expanded, selectable, toggleSelect, onNodeClick],
  );

  return (
    <ul ref={treeRef} role="tree" className={cn("text-sm", className)}>
      {nodes.map((node) => (
        <TreeItemConnected
          key={node.id}
          node={node}
          level={1}
          expanded={expanded}
          selected={selected}
          selectable={selectable}
          focusedId={focusedId}
          onToggleExpand={toggleExpand}
          onToggleSelect={toggleSelect}
          onNodeClick={onNodeClick}
          onKeyDown={onKeyDown}
          onFocus={setFocusedId}
        />
      ))}
    </ul>
  );
}
