import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-nova-pulse rounded-nova bg-surface-2", className)}
      aria-hidden="true"
      {...props}
    />
  );
}
