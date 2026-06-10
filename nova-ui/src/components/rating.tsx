import { useState, useRef, type KeyboardEvent, type MouseEvent } from "react";
import { Star, Heart } from "lucide-react";
import { cn } from "@/lib/cn";

export interface RatingProps {
  value?: number;
  onChange?: (value: number) => void;
  max?: number;
  allowHalf?: boolean;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  icon?: "star" | "heart";
  className?: string;
}

const sizeClasses = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
};

const iconGap = {
  sm: "gap-0.5",
  md: "gap-1",
  lg: "gap-1.5",
};

interface StarIconProps {
  filled: "full" | "half" | "empty";
  sizeClass: string;
  iconType: "star" | "heart";
}

function RatingIcon({ filled, sizeClass, iconType }: StarIconProps) {
  const IconComponent = iconType === "heart" ? Heart : Star;
  const filledClass =
    iconType === "heart"
      ? "text-red-500 fill-red-500"
      : "text-yellow-400 fill-yellow-400";
  const emptyClass = "text-border fill-transparent";

  if (filled === "full") {
    return <IconComponent className={cn(sizeClass, filledClass)} aria-hidden="true" />;
  }

  if (filled === "half") {
    // Clip trick: render empty icon, then overlay half-filled icon clipped to 50%
    return (
      <span className="relative inline-flex" aria-hidden="true">
        <IconComponent className={cn(sizeClass, emptyClass)} />
        <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
          <IconComponent className={cn(sizeClass, filledClass)} />
        </span>
      </span>
    );
  }

  return <IconComponent className={cn(sizeClass, emptyClass)} aria-hidden="true" />;
}

function getFillState(
  starIndex: number,
  displayValue: number,
  allowHalf: boolean,
): "full" | "half" | "empty" {
  const threshold = starIndex + 1;
  if (displayValue >= threshold) return "full";
  if (allowHalf && displayValue >= threshold - 0.5) return "half";
  return "empty";
}

export function Rating({
  value = 0,
  onChange,
  max = 5,
  allowHalf = false,
  readOnly = false,
  size = "md",
  icon = "star",
  className,
}: RatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const groupRef = useRef<HTMLDivElement>(null);

  const displayValue = hoverValue ?? value;
  const isInteractive = !readOnly && !!onChange;

  const getValueFromMouse = (e: MouseEvent<HTMLSpanElement>, starIndex: number): number => {
    if (allowHalf) {
      const rect = e.currentTarget.getBoundingClientRect();
      const isLeftHalf = e.clientX - rect.left < rect.width / 2;
      return isLeftHalf ? starIndex + 0.5 : starIndex + 1;
    }
    return starIndex + 1;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isInteractive) return;
    const step = allowHalf ? 0.5 : 1;
    let next: number | null = null;

    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      next = Math.min(value + step, max);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      next = Math.max(value - step, 0);
    } else if (e.key === "Home") {
      next = 0;
    } else if (e.key === "End") {
      next = max;
    }

    if (next !== null) {
      e.preventDefault();
      onChange?.(next);
    }
  };

  return (
    <div
      ref={groupRef}
      role="slider"
      aria-label="Rating"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-readonly={readOnly || undefined}
      tabIndex={isInteractive ? 0 : -1}
      onKeyDown={handleKeyDown}
      onMouseLeave={() => isInteractive && setHoverValue(null)}
      className={cn(
        "inline-flex items-center outline-none",
        iconGap[size],
        isInteractive && "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-nova-sm",
        !isInteractive && "cursor-default",
        className,
      )}
    >
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          onMouseMove={
            isInteractive
              ? (e) => setHoverValue(getValueFromMouse(e, i))
              : undefined
          }
          onClick={
            isInteractive
              ? (e) => {
                  const v = getValueFromMouse(e, i);
                  onChange?.(v === value ? 0 : v);
                }
              : undefined
          }
          className={cn(
            "relative inline-flex transition-transform duration-100",
            isInteractive && "cursor-pointer hover:scale-110",
          )}
          aria-hidden="true"
        >
          <RatingIcon
            filled={getFillState(i, displayValue, allowHalf)}
            sizeClass={sizeClasses[size]}
            iconType={icon}
          />
        </span>
      ))}
    </div>
  );
}
