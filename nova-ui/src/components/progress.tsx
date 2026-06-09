import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  /** 0–100. Omit for an indeterminate progress bar. */
  value?: number;
}

export function Progress({ className, value, ...props }: ProgressProps) {
  const indeterminate = value === undefined;
  const clamped = indeterminate ? 0 : Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : clamped}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-surface-2", className)}
      {...props}
    >
      <div
        className={cn(
          "h-full rounded-full bg-accent transition-[width] duration-300 ease-nova",
          indeterminate && "w-2/5 animate-nova-progress",
        )}
        style={indeterminate ? undefined : { width: `${clamped}%` }}
      />
    </div>
  );
}
