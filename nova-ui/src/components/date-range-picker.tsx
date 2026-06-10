import {
  useCallback,
  useId,
  useMemo,
  useState,
  type KeyboardEvent,
} from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  hidePopover,
  showPopover,
  useAnchorPosition,
} from "@/lib/use-anchor-position";
import { Button } from "./button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DateRange = { from: Date; to: Date };

export interface DateRangePreset {
  label: string;
  range: DateRange;
}

export interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  presets?: DateRangePreset[];
  /** Include built-in Last 7/30 days + This/Last month presets. */
  defaultPresets?: boolean;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Inline date helpers (no date-fns)
// ---------------------------------------------------------------------------

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function subDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - n);
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function subMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() - n, d.getDate());
}

function isSameDay(a: Date | undefined | null, b: Date) {
  return (
    !!a &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isInRange(d: Date, from: Date | null, to: Date | null) {
  if (!from || !to) return false;
  const t = d.getTime();
  return t >= from.getTime() && t <= to.getTime();
}

function formatRange(r: DateRange, locale?: string): string {
  const fmt = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" });
  const fromStr = fmt.format(r.from);
  const toStr = fmt.format(r.to);
  return isSameDay(r.from, r.to) ? fromStr : `${fromStr} – ${toStr}`;
}

// ---------------------------------------------------------------------------
// CalendarGrid — renders one month and highlights a range
// ---------------------------------------------------------------------------

interface CalendarGridProps {
  view: Date; // first day of displayed month
  onViewChange: (d: Date) => void;
  selectedFrom: Date | null;
  selectedTo: Date | null;
  hoverDate: Date | null;
  onDateSelect: (d: Date) => void;
  onDateHover: (d: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  locale?: string;
  showPrevNav?: boolean;
  showNextNav?: boolean;
}

function CalendarGrid({
  view,
  onViewChange,
  selectedFrom,
  selectedTo,
  hoverDate,
  onDateSelect,
  onDateHover,
  minDate,
  maxDate,
  locale,
  showPrevNav = true,
  showNextNav = true,
}: CalendarGridProps) {
  const today = startOfDay(new Date());

  const monthFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
    [locale],
  );
  const weekdayFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: "narrow" }),
    [locale],
  );

  const weekdays = useMemo(() => {
    const base = new Date(2024, 0, 1); // Monday
    return Array.from({ length: 7 }, (_, i) =>
      weekdayFormat.format(new Date(base.getFullYear(), base.getMonth(), base.getDate() + i)),
    );
  }, [weekdayFormat]);

  const cells = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7;
    const start = new Date(view.getFullYear(), view.getMonth(), 1 - lead);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return startOfDay(d);
    });
  }, [view]);

  const isDisabled = (d: Date) =>
    (!!minDate && d < startOfDay(minDate)) ||
    (!!maxDate && d > startOfDay(maxDate));

  // Compute effective range end (use hoverDate if no to is set yet)
  const effectiveTo =
    selectedFrom && !selectedTo && hoverDate
      ? hoverDate.getTime() >= selectedFrom.getTime()
        ? hoverDate
        : null
      : selectedTo;

  const effectiveFrom =
    selectedFrom && !selectedTo && hoverDate
      ? hoverDate.getTime() < selectedFrom.getTime()
        ? hoverDate
        : selectedFrom
      : selectedFrom;

  const isRangeStart = (d: Date) => isSameDay(effectiveFrom, d);
  const isRangeEnd = (d: Date) => isSameDay(effectiveTo, d);
  const isRangeMid = (d: Date) =>
    !isRangeStart(d) && !isRangeEnd(d) && isInRange(d, effectiveFrom, effectiveTo);

  const [cursor, setCursor] = useState<Date>(() => startOfDay(new Date()));

  const moveCursor = useCallback(
    (next: Date) => {
      setCursor(next);
      if (
        next.getMonth() !== view.getMonth() ||
        next.getFullYear() !== view.getFullYear()
      ) {
        onViewChange(new Date(next.getFullYear(), next.getMonth(), 1));
      }
    },
    [view, onViewChange],
  );

  const dayId = (d: Date) =>
    `drp-${view.getFullYear()}-${view.getMonth()}-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, d: Date) => {
    const delta = (n: number) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        moveCursor(delta(-1));
        break;
      case "ArrowRight":
        e.preventDefault();
        moveCursor(delta(1));
        break;
      case "ArrowUp":
        e.preventDefault();
        moveCursor(delta(-7));
        break;
      case "ArrowDown":
        e.preventDefault();
        moveCursor(delta(7));
        break;
      case "Home":
        e.preventDefault();
        moveCursor(delta(-((d.getDay() + 6) % 7)));
        break;
      case "End":
        e.preventDefault();
        moveCursor(delta(6 - ((d.getDay() + 6) % 7)));
        break;
      case "PageUp":
        e.preventDefault();
        moveCursor(new Date(d.getFullYear(), d.getMonth() - 1, d.getDate()));
        break;
      case "PageDown":
        e.preventDefault();
        moveCursor(new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()));
        break;
    }
  };

  return (
    <div className="w-fit select-none p-3">
      {/* Month navigation */}
      <div className="mb-2 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Previous month"
          style={{ visibility: showPrevNav ? "visible" : "hidden" }}
          onClick={() =>
            onViewChange(new Date(view.getFullYear(), view.getMonth() - 1, 1))
          }
        >
          <ChevronLeft />
        </Button>
        <span aria-live="polite" className="text-sm font-medium capitalize">
          {monthFormat.format(view)}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Next month"
          style={{ visibility: showNextNav ? "visible" : "hidden" }}
          onClick={() =>
            onViewChange(new Date(view.getFullYear(), view.getMonth() + 1, 1))
          }
        >
          <ChevronRight />
        </Button>
      </div>

      <table role="grid" className="border-separate border-spacing-0.5">
        <thead>
          <tr>
            {weekdays.map((w, i) => (
              <th
                key={i}
                scope="col"
                className="size-8 text-center text-xs font-normal text-subtle"
              >
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }, (_, week) => (
            <tr key={week}>
              {cells.slice(week * 7, week * 7 + 7).map((d) => {
                const outside = d.getMonth() !== view.getMonth();
                const disabled = isDisabled(d);
                const focusable = isSameDay(cursor, d);
                const rangeStart = isRangeStart(d);
                const rangeEnd = isRangeEnd(d);
                const rangeMid = isRangeMid(d);
                const isToday = isSameDay(today, d);

                return (
                  <td
                    key={d.getTime()}
                    role="gridcell"
                    aria-selected={rangeStart || rangeEnd || rangeMid}
                    className={cn(
                      "relative",
                      rangeMid && "bg-accent-soft",
                      rangeStart && "rounded-l-nova bg-accent-soft",
                      rangeEnd && "rounded-r-nova bg-accent-soft",
                    )}
                  >
                    <button
                      type="button"
                      id={dayId(d)}
                      tabIndex={focusable ? 0 : -1}
                      disabled={disabled}
                      aria-label={d.toDateString()}
                      aria-current={isToday ? "date" : undefined}
                      onClick={() => {
                        setCursor(d);
                        onDateSelect(d);
                      }}
                      onMouseEnter={() => onDateHover(d)}
                      onMouseLeave={() => onDateHover(null)}
                      onFocus={() => onDateHover(d)}
                      onBlur={() => onDateHover(null)}
                      onKeyDown={(e) => onKeyDown(e, d)}
                      className={cn(
                        "size-8 rounded-nova text-sm tabular-nums transition-colors duration-100",
                        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        "disabled:pointer-events-none disabled:opacity-30",
                        outside && "text-subtle",
                        (rangeStart || rangeEnd)
                          ? "bg-accent font-medium text-accent-foreground"
                          : "hover:bg-surface-2",
                        !rangeStart && !rangeEnd && isToday && "font-semibold text-accent",
                      )}
                    >
                      {d.getDate()}
                    </button>
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

// ---------------------------------------------------------------------------
// DateRangePicker
// ---------------------------------------------------------------------------

export function DateRangePicker({
  value,
  onChange,
  presets: presetsProp,
  defaultPresets = false,
  minDate,
  maxDate,
  placeholder = "Select date range",
  className,
  disabled = false,
}: DateRangePickerProps) {
  const popoverId = useId();
  const [open, setOpen] = useState(false);

  // Pending selection (before Apply)
  const [pendingFrom, setPendingFrom] = useState<Date | null>(null);
  const [pendingTo, setPendingTo] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  // Left calendar = current month, right = next month
  const [leftView, setLeftView] = useState<Date>(() => {
    const base = value?.from ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const rightView = useMemo(
    () => new Date(leftView.getFullYear(), leftView.getMonth() + 1, 1),
    [leftView],
  );

  const { anchorRef, floatingRef } = useAnchorPosition<HTMLButtonElement, HTMLDivElement>({
    side: "bottom",
    align: "start",
    open,
    offset: 6,
  });

  const openPopover = () => {
    if (disabled) return;
    // Seed pending selection from current value
    setPendingFrom(value?.from ?? null);
    setPendingTo(value?.to ?? null);
    setOpen(true);
    showPopover(floatingRef.current);
  };

  const closePopover = () => {
    setOpen(false);
    hidePopover(floatingRef.current);
  };

  const handleDateSelect = (d: Date) => {
    if (!pendingFrom || (pendingFrom && pendingTo)) {
      // Start fresh selection
      setPendingFrom(d);
      setPendingTo(null);
    } else {
      // Second click — finalize range
      const [from, to] =
        d.getTime() >= pendingFrom.getTime()
          ? [pendingFrom, d]
          : [d, pendingFrom];
      setPendingFrom(from);
      setPendingTo(to);
    }
  };

  const handleApply = () => {
    if (pendingFrom && pendingTo) {
      onChange?.({ from: pendingFrom, to: pendingTo });
      closePopover();
    }
  };

  const handlePreset = (preset: DateRangePreset) => {
    setPendingFrom(preset.range.from);
    setPendingTo(preset.range.to);
    setLeftView(new Date(preset.range.from.getFullYear(), preset.range.from.getMonth(), 1));
  };

  const allPresets = useMemo<DateRangePreset[]>(() => {
    const today = startOfDay(new Date());
    const builtIn: DateRangePreset[] = defaultPresets
      ? [
          { label: "Today", range: { from: today, to: today } },
          { label: "Last 7 days", range: { from: subDays(today, 6), to: today } },
          { label: "Last 30 days", range: { from: subDays(today, 29), to: today } },
          {
            label: "This month",
            range: { from: startOfMonth(today), to: today },
          },
          {
            label: "Last month",
            range: {
              from: startOfMonth(subMonths(today, 1)),
              to: endOfMonth(subMonths(today, 1)),
            },
          },
        ]
      : [];
    return [...builtIn, ...(presetsProp ?? [])];
  }, [defaultPresets, presetsProp]);

  const canApply = pendingFrom && pendingTo;

  const displayText = value ? formatRange(value) : null;

  return (
    <>
      {/* Trigger */}
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
        <CalendarDays className="size-4 shrink-0 text-muted" />
        <span className="flex-1 text-left">{displayText ?? placeholder}</span>
        {value && (
          <X
            className="size-3.5 shrink-0 text-muted hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onChange?.({ from: new Date(), to: new Date() });
            }}
          />
        )}
      </button>

      {/* Popover */}
      <div
        ref={floatingRef}
        id={popoverId}
        popover="auto"
        onToggle={(e) => {
          if (e.newState === "closed" && open) setOpen(false);
          if (e.newState === "open" && !open) setOpen(true);
        }}
        className="nova-popover fixed inset-auto m-0 w-auto rounded-nova-lg border bg-surface p-0 text-sm text-foreground shadow-nova-lg"
      >
        {open && (
          <div className="flex">
            {/* Sidebar presets */}
            {allPresets.length > 0 && (
              <div className="flex w-36 flex-col gap-0.5 border-r p-2">
                <p className="px-2 py-1 text-xs font-medium text-subtle uppercase tracking-wide">
                  Presets
                </p>
                {allPresets.map((preset) => {
                  const active =
                    pendingFrom &&
                    pendingTo &&
                    isSameDay(pendingFrom, preset.range.from) &&
                    isSameDay(pendingTo, preset.range.to);
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handlePreset(preset)}
                      className={cn(
                        "w-full rounded-nova px-2 py-1.5 text-left text-sm transition-colors",
                        active
                          ? "bg-accent-soft text-accent-soft-foreground font-medium"
                          : "text-foreground hover:bg-surface-2",
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Calendars */}
            <div className="flex flex-col">
              <div className="flex">
                <CalendarGrid
                  view={leftView}
                  onViewChange={setLeftView}
                  selectedFrom={pendingFrom}
                  selectedTo={pendingTo}
                  hoverDate={hoverDate}
                  onDateSelect={handleDateSelect}
                  onDateHover={setHoverDate}
                  minDate={minDate}
                  maxDate={maxDate}
                  showPrevNav
                  showNextNav={false}
                />
                <div className="w-px bg-border self-stretch" />
                <CalendarGrid
                  view={rightView}
                  onViewChange={(d) =>
                    setLeftView(new Date(d.getFullYear(), d.getMonth() - 1, 1))
                  }
                  selectedFrom={pendingFrom}
                  selectedTo={pendingTo}
                  hoverDate={hoverDate}
                  onDateSelect={handleDateSelect}
                  onDateHover={setHoverDate}
                  minDate={minDate}
                  maxDate={maxDate}
                  showPrevNav={false}
                  showNextNav
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-2 border-t px-4 py-3">
                <span className="text-xs text-subtle">
                  {pendingFrom && pendingTo
                    ? formatRange({ from: pendingFrom, to: pendingTo })
                    : pendingFrom
                      ? `From ${pendingFrom.toLocaleDateString(undefined, { month: "short", day: "numeric" })} — pick end date`
                      : "Select start date"}
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={closePopover}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!canApply}
                    onClick={handleApply}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
