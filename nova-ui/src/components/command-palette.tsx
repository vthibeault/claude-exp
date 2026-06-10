import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DependencyList,
  type ReactNode,
} from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CommandAction = {
  id: string;
  label: string;
  keywords?: string[];
  group?: string;
  icon?: ReactNode;
  shortcut?: string;
  onSelect: () => void;
  /** Internal — set by the fuzzy scorer. */
  score?: number;
};

// ---------------------------------------------------------------------------
// Fuzzy scorer (~50 lines, no deps)
// ---------------------------------------------------------------------------

function score(query: string, target: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  let qi = 0;
  let consecutive = 0;
  let totalScore = 0;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      // Start-of-word bonus
      const isWordStart = ti === 0 || /[\s\-_/.]/.test(t[ti - 1]);
      consecutive++;
      totalScore += 1 + consecutive * 0.5 + (isWordStart ? 2 : 0);
      qi++;
    } else {
      consecutive = 0;
    }
  }

  // All query chars must be found
  return qi === q.length ? totalScore : 0;
}

function scoreAction(query: string, action: CommandAction): number {
  if (!query) return 1;
  const labelScore = score(query, action.label);
  const kwScore = (action.keywords ?? []).reduce(
    (best, kw) => Math.max(best, score(query, kw)),
    0,
  );
  return Math.max(labelScore, kwScore);
}

/** Returns ranges [start, end) of matched chars in `label` for the given query. */
function matchRanges(query: string, label: string): Array<[number, number]> {
  if (!query) return [];
  const q = query.toLowerCase();
  const t = label.toLowerCase();
  const ranges: Array<[number, number]> = [];
  let qi = 0;
  let runStart = -1;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      if (runStart === -1) runStart = ti;
      qi++;
      if (qi === q.length || t[ti + 1] !== q[qi]) {
        ranges.push([runStart, ti + 1]);
        runStart = -1;
      }
    } else if (runStart !== -1) {
      ranges.push([runStart, ti]);
      runStart = -1;
    }
  }

  return ranges;
}

function HighlightedLabel({ label, query }: { label: string; query: string }) {
  const ranges = matchRanges(query, label);
  if (ranges.length === 0) return <>{label}</>;

  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const [start, end] of ranges) {
    if (cursor < start) parts.push(label.slice(cursor, start));
    parts.push(
      <strong key={start} className="font-semibold">
        {label.slice(start, end)}
      </strong>,
    );
    cursor = end;
  }

  if (cursor < label.length) parts.push(label.slice(cursor));
  return <>{parts}</>;
}

// ---------------------------------------------------------------------------
// Recent actions (localStorage)
// ---------------------------------------------------------------------------

const RECENT_KEY = "nova-cmd-recent";
const MAX_RECENT = 5;

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecent(id: string) {
  const prev = loadRecent().filter((x) => x !== id);
  localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...prev].slice(0, MAX_RECENT)));
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface CommandContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  namespaces: Map<string, CommandAction[]>;
  registerNamespace: (ns: string, cmds: CommandAction[]) => void;
  unregisterNamespace: (ns: string) => void;
}

const CommandContext = createContext<CommandContextValue | null>(null);

// ---------------------------------------------------------------------------
// CommandProvider
// ---------------------------------------------------------------------------

export function CommandProvider({ children }: { children: ReactNode }) {
  const [open, setOpenRaw] = useState(false);
  const [namespaces, setNamespaces] = useState<Map<string, CommandAction[]>>(
    () => new Map(),
  );

  const registerNamespace = useCallback((ns: string, cmds: CommandAction[]) => {
    setNamespaces((prev) => new Map(prev).set(ns, cmds));
  }, []);

  const unregisterNamespace = useCallback((ns: string) => {
    setNamespaces((prev) => {
      const next = new Map(prev);
      next.delete(ns);
      return next;
    });
  }, []);

  const setOpen = useCallback((v: boolean) => setOpenRaw(v), []);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpenRaw((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <CommandContext
      value={{ open, setOpen, namespaces, registerNamespace, unregisterNamespace }}
    >
      {children}
      <CommandPalette />
    </CommandContext>
  );
}

// ---------------------------------------------------------------------------
// useCommand hook
// ---------------------------------------------------------------------------

export function useCommand() {
  const ctx = use(CommandContext);
  if (!ctx) throw new Error("useCommand must be used inside <CommandProvider>");

  const commands = useMemo(() => {
    const result: CommandAction[] = [];
    // All non-global namespaces first, then "global" last
    for (const [ns, cmds] of ctx.namespaces) {
      if (ns !== "global") result.push(...cmds);
    }
    const globalCmds = ctx.namespaces.get("global");
    if (globalCmds) result.push(...globalCmds);
    return result;
  }, [ctx.namespaces]);

  return { open: ctx.open, setOpen: ctx.setOpen, commands };
}

// ---------------------------------------------------------------------------
// useRegisterCommands hook
// ---------------------------------------------------------------------------

export function useRegisterCommands(
  namespace: string,
  commands: CommandAction[],
  deps: DependencyList = [],
) {
  const ctx = use(CommandContext);
  if (!ctx) throw new Error("useRegisterCommands must be used inside <CommandProvider>");

  const { registerNamespace, unregisterNamespace } = ctx;

  useEffect(() => {
    registerNamespace(namespace, commands);
    return () => unregisterNamespace(namespace);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace, registerNamespace, unregisterNamespace, ...deps]);
}

// ---------------------------------------------------------------------------
// CommandPalette component
// ---------------------------------------------------------------------------

export function CommandPalette() {
  const ctx = use(CommandContext);
  if (!ctx) return null;

  const { open, setOpen, namespaces } = ctx;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  // Open / close the native dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      // Reset state on open
      setQuery("");
      setActiveIndex(0);
    } else if (!open && dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  }, [open]);

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (open) {
      // Small delay so the dialog's focus trap doesn't fight us
      const id = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(id);
    }
  }, [open]);

  // Flatten all commands
  const allCommands = useMemo(() => {
    const result: CommandAction[] = [];
    for (const [ns, cmds] of namespaces) {
      if (ns !== "global") result.push(...cmds);
    }
    const globalCmds = namespaces.get("global");
    if (globalCmds) result.push(...globalCmds);
    return result;
  }, [namespaces]);

  // Recent IDs
  const [recentIds, setRecentIds] = useState<string[]>(() => loadRecent());

  // Compute displayed items
  const displayItems = useMemo(() => {
    if (!query.trim()) {
      // Show recents first, then all others
      const recentActions: CommandAction[] = [];
      const recentSet = new Set(recentIds);
      for (const id of recentIds) {
        const found = allCommands.find((c) => c.id === id);
        if (found) recentActions.push({ ...found, group: "Recent" });
      }
      const others = allCommands.filter((c) => !recentSet.has(c.id));
      return [...recentActions, ...others];
    }

    // Fuzzy filter + score
    const q = query.trim();
    return allCommands
      .map((cmd) => ({ ...cmd, score: scoreAction(q, cmd) }))
      .filter((cmd) => (cmd.score ?? 0) > 0)
      .sort((a, b) => {
        // Primary: group equality (keep groups stable), secondary: score desc
        if (a.group !== b.group) return 0;
        return (b.score ?? 0) - (a.score ?? 0);
      });
  }, [query, allCommands, recentIds]);

  // Group the display items
  const grouped = useMemo(() => {
    const groups: Array<{ label: string | undefined; items: CommandAction[] }> = [];
    for (const cmd of displayItems) {
      const last = groups[groups.length - 1];
      if (!last || last.label !== cmd.group) {
        groups.push({ label: cmd.group, items: [cmd] });
      } else {
        last.items.push(cmd);
      }
    }
    return groups;
  }, [displayItems]);

  // Flat ordered list for keyboard nav
  const flatItems = displayItems;

  // Clamp activeIndex when list changes
  useEffect(() => {
    setActiveIndex((prev) => Math.min(prev, Math.max(0, flatItems.length - 1)));
  }, [flatItems.length]);

  const selectItem = useCallback(
    (cmd: CommandAction) => {
      saveRecent(cmd.id);
      setRecentIds(loadRecent());
      setOpen(false);
      // Run after dialog close so focus isn't lost mid-transition
      setTimeout(() => cmd.onSelect(), 0);
    },
    [setOpen],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const active = flatItems[activeIndex];
      if (active) selectItem(active);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.querySelector(`[data-index="${activeIndex}"]`);
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const activeId = flatItems[activeIndex]?.id ?? undefined;

  return (
    <dialog
      ref={dialogRef}
      onClose={() => setOpen(false)}
      onClick={(e) => {
        // Clicks on the backdrop (which land on the <dialog>) close it
        if (e.target === dialogRef.current) setOpen(false);
      }}
      className={cn(
        "nova-dialog",
        "fixed inset-0 m-auto w-[640px] max-h-[480px]",
        "bg-surface text-foreground border border-border rounded-xl shadow-2xl",
        "flex flex-col overflow-hidden p-0",
        "backdrop:bg-transparent",
      )}
      aria-label="Command palette"
      aria-modal="true"
    >
      {/* Search input row */}
      <div className="flex items-center gap-3 px-4 border-b border-border shrink-0">
        <Search className="size-4 text-muted shrink-0" aria-hidden />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls="nova-cmd-listbox"
          aria-activedescendant={activeId ? `nova-cmd-opt-${activeId}` : undefined}
          placeholder="Search commands…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex-1 bg-transparent py-3 text-base text-foreground",
            "placeholder:text-muted outline-none",
          )}
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setActiveIndex(0);
              inputRef.current?.focus();
            }}
            className="shrink-0 text-muted hover:text-foreground transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Results */}
      <ul
        ref={listRef}
        id="nova-cmd-listbox"
        role="listbox"
        aria-label="Commands"
        className="flex-1 overflow-y-auto p-1.5"
      >
        {flatItems.length === 0 && (
          <li className="px-3 py-8 text-center text-sm text-muted select-none">
            No results
          </li>
        )}

        {grouped.map((group) => (
          <li key={group.label ?? "__ungrouped"} role="presentation">
            {group.label && (
              <div
                role="presentation"
                className="sticky top-0 px-3 py-1 text-xs font-semibold text-muted uppercase tracking-wider bg-surface z-10"
              >
                {group.label}
              </div>
            )}
            <ul role="presentation">
              {group.items.map((cmd) => {
                const globalIdx = flatItems.indexOf(cmd);
                const isActive = globalIdx === activeIndex;
                return (
                  <li
                    key={cmd.id}
                    id={`nova-cmd-opt-${cmd.id}`}
                    role="option"
                    aria-selected={isActive}
                    data-index={globalIdx}
                    onClick={() => selectItem(cmd)}
                    onMouseEnter={() => setActiveIndex(globalIdx)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer select-none",
                      "text-sm transition-colors",
                      isActive
                        ? "bg-accent/10 text-accent"
                        : "text-foreground hover:bg-surface-2",
                    )}
                  >
                    {cmd.icon && (
                      <span
                        className={cn(
                          "shrink-0 size-4 flex items-center justify-center",
                          isActive ? "text-accent" : "text-muted",
                        )}
                        aria-hidden
                      >
                        {cmd.icon}
                      </span>
                    )}
                    <span className="flex-1 truncate">
                      <HighlightedLabel label={cmd.label} query={query} />
                    </span>
                    {cmd.shortcut && (
                      <kbd
                        className={cn(
                          "shrink-0 rounded px-1.5 py-0.5 text-xs font-mono",
                          "border",
                          isActive
                            ? "border-accent/30 text-accent bg-accent/5"
                            : "border-border text-muted bg-surface-2",
                        )}
                      >
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </dialog>
  );
}
