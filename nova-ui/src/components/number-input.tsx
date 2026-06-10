import { useState, type KeyboardEvent, type Ref } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

export interface NumberInputProps {
  value?: number | null;
  defaultValue?: number;
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  ref?: Ref<HTMLInputElement>;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

/** Number field with stepper buttons, keyboard steps and min/max clamping. */
export function NumberInput({
  value,
  defaultValue,
  onValueChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  placeholder,
  disabled,
  className,
  id,
  ref,
  ...aria
}: NumberInputProps) {
  const [internal, setInternal] = useState<number | null>(defaultValue ?? null);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;

  const [text, setText] = useState(current == null ? "" : String(current));

  const commit = (n: number | null) => {
    const clamped = n == null ? null : Math.min(max, Math.max(min, n));
    if (!isControlled) setInternal(clamped);
    onValueChange?.(clamped);
    setText(clamped == null ? "" : String(clamped));
  };

  const nudge = (dir: 1 | -1) => {
    const base = current ?? (dir === 1 ? Math.max(min, 0) - step : Math.min(max, 0) + step);
    const next = Number((base + dir * step).toFixed(10));
    commit(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      nudge(1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      nudge(-1);
    }
  };

  // Keep display synced when controlled value changes externally.
  const displayed = isControlled && document.activeElement?.id !== id ? (value == null ? "" : String(value)) : text;

  return (
    <div
      className={cn(
        "flex h-9 w-full items-stretch overflow-hidden rounded-nova border border-border-strong bg-surface shadow-nova-sm",
        "transition-[border-color,box-shadow] duration-150",
        "focus-within:border-accent focus-within:ring-2 focus-within:ring-ring",
        disabled && "opacity-50",
        className,
      )}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Decrease"
        disabled={disabled || (current != null && current <= min)}
        onClick={() => nudge(-1)}
        className="flex w-9 shrink-0 items-center justify-center border-r text-muted outline-none transition-colors hover:bg-surface-2 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <Minus className="size-3.5" />
      </button>
      <input
        ref={ref}
        id={id}
        inputMode="decimal"
        disabled={disabled}
        placeholder={placeholder}
        value={displayed}
        onChange={(e) => {
          const v = e.target.value;
          if (/^-?\d*([.,]\d*)?$/.test(v)) setText(v);
        }}
        onBlur={() => {
          const n = text === "" || text === "-" ? null : Number(text.replace(",", "."));
          commit(n == null || Number.isNaN(n) ? null : n);
        }}
        onKeyDown={onKeyDown}
        role="spinbutton"
        aria-valuemin={Number.isFinite(min) ? min : undefined}
        aria-valuemax={Number.isFinite(max) ? max : undefined}
        aria-valuenow={current ?? undefined}
        className="w-full bg-transparent px-3 text-center text-sm tabular-nums outline-none placeholder:text-subtle disabled:cursor-not-allowed"
        {...aria}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Increase"
        disabled={disabled || (current != null && current >= max)}
        onClick={() => nudge(1)}
        className="flex w-9 shrink-0 items-center justify-center border-l text-muted outline-none transition-colors hover:bg-surface-2 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
