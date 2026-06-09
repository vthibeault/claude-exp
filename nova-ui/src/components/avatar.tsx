import { useState, type HTMLAttributes, type ImgHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const avatarVariants = cva(
  "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-accent-soft font-medium text-accent-soft-foreground",
  {
    variants: {
      size: {
        sm: "size-7 text-[0.65rem]",
        md: "size-9 text-xs",
        lg: "size-12 text-sm",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export interface AvatarProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  /** Fallback content (typically initials) shown while loading or on error. */
  fallback?: string;
  imgProps?: Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">;
}

export function Avatar({ className, size, src, alt = "", fallback, imgProps, ...props }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const showImage = src && !errored;

  return (
    <span className={cn(avatarVariants({ size }), className)} {...props}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className="size-full object-cover"
          onError={() => setErrored(true)}
          {...imgProps}
        />
      ) : (
        <span aria-hidden="true">{fallback}</span>
      )}
    </span>
  );
}
