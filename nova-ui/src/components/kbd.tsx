import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-border-strong bg-surface-2 px-1.5 font-mono text-[0.7rem] font-medium text-muted shadow-[inset_0_-1px_0_var(--nova-border-strong)]",
        className,
      )}
      {...props}
    />
  );
}
