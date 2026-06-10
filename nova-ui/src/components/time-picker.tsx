import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type UIEvent,
} from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  showPopover,
  hidePopover,
  useAnchorPosition,
} from "@/lib/use-anchor-position";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimeValue {
  hour: number;
  minute: number;
  second?: number;
  ampm?: "AM" | "PM";
}

export interface TimePickerProps {
  value?: TimeValue;
  onChange?: (value: TimeValue) => void;
  showSeconds?: boolean;
  use12Hour?: boolean;
  className?: string;
  disabled?: boolean;
}

export interface TimePickerFieldProps extends TimePickerProps {
  placeholder?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ITEM_HEIGHT = 40; // px — matches h-10

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatTimeValue(v: TimeValue | undefined, use12Hour: boolean, showSeconds: boolean): string {
  if (!v) return "";
  const h = use12Hour ? (v.hour % 12 === 0 ? 12 : v.hour % 12) : v.hour;
  const parts = [pad2(h), pad2(v.minute)];
  if (showSeconds && v.second !== undefined) parts.push(pad2(v.second));
  let s = parts.join(":");
  if (use12Hour) s += ` ${v.ampm ?? (v.hour < 12 ? "AM" : "PM")}`;
  return s;
}

function defaultTimeValue(use12Hour: boolean): TimeValue {
  const now = new Date();
  const hour = now.getHours();
  return {
    hour,
    minute: now.getMinutes(),
    second: 0,
    ampm: use12Hour ? (hour < 12 ? "AM" : "PM") : undefined,
  };
}

// ---------------------------------------------------------------------------
// ScrollColumn
// ---------------------------------------------------------------------------

interface ScrollColumnProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  ariaLabel: string;
  disabled?: boolean;
}

function ScrollColumn({ items, selectedIndex, onSelect, ariaLabel, disabled }: ScrollColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to a given index smoothly
  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const el = containerRef.current;
      if (!el) return;
      el.scrollTo({ top: index * ITEM_HEIGHT, behavior });
    },
    [],
  );

  // Scroll to selected index on mount and when selectedIndex changes externally
  useEffect(() => {
    if (!isScrollingRef.current) {
      scrollToIndex(selectedIndex, "instant" as ScrollBehavior);
    }
  }, [selectedIndex, scrollToIndex]);

  // Detect snap position after scroll settles
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    if (disabled) return;
    const el = e.currentTarget;
    isScrollingRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      const snappedIndex = Math.round(el.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(items.length - 1, snappedIndex));
      onSelect(clamped);
    }, 80);
  };

  // Cleanup
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  // Padding items to allow first and last items to center
  const PADDING_COUNT = 1; // one item above and below

  return (
    <div
      className="relative w-16"
      role="listbox"
      aria-label={ariaLabel}
      aria-activedescendant={`${ariaLabel}-${selectedIndex}`}
    >
      {/* Selection window indicator */}
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 border-y border-border"
        style={{ height: ITEM_HEIGHT }}
        aria-hidden
      />

      {/* Fade overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(to bottom, var(--nova-surface) 0%, transparent 35%, transparent 65%, var(--nova-surface) 100%)",
        }}
        aria-hidden
      />

      {/* Scroll container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={cn(
          "overflow-y-scroll overscroll-contain",
          disabled && "pointer-events-none opacity-50",
        )}
        style={{
          height: ITEM_HEIGHT * 3,
          scrollSnapType: "y mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* Top padding */}
        <div style={{ height: ITEM_HEIGHT * PADDING_COUNT }} aria-hidden />

        {items.map((item, i) => (
          <div
            key={i}
            id={`${ariaLabel}-${i}`}
            role="option"
            aria-selected={i === selectedIndex}
            style={{ scrollSnapAlign: "center", height: ITEM_HEIGHT }}
            onClick={() => {
              if (disabled) return;
              onSelect(i);
              scrollToIndex(i);
            }}
            className={cn(
              "flex cursor-pointer items-center justify-center text-sm select-none",
              i === selectedIndex
                ? "font-semibold text-foreground"
                : "text-subtle",
            )}
          >
            {item}
          </div>
        ))}

        {/* Bottom padding */}
        <div style={{ height: ITEM_HEIGHT * PADDING_COUNT }} aria-hidden />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TimePicker
// ---------------------------------------------------------------------------

export function TimePicker({
  value,
  onChange,
  showSeconds = false,
  use12Hour = false,
  className,
  disabled = false,
}: TimePickerProps) {
  const current = value ?? defaultTimeValue(use12Hour);

  // Build column items
  const hourItems = use12Hour
    ? Array.from({ length: 12 }, (_, i) => pad2(i + 1)) // 01-12
    : Array.from({ length: 24 }, (_, i) => pad2(i));     // 00-23

  const minuteItems = Array.from({ length: 60 }, (_, i) => pad2(i));
  const secondItems = Array.from({ length: 60 }, (_, i) => pad2(i));
  const ampmItems = ["AM", "PM"];

  // Compute selectedIndex for each column
  const hourIndex = use12Hour
    ? (current.hour % 12 === 0 ? 12 : current.hour % 12) - 1 // 0-based for 01-12
    : current.hour;                                             // 0-based for 00-23

  const minuteIndex = current.minute;
  const secondIndex = current.second ?? 0;
  const ampmIndex = (current.ampm ?? (current.hour < 12 ? "AM" : "PM")) === "AM" ? 0 : 1;

  const emit = useCallback(
    (patch: Partial<TimeValue>) => {
      const next = { ...current, ...patch };
      onChange?.(next);
    },
    [current, onChange],
  );

  const handleHourSelect = (index: number) => {
    if (use12Hour) {
      const h12 = index + 1; // 1-12
      const isAm = (current.ampm ?? "AM") === "AM";
      let h24 = isAm ? (h12 === 12 ? 0 : h12) : h12 === 12 ? 12 : h12 + 12;
      emit({ hour: h24 });
    } else {
      emit({ hour: index });
    }
  };

  const handleAmpmSelect = (index: number) => {
    const ampm = ampmItems[index] as "AM" | "PM";
    let hour = current.hour;
    if (ampm === "AM" && hour >= 12) hour -= 12;
    if (ampm === "PM" && hour < 12) hour += 12;
    emit({ ampm, hour });
  };

  return (
    <div
      className={cn(
        "flex gap-0 border border-border rounded-nova-md overflow-hidden bg-surface select-none",
        className,
      )}
      aria-label="Time picker"
    >
      {/* Divider labels */}
      <ScrollColumn
        items={hourItems}
        selectedIndex={hourIndex}
        onSelect={handleHourSelect}
        ariaLabel="hour"
        disabled={disabled}
      />

      <div className="flex items-center justify-center text-subtle text-sm font-medium px-0.5 shrink-0">
        :
      </div>

      <ScrollColumn
        items={minuteItems}
        selectedIndex={minuteIndex}
        onSelect={(i) => emit({ minute: i })}
        ariaLabel="minute"
        disabled={disabled}
      />

      {showSeconds && (
        <>
          <div className="flex items-center justify-center text-subtle text-sm font-medium px-0.5 shrink-0">
            :
          </div>
          <ScrollColumn
            items={secondItems}
            selectedIndex={secondIndex}
            onSelect={(i) => emit({ second: i })}
            ariaLabel="second"
            disabled={disabled}
          />
        </>
      )}

      {use12Hour && (
        <>
          <div className="w-px bg-border shrink-0" />
          <ScrollColumn
            items={ampmItems}
            selectedIndex={ampmIndex}
            onSelect={handleAmpmSelect}
            ariaLabel="period"
            disabled={disabled}
          />
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TimePickerField — trigger button + popover containing the wheel
// ---------------------------------------------------------------------------

export function TimePickerField({
  value,
  onChange,
  showSeconds = false,
  use12Hour = false,
  placeholder = "Select time",
  className,
  disabled = false,
}: TimePickerFieldProps) {
  const popoverId = useId();
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState<TimeValue | undefined>(value);

  // Keep internal in sync when controlled value changes
  useEffect(() => {
    setInternal(value);
  }, [value]);

  const { anchorRef, floatingRef } = useAnchorPosition<HTMLButtonElement, HTMLDivElement>({
    side: "bottom",
    align: "start",
    open,
    offset: 6,
  });

  const openPopover = () => {
    if (disabled) return;
    setOpen(true);
    showPopover(floatingRef.current);
  };

  const handleChange = (v: TimeValue) => {
    setInternal(v);
    onChange?.(v);
  };

  const displayText = formatTimeValue(internal, use12Hour, showSeconds);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={openPopover}
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-nova border border-border-strong bg-surface px-3 text-sm shadow-nova-sm",
          "transition-[border-color,box-shadow] duration-150",
          "outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          displayText ? "text-foreground" : "text-subtle",
          className,
        )}
      >
        <Clock className="size-4 shrink-0 text-muted" />
        <span className="flex-1 text-left">{displayText || placeholder}</span>
      </button>

      <div
        ref={floatingRef}
        id={popoverId}
        popover="auto"
        onToggle={(e) => {
          if (e.newState === "closed" && open) { setOpen(false); hidePopover(floatingRef.current); }
          if (e.newState === "open" && !open) setOpen(true);
        }}
        className="nova-popover fixed inset-auto m-0 w-auto rounded-nova-lg border bg-surface p-3 text-sm text-foreground shadow-nova-lg"
      >
        {open && (
          <TimePicker
            value={internal}
            onChange={handleChange}
            showSeconds={showSeconds}
            use12Hour={use12Hour}
            disabled={disabled}
          />
        )}
      </div>
    </>
  );
}
