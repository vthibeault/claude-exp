import React, {
  cloneElement,
  createContext,
  isValidElement,
  use,
  useId,
  useRef,
  useState,
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

interface HoverCardContextValue {
  open: boolean;
  cardId: string;
  anchorRef: RefObject<HTMLElement | null>;
  floatingRef: RefObject<HTMLDivElement | null>;
  openDelay: number;
  closeDelay: number;
  openTimeout: RefObject<ReturnType<typeof setTimeout> | null>;
  closeTimeout: RefObject<ReturnType<typeof setTimeout> | null>;
  scheduleOpen: () => void;
  scheduleClose: () => void;
  cancelOpen: () => void;
  cancelClose: () => void;
}

const HoverCardContext = createContext<HoverCardContextValue | null>(null);

function useHoverCardContext(component: string) {
  const ctx = use(HoverCardContext);
  if (!ctx) throw new Error(`<${component}> must be used inside <HoverCard>`);
  return ctx;
}

export interface HoverCardProps {
  children: ReactNode;
  openDelay?: number;
  closeDelay?: number;
}

export function HoverCard({ children, openDelay = 300, closeDelay = 150 }: HoverCardProps) {
  const [open, setOpen] = useState(false);
  const cardId = useId();

  const { anchorRef, floatingRef } = useAnchorPosition<HTMLElement, HTMLDivElement>({
    side: "bottom",
    align: "center",
    open,
  });

  const openTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelOpen = () => {
    if (openTimeout.current) {
      clearTimeout(openTimeout.current);
      openTimeout.current = null;
    }
  };

  const cancelClose = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  };

  const scheduleOpen = () => {
    cancelClose();
    if (open) return;
    openTimeout.current = setTimeout(() => {
      setOpen(true);
      // onDismiss syncs state when the fallback (no Popover API) light-dismiss
      // hides the card — the native `toggle` event never fires there.
      showPopover(floatingRef.current, () => setOpen(false));
    }, openDelay);
  };

  const scheduleClose = () => {
    cancelOpen();
    if (!open) return;
    closeTimeout.current = setTimeout(() => {
      setOpen(false);
      hidePopover(floatingRef.current);
    }, closeDelay);
  };

  return (
    <HoverCardContext
      value={{
        open,
        cardId,
        anchorRef,
        floatingRef,
        openDelay,
        closeDelay,
        openTimeout,
        closeTimeout,
        scheduleOpen,
        scheduleClose,
        cancelOpen,
        cancelClose,
      }}
    >
      {children}
    </HoverCardContext>
  );
}

export function HoverCardTrigger({ children }: { children: React.ReactElement }) {
  const { anchorRef, cardId, scheduleOpen, scheduleClose } = useHoverCardContext("HoverCardTrigger");
  if (!isValidElement(children)) return null;

  const props = children.props as Record<string, unknown>;
  return cloneElement(children as React.ReactElement<Record<string, unknown>>, {
    ref: anchorRef,
    "aria-describedby": cardId,
    onPointerEnter: (e: PointerEvent) => {
      (props.onPointerEnter as ((e: PointerEvent) => void) | undefined)?.(e);
      if (e.pointerType !== "touch") scheduleOpen();
    },
    onPointerLeave: (e: PointerEvent) => {
      (props.onPointerLeave as ((e: PointerEvent) => void) | undefined)?.(e);
      if (e.pointerType !== "touch") scheduleClose();
    },
    onClick: (e: MouseEvent) => {
      (props.onClick as ((e: MouseEvent) => void) | undefined)?.(e);
      // On touch devices, toggle the card on tap
      scheduleOpen();
    },
  });
}

export interface HoverCardContentProps {
  children: ReactNode;
  side?: Side;
  align?: Align;
  className?: string;
}

export function HoverCardContent({
  children,
  className,
}: HoverCardContentProps) {
  const { open, cardId, floatingRef, scheduleClose, cancelClose } =
    useHoverCardContext("HoverCardContent");

  // side/align are accepted for API compatibility; the context's useAnchorPosition
  // hook (wired to the shared anchorRef/floatingRef) handles the actual positioning.

  return (
    <div
      ref={floatingRef}
      id={cardId}
      popover="manual"
      role="dialog"
      aria-hidden={!open}
      onPointerEnter={(e: React.PointerEvent) => { if (e.pointerType !== "touch") cancelClose(); }}
      onPointerLeave={(e: React.PointerEvent) => { if (e.pointerType !== "touch") scheduleClose(); }}
      className={cn(
        "nova-popover fixed inset-auto m-0",
        "bg-surface border border-border rounded-nova-lg shadow-nova-lg p-4 w-64 text-sm",
        className,
      )}
    >
      {open ? children : null}
    </div>
  );
}
