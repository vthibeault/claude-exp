import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/cn";
import { Calendar, type CalendarProps } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export interface DatePickerProps extends Omit<CalendarProps, "className"> {
  placeholder?: string;
  disabled?: boolean;
  format?: Intl.DateTimeFormatOptions;
  className?: string;
  id?: string;
}

/** Input-style trigger opening a Calendar in a top-layer popover. */
export function DatePicker({
  value,
  onValueChange,
  placeholder = "Pick a date",
  disabled,
  format = { dateStyle: "medium" },
  locale,
  className,
  id,
  ...calendarProps
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const fmt = useMemo(() => new Intl.DateTimeFormat(locale, format), [locale, format]);

  return (
    <Popover open={open} onOpenChange={setOpen} align="start">
      <PopoverTrigger>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-nova border border-border-strong bg-surface px-3 text-sm shadow-nova-sm",
            "transition-[border-color,box-shadow] duration-150",
            "outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            value ? "text-foreground" : "text-subtle",
            className,
          )}
        >
          <CalendarDays className="size-4 shrink-0 text-muted" />
          {value ? fmt.format(value) : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          value={value}
          locale={locale}
          onValueChange={(d) => {
            onValueChange?.(d);
            setOpen(false);
          }}
          {...calendarProps}
        />
      </PopoverContent>
    </Popover>
  );
}
