import { useState, type ButtonHTMLAttributes, type Ref } from "react";
import { cn } from "@/lib/cn";

export interface SwitchProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  ref?: Ref<HTMLButtonElement>;
}

export function Switch({
  className,
  checked,
  defaultChecked = false,
  onCheckedChange,
  onClick,
  disabled,
  ...props
}: SwitchProps) {
  const [internal, setInternal] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internal;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      disabled={disabled}
      data-state={isChecked ? "checked" : "unchecked"}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (!isControlled) setInternal(!isChecked);
        onCheckedChange?.(!isChecked);
      }}
      className={cn(
        "inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
        "transition-colors duration-200",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        isChecked ? "bg-accent" : "bg-border-strong",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-surface shadow-nova transition-transform duration-200 ease-nova",
          isChecked ? "translate-x-4" : "translate-x-0",
        )}
      />
    </button>
  );
}
