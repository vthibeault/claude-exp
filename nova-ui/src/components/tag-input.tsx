import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface TagInputProps {
  value: string[];
  onValueChange: (tags: string[]) => void;
  /** Autocomplete suggestions shown while typing. */
  suggestions?: string[];
  /** Allow values not present in suggestions. */
  allowCustom?: boolean;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
}

/**
 * Multi-select token input: type to filter suggestions, Enter/comma adds,
 * Backspace on an empty input removes the last tag.
 */
export function TagInput({
  value,
  onValueChange,
  suggestions = [],
  allowCustom = true,
  placeholder = "Add…",
  maxTags,
  disabled,
  className,
  id,
}: TagInputProps) {
  const baseId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const atLimit = maxTags !== undefined && value.length >= maxTags;

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return suggestions.filter((s) => !value.includes(s) && (!q || s.toLowerCase().includes(q)));
  }, [suggestions, value, query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: globalThis.PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const add = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || value.includes(trimmed) || atLimit) return;
    if (!allowCustom && !suggestions.includes(trimmed)) return;
    onValueChange([...value, trimmed]);
    setQuery("");
    setActive(0);
  };

  const remove = (tag: string) => {
    onValueChange(value.filter((t) => t !== tag));
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (open && filtered[active]) add(filtered[active]);
      else add(query);
    } else if (e.key === "Backspace" && query === "" && value.length > 0) {
      onValueChange(value.slice(0, -1));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(filtered.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "flex min-h-9 w-full cursor-text flex-wrap items-center gap-1.5 rounded-nova border border-border-strong bg-surface px-2 py-1.5 shadow-nova-sm",
          "transition-[border-color,box-shadow] duration-150",
          "focus-within:border-accent focus-within:ring-2 focus-within:ring-ring",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-accent-soft py-0.5 pl-2.5 pr-1 text-xs font-medium text-accent-soft-foreground"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              disabled={disabled}
              onClick={() => remove(tag)}
              className="rounded-full p-0.5 outline-none transition-colors hover:bg-accent/20 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open && filtered.length > 0}
          aria-controls={`${baseId}-listbox`}
          aria-activedescendant={open && filtered[active] ? `${baseId}-opt-${active}` : undefined}
          disabled={disabled || atLimit}
          value={query}
          placeholder={value.length === 0 ? placeholder : ""}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="min-w-20 flex-1 bg-transparent text-sm outline-none placeholder:text-subtle"
        />
      </div>

      {open && filtered.length > 0 && (
        <ul
          id={`${baseId}-listbox`}
          role="listbox"
          className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-nova-lg border bg-surface p-1 shadow-nova-lg"
        >
          {filtered.map((s, i) => (
            <li
              key={s}
              id={`${baseId}-opt-${i}`}
              role="option"
              aria-selected={false}
              onPointerEnter={() => setActive(i)}
              onPointerDown={(e) => {
                e.preventDefault();
                add(s);
              }}
              className={cn(
                "cursor-pointer rounded-nova-sm px-2.5 py-1.5 text-sm",
                i === active && "bg-surface-2",
              )}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
