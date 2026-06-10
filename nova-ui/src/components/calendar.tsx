import { useMemo, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

export interface CalendarProps {
  value?: Date;
  onValueChange?: (date: Date) => void;
  /** Disable dates outside this range. */
  min?: Date;
  max?: Date;
  locale?: string;
  className?: string;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date | undefined, b: Date) {
  return !!a && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Month-grid calendar (role="grid") with full keyboard support:
 * arrows move by day/week, PageUp/PageDown by month, Home/End to
 * week boundaries, Enter/Space selects. No date library — Intl only.
 */
export function Calendar({ value, onValueChange, min, max, locale, className }: CalendarProps) {
  const today = startOfDay(new Date());
  const [view, setView] = useState(() => {
    const base = value ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [cursor, setCursor] = useState<Date>(() => startOfDay(value ?? today));

  const monthFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
    [locale],
  );
  const weekdayFormat = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "narrow" }), [locale]);

  // Week starts Monday.
  const weekdays = useMemo(() => {
    const base = new Date(2024, 0, 1); // a Monday
    return Array.from({ length: 7 }, (_, i) =>
      weekdayFormat.format(new Date(base.getFullYear(), base.getMonth(), base.getDate() + i)),
    );
  }, [weekdayFormat]);

  const cells = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7; // Monday-indexed offset
    const start = new Date(view.getFullYear(), view.getMonth(), 1 - lead);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      return startOfDay(d);
    });
  }, [view]);

  const isDisabled = (d: Date) =>
    (min && d < startOfDay(min)) || (max && d > startOfDay(max)) || false;

  const moveCursor = (next: Date) => {
    setCursor(next);
    if (next.getMonth() !== view.getMonth() || next.getFullYear() !== view.getFullYear()) {
      setView(new Date(next.getFullYear(), next.getMonth(), 1));
    }
    requestAnimationFrame(() => {
      document.getElementById(dayId(next))?.focus();
    });
  };

  const dayId = (d: Date) => `cal-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, d: Date) => {
    const delta = (days: number) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
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
    <div className={cn("w-fit select-none p-3", className)}>
      <div className="mb-2 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Previous month"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
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
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
        >
          <ChevronRight />
        </Button>
      </div>

      <table role="grid" className="border-separate border-spacing-0.5">
        <thead>
          <tr>
            {weekdays.map((w, i) => (
              <th key={i} scope="col" className="size-8 text-center text-xs font-normal text-subtle">
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
                const selected = isSameDay(value, d);
                const disabled = isDisabled(d);
                const focusable = isSameDay(cursor, d);
                return (
                  <td key={d.getTime()} role="gridcell" aria-selected={selected}>
                    <button
                      type="button"
                      id={dayId(d)}
                      tabIndex={focusable ? 0 : -1}
                      disabled={disabled}
                      aria-label={d.toDateString()}
                      aria-current={isSameDay(today, d) ? "date" : undefined}
                      onClick={() => {
                        setCursor(d);
                        onValueChange?.(d);
                      }}
                      onKeyDown={(e) => onKeyDown(e, d)}
                      className={cn(
                        "size-8 rounded-nova text-sm tabular-nums transition-colors duration-100",
                        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        "disabled:pointer-events-none disabled:opacity-30",
                        outside && "text-subtle",
                        selected
                          ? "bg-accent font-medium text-accent-foreground"
                          : "hover:bg-surface-2",
                        !selected && isSameDay(today, d) && "font-semibold text-accent",
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
