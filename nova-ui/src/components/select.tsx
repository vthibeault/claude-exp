import type { Ref, SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  ref?: Ref<HTMLSelectElement>;
}

/**
 * Styled native <select> — keeps OS-level pickers on mobile and full
 * keyboard/screen-reader behavior for free. Use DropdownMenu for
 * action menus; use Select for form value selection.
 */
export function Select({ className, children, ...props }: SelectProps) {
  return (
    <span className={cn("relative inline-flex w-full", className)}>
      <select
        className={cn(
          "h-9 w-full cursor-pointer appearance-none rounded-nova border border-border-strong bg-surface py-2 pl-3 pr-9 text-sm text-foreground shadow-nova-sm",
          "transition-[border-color,box-shadow] duration-150",
          "outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
      />
    </span>
  );
}
