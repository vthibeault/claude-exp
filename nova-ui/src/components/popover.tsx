import {
  cloneElement,
  createContext,
  isValidElement,
  use,
  useId,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/lib/cn";
import {
  hidePopover,
  showPopover,
  useAnchorPosition,
  type Align,
  type Side,
} from "@/lib/use-anchor-position";

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  popoverId: string;
  anchorRef: RefObject<HTMLElement | null>;
  floatingRef: RefObject<HTMLDivElement | null>;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

export function usePopoverContext(component: string) {
  const ctx = use(PopoverContext);
  if (!ctx) throw new Error(`<${component}> must be used inside <Popover>`);
  return ctx;
}

export interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: Side;
  align?: Align;
  children: ReactNode;
}

/**
 * Built on the native Popover API: the panel lives in the top layer, and
 * light-dismiss (outside click) plus Esc handling come from the platform.
 */
export function Popover({ open: controlledOpen, onOpenChange, side, align, children }: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const popoverId = useId();

  const { anchorRef, floatingRef } = useAnchorPosition<HTMLElement, HTMLDivElement>({
    side,
    align,
    open,
  });

  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
    if (next) showPopover(floatingRef.current);
    else hidePopover(floatingRef.current);
  };

  return (
    <PopoverContext value={{ open, setOpen, popoverId, anchorRef, floatingRef }}>
      {children}
    </PopoverContext>
  );
}

export function PopoverTrigger({ children }: { children: ReactElement<Record<string, unknown>> }) {
  const { open, setOpen, popoverId, anchorRef } = usePopoverContext("PopoverTrigger");
  if (!isValidElement(children)) return null;

  return cloneElement(children, {
    ref: anchorRef,
    "aria-expanded": open,
    "aria-controls": popoverId,
    onClick: (e: MouseEvent) => {
      (children.props.onClick as ((e: MouseEvent) => void) | undefined)?.(e);
      setOpen(!open);
    },
  });
}

export interface PopoverContentProps extends HTMLAttributes<HTMLDivElement> {}

export function PopoverContent({ className, children, ...props }: PopoverContentProps) {
  const { open, setOpen, popoverId, floatingRef } = usePopoverContext("PopoverContent");

  return (
    <div
      ref={floatingRef}
      id={popoverId}
      popover="auto"
      onToggle={(e) => {
        // Sync React state when the platform light-dismisses the popover.
        if (e.newState === "closed" && open) setOpen(false);
        if (e.newState === "open" && !open) setOpen(true);
      }}
      className={cn(
        "nova-popover fixed inset-auto m-0 w-72 rounded-nova-lg border bg-surface p-4 text-sm text-foreground shadow-nova-lg",
        className,
      )}
      {...props}
    >
      {open ? children : null}
    </div>
  );
}
