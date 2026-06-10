import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { showPopover, hidePopover } from "@/lib/use-anchor-position";

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value?: string[];
  onChange?: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  maxDisplayed?: number;
  disabled?: boolean;
  className?: string;
}

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = "Select items…",
  searchPlaceholder = "Search…",
  maxDisplayed = 3,
  disabled = false,
  className,
}: MultiSelectProps) {
  const baseId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  // Keep active index in bounds
  useEffect(() => {
    if (active >= filtered.length) setActive(Math.max(0, filtered.length - 1));
  }, [filtered.length, active]);

  const openDropdown = () => {
    if (disabled) return;
    setOpen(true);
    showPopover(popoverRef.current);
    // Focus search input on desktop only — on touch, keyboard would occlude the list
    if (window.matchMedia("(pointer: fine)").matches) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  };

  const closeDropdown = () => {
    setOpen(false);
    setQuery("");
    hidePopover(popoverRef.current);
  };

  const toggle = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange?.(value.filter((v) => v !== optValue));
    } else {
      onChange?.([...value, optValue]);
    }
  };

  const removeChip = (optValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(value.filter((v) => v !== optValue));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.([]);
  };

  // Light dismiss on outside pointerdown
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: globalThis.PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node) && !popoverRef.current?.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Position the popover below the trigger
  useEffect(() => {
    if (!open || !rootRef.current || !popoverRef.current) return;
    const anchorRect = rootRef.current.getBoundingClientRect();
    const floating = popoverRef.current;
    floating.style.top = `${anchorRect.bottom + window.scrollY + 4}px`;
    floating.style.left = `${anchorRect.left + window.scrollX}px`;
    floating.style.width = `${anchorRect.width}px`;
  }, [open]);

  const scrollActiveIntoView = (index: number) => {
    const el = listRef.current?.children[index];
    if (el && typeof (el as HTMLElement).scrollIntoView === "function") {
      (el as HTMLElement).scrollIntoView({ block: "nearest" });
    }
  };

  const onSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.min(filtered.length - 1, active + 1);
      setActive(next);
      scrollActiveIntoView(next);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.max(0, active - 1);
      setActive(next);
      scrollActiveIntoView(next);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active] && !filtered[active].disabled) toggle(filtered[active].value);
    } else if (e.key === "Escape" || e.key === "Tab") {
      closeDropdown();
    }
  };

  const selectedOptions = value.map((v) => options.find((o) => o.value === v)).filter(Boolean) as MultiSelectOption[];
  const displayedChips = selectedOptions.slice(0, maxDisplayed);
  const overflow = selectedOptions.length - maxDisplayed;

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      {/* Trigger */}
      <div
        role="combobox"
        aria-expanded={open}
        aria-controls={`${baseId}-listbox`}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        onClick={openDropdown}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
            e.preventDefault();
            if (!open) openDropdown();
          } else if (e.key === "Escape") {
            closeDropdown();
          }
        }}
        className={cn(
          "min-h-9 flex flex-wrap gap-1 px-2 py-1 rounded-nova-md border border-border bg-surface cursor-pointer items-center focus-within:ring-2 focus-within:ring-primary/50",
          "transition-[border-color,box-shadow] duration-150",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        )}
      >
        {selectedOptions.length === 0 && (
          <span className="text-sm text-subtle select-none px-1">{placeholder}</span>
        )}

        {displayedChips.map((opt) => (
          <span
            key={opt.value}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs font-medium px-2 py-0.5"
          >
            {opt.label}
            <button
              type="button"
              aria-label={`Remove ${opt.label}`}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onClick={(e) => removeChip(opt.value, e)}
              className="rounded-full hover:bg-primary/20 w-3.5 h-3.5 flex items-center justify-center"
            >
              <X className="size-2.5" />
            </button>
          </span>
        ))}

        {overflow > 0 && (
          <span className="inline-flex items-center rounded-full bg-surface-2 text-muted text-xs font-medium px-2 py-0.5">
            +{overflow} more
          </span>
        )}

        <div className="ml-auto flex items-center gap-1 pl-1">
          {selectedOptions.length > 0 && (
            <button
              type="button"
              aria-label="Clear all"
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onClick={clearAll}
              className="rounded hover:bg-surface-2 p-0.5 text-muted hover:text-foreground transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "size-4 text-muted transition-transform duration-150",
              open && "rotate-180",
            )}
          />
        </div>
      </div>

      {/* Dropdown popover */}
      <div
        ref={popoverRef}
        id={`${baseId}-listbox`}
        popover="auto"
        onToggle={(e) => {
          // ToggleEvent is a CustomEvent subtype; cast through unknown for newState access
          const newState = (e as unknown as { newState: string }).newState;
          if (newState === "closed" && open) closeDropdown();
        }}
        className="nova-popover fixed inset-auto m-0 z-50 rounded-nova-lg border bg-surface shadow-nova-lg overflow-hidden"
      >
        {/* Search input */}
        <div className="px-2 pt-2 pb-1 border-b border-border">
          <input
            ref={searchRef}
            type="text"
            role="searchbox"
            aria-label="Search options"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onSearchKeyDown}
            className={cn(
              "h-8 w-full rounded-nova border border-border-strong bg-surface px-2 py-1 text-sm text-foreground",
              "placeholder:text-subtle",
              "outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring",
            )}
          />
        </div>

        {/* Options list */}
        <ul
          ref={listRef}
          role="listbox"
          aria-multiselectable="true"
          className="max-h-60 overflow-y-auto p-1"
        >
          {filtered.length === 0 ? (
            <li className="px-2.5 py-2 text-sm text-muted">No results found.</li>
          ) : (
            filtered.map((opt, i) => {
              const isSelected = value.includes(opt.value);
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled || undefined}
                  onPointerEnter={() => setActive(i)}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    if (!opt.disabled) toggle(opt.value);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-nova-sm px-2.5 py-1.5 text-sm",
                    i === active && "bg-surface-2",
                    opt.disabled && "pointer-events-none opacity-50",
                  )}
                >
                  <div
                    className={cn(
                      "size-4 shrink-0 rounded border border-border flex items-center justify-center transition-colors",
                      isSelected && "bg-primary border-primary",
                    )}
                  >
                    {isSelected && <Check className="size-3 text-primary-foreground" />}
                  </div>
                  {opt.label}
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
