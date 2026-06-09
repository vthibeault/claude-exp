import {
  cloneElement,
  isValidElement,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import {
  hidePopover,
  showPopover,
  useAnchorPosition,
  type Side,
} from "@/lib/use-anchor-position";

export interface TooltipProps {
  content: ReactNode;
  side?: Side;
  /** Delay before showing, in ms. */
  delay?: number;
  className?: string;
  children: ReactElement<Record<string, unknown>>;
}

/**
 * Top-layer tooltip via popover="manual" — never clipped by
 * overflow:hidden ancestors. Shows on hover and on keyboard focus.
 */
export function Tooltip({ content, side = "top", delay = 250, className, children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { anchorRef, floatingRef } = useAnchorPosition<HTMLElement, HTMLDivElement>({
    side,
    open,
  });

  const show = (after: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setOpen(true);
      showPopover(floatingRef.current);
    }, after);
  };

  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
    hidePopover(floatingRef.current);
  };

  if (!isValidElement(children)) return null;

  const trigger = cloneElement(children, {
    ref: anchorRef,
    "aria-describedby": open ? id : undefined,
    onMouseEnter: (e: MouseEvent) => {
      (children.props.onMouseEnter as ((e: MouseEvent) => void) | undefined)?.(e);
      show(delay);
    },
    onMouseLeave: (e: MouseEvent) => {
      (children.props.onMouseLeave as ((e: MouseEvent) => void) | undefined)?.(e);
      hide();
    },
    onFocus: (e: FocusEvent) => {
      (children.props.onFocus as ((e: FocusEvent) => void) | undefined)?.(e);
      show(0);
    },
    onBlur: (e: FocusEvent) => {
      (children.props.onBlur as ((e: FocusEvent) => void) | undefined)?.(e);
      hide();
    },
  });

  return (
    <>
      {trigger}
      <div
        ref={floatingRef}
        id={id}
        role="tooltip"
        popover="manual"
        className={cn(
          "nova-popover fixed inset-auto m-0 max-w-64 rounded-nova border bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-nova-lg",
          className,
        )}
      >
        {content}
      </div>
    </>
  );
}
