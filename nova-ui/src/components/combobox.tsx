import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

/**
 * WAI-ARIA 1.2 combobox: text input + filtered listbox, managed with
 * aria-activedescendant so focus never leaves the input.
 */
export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  emptyMessage = "No results found.",
  disabled,
  className,
  ...aria
}: ComboboxProps) {
  const baseId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  // Light dismiss on outside pointerdown.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: globalThis.PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (active >= filtered.length) setActive(Math.max(0, filtered.length - 1));
  }, [filtered.length, active]);

  const choose = (option: ComboboxOption) => {
    if (option.disabled) return;
    onValueChange?.(option.value);
    setOpen(false);
    setQuery("");
  };

  const scrollActiveIntoView = (index: number) => {
    const el = listRef.current?.children[index];
    // Guard: not implemented in jsdom.
    if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "nearest" });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;

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
      if (filtered[active]) choose(filtered[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <input
          role="combobox"
          aria-expanded={open}
          aria-controls={`${baseId}-listbox`}
          aria-activedescendant={open && filtered[active] ? `${baseId}-opt-${active}` : undefined}
          aria-autocomplete="list"
          disabled={disabled}
          value={open ? query : (selected?.label ?? "")}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(
            "h-9 w-full rounded-nova border border-border-strong bg-surface py-2 pl-3 pr-9 text-sm text-foreground shadow-nova-sm",
            "placeholder:text-subtle",
            "transition-[border-color,box-shadow] duration-150",
            "outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "aria-invalid:border-danger",
          )}
          {...aria}
        />
        <ChevronsUpDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        />
      </div>

      {open && (
        <ul
          ref={listRef}
          id={`${baseId}-listbox`}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-nova-lg border bg-surface p-1 shadow-nova-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-2.5 py-2 text-sm text-muted">{emptyMessage}</li>
          ) : (
            filtered.map((o, i) => (
              <li
                key={o.value}
                id={`${baseId}-opt-${i}`}
                role="option"
                aria-selected={o.value === value}
                aria-disabled={o.disabled || undefined}
                onPointerEnter={() => setActive(i)}
                // pointerdown (not click) so the input never loses focus
                onPointerDown={(e) => {
                  e.preventDefault();
                  choose(o);
                }}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-nova-sm px-2.5 py-1.5 text-sm",
                  i === active && "bg-surface-2",
                  o.disabled && "pointer-events-none opacity-50",
                )}
              >
                {o.label}
                {o.value === value && <Check className="size-4 text-accent" />}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
