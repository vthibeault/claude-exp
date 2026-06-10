import { useCallback, useRef, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/cn";

export interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  /** Single value, or [low, high] for a range slider. */
  value: number | [number, number];
  onValueChange: (value: number | [number, number]) => void;
  disabled?: boolean;
  /** Format the value for the thumb's aria-valuetext. */
  format?: (v: number) => string;
  className?: string;
}

/** Pointer- and keyboard-driven slider supporting one or two thumbs. */
export function Slider({
  min = 0,
  max = 100,
  step = 1,
  value,
  onValueChange,
  disabled,
  format = String,
  className,
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isRange = Array.isArray(value);
  const values: [number, number] = isRange ? value : [min, value];

  const clamp = useCallback(
    (v: number) => {
      const snapped = Math.round((v - min) / step) * step + min;
      return Math.min(max, Math.max(min, Number(snapped.toFixed(10))));
    },
    [min, max, step],
  );

  const pct = (v: number) => ((v - min) / (max - min || 1)) * 100;

  const setThumb = (index: 0 | 1, raw: number) => {
    const v = clamp(raw);
    if (!isRange) {
      onValueChange(v);
      return;
    }
    const next: [number, number] = [...values];
    next[index] = v;
    // Keep low ≤ high.
    if (next[0] > next[1]) next[index === 0 ? 1 : 0] = v;
    onValueChange(next);
  };

  const valueFromPointer = (e: PointerEvent) => {
    const rect = trackRef.current!.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    return min + ratio * (max - min);
  };

  const onTrackPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const raw = valueFromPointer(e);
    // Grab the nearest thumb.
    const index: 0 | 1 =
      isRange && Math.abs(raw - values[0]) < Math.abs(raw - values[1]) ? 0 : 1;
    setThumb(isRange ? index : 1, raw);

    const target = e.currentTarget;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // Some browsers throw if the pointer is already gone (e.g. after pointercancel).
    }
    const move = (ev: globalThis.PointerEvent) => {
      const rect = trackRef.current!.getBoundingClientRect();
      const ratio = (ev.clientX - rect.left) / rect.width;
      setThumb(isRange ? index : 1, min + ratio * (max - min));
    };
    const up = () => {
      target.removeEventListener("pointermove", move as EventListener);
      target.removeEventListener("pointerup", up);
      target.removeEventListener("pointercancel", up);
    };
    target.addEventListener("pointermove", move as EventListener);
    target.addEventListener("pointerup", up);
    target.addEventListener("pointercancel", up);
  };

  const onThumbKeyDown = (e: KeyboardEvent<HTMLDivElement>, index: 0 | 1) => {
    if (disabled) return;
    const current = isRange ? values[index] : values[1];
    const big = (max - min) / 10;
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = current + step;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = current - step;
    else if (e.key === "PageUp") next = current + big;
    else if (e.key === "PageDown") next = current - big;
    else if (e.key === "Home") next = min;
    else if (e.key === "End") next = max;
    if (next === null) return;
    e.preventDefault();
    setThumb(isRange ? index : 1, next);
  };

  const thumbs: Array<{ v: number; index: 0 | 1 }> = isRange
    ? [
        { v: values[0], index: 0 },
        { v: values[1], index: 1 },
      ]
    : [{ v: values[1], index: 1 }];

  return (
    <div
      ref={trackRef}
      onPointerDown={onTrackPointerDown}
      className={cn(
        "relative flex h-5 w-full cursor-pointer touch-none items-center",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <div className="h-1.5 w-full rounded-full bg-surface-2">
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent"
          style={{
            left: `${isRange ? pct(values[0]) : 0}%`,
            width: `${(isRange ? pct(values[1]) - pct(values[0]) : pct(values[1])).toFixed(3)}%`,
          }}
        />
      </div>
      {thumbs.map(({ v, index }) => (
        <div
          key={index}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={v}
          aria-valuetext={format(v)}
          aria-disabled={disabled || undefined}
          onKeyDown={(e) => onThumbKeyDown(e, index)}
          className={cn(
            "absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 touch-none rounded-full border-2 border-accent bg-surface shadow-nova",
            "outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
          style={{ left: `${pct(v)}%` }}
        />
      ))}
    </div>
  );
}
