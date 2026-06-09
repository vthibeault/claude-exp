import type { ButtonHTMLAttributes, Ref } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { Slot } from "@/lib/slot";
import { Spinner } from "./spinner";

export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-nova text-sm font-medium",
    "transition-[background-color,border-color,color,box-shadow,scale] duration-150",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98]",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-foreground shadow-nova-sm hover:bg-accent-hover",
        secondary: "bg-surface-2 text-foreground hover:bg-border",
        outline: "border border-border-strong bg-surface text-foreground shadow-nova-sm hover:bg-surface-2",
        ghost: "text-foreground hover:bg-surface-2",
        soft: "bg-accent-soft text-accent-soft-foreground hover:bg-accent-soft/80",
        destructive: "bg-danger text-danger-foreground shadow-nova-sm hover:bg-danger-hover",
        link: "text-accent underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4",
        lg: "h-10 px-6",
        icon: "size-9",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render the child element instead of a <button>, merging props onto it. */
  asChild?: boolean;
  /** Show a spinner and disable interaction. */
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ref,
  ...props
}: ButtonProps) {
  if (asChild) {
    return (
      <Slot
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref as Ref<HTMLElement>}
        {...props}
      >
        {children}
      </Slot>
    );
  }

  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      data-loading={loading || undefined}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
