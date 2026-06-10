import { useEffect, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface ScrollAreaProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  orientation?: "vertical" | "horizontal" | "both";
  scrollbarSize?: number;
}

const STYLE_ATTR = "data-nova-scrollarea";

function injectScrollAreaStyles(size: number) {
  if (typeof document === "undefined") return;
  if (document.querySelector(`[${STYLE_ATTR}]`)) return;

  const style = document.createElement("style");
  style.setAttribute(STYLE_ATTR, "true");
  style.textContent = `
.nova-scroll-area::-webkit-scrollbar {
  width: ${size}px;
  height: ${size}px;
}
.nova-scroll-area::-webkit-scrollbar-track {
  background: transparent;
}
.nova-scroll-area::-webkit-scrollbar-thumb {
  background: var(--nova-border);
  border-radius: ${Math.round(size / 2)}px;
}
.nova-scroll-area::-webkit-scrollbar-thumb:hover {
  background: var(--nova-foreground-muted);
}
`;
  document.head.appendChild(style);
}

export function ScrollArea({
  children,
  className,
  style,
  orientation = "vertical",
  scrollbarSize = 8,
}: ScrollAreaProps) {
  useEffect(() => {
    injectScrollAreaStyles(scrollbarSize);
  }, [scrollbarSize]);

  const overflowStyle: CSSProperties =
    orientation === "vertical"
      ? { overflowY: "auto", overflowX: "hidden" }
      : orientation === "horizontal"
        ? { overflowX: "auto", overflowY: "hidden" }
        : { overflow: "auto" };

  return (
    <div
      className={cn("nova-scroll-area", className)}
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "var(--nova-border) transparent",
        ...overflowStyle,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * ScrollBar — API-compatibility alias. Renders a ScrollArea with the given orientation.
 */
export function ScrollBar({
  orientation = "vertical",
  ...props
}: ScrollAreaProps) {
  return <ScrollArea orientation={orientation} {...props} />;
}
