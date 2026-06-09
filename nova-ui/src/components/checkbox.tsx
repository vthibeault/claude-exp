import type { InputHTMLAttributes, Ref } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
}

/**
 * Styled native checkbox: a real <input type="checkbox"> for free form
 * semantics, with the indicator drawn via the :checked sibling state.
 */
export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <span className={cn("relative inline-flex size-4 shrink-0", className)}>
      <input
        type="checkbox"
        className={cn(
          "peer size-full cursor-pointer appearance-none rounded-nova-sm border border-border-strong bg-surface shadow-nova-sm",
          "transition-colors duration-150",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "checked:border-accent checked:bg-accent",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
        {...props}
      />
      <Check
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 m-auto size-3 text-accent-foreground opacity-0 transition-opacity duration-100 peer-checked:opacity-100"
        strokeWidth={3}
      />
    </span>
  );
}
