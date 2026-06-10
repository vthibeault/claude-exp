import {
  createContext,
  use,
  useEffect,
  useId,
  useRef,
  useState,
  isValidElement,
  cloneElement,
  type ReactNode,
  type ReactElement,
} from "react";
import { cn } from "@/lib/cn";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface CollapsibleContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  detailsId: string;
  detailsRef: React.RefObject<HTMLDetailsElement | null>;
}

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

function useCollapsible(component: string) {
  const ctx = use(CollapsibleContext);
  if (!ctx) throw new Error(`<${component}> must be used inside <Collapsible>`);
  return ctx;
}

// ---------------------------------------------------------------------------
// Collapsible root
// ---------------------------------------------------------------------------

export interface CollapsibleProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

export function Collapsible({
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  disabled = false,
  children,
  className,
}: CollapsibleProps) {
  const detailsId = useId();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  // Sync the <details> element's open state when controlled.
  useEffect(() => {
    if (detailsRef.current) {
      detailsRef.current.open = open;
    }
  }, [open]);

  const setOpen = (next: boolean) => {
    if (disabled) return;
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  return (
    <CollapsibleContext value={{ open, setOpen, detailsId, detailsRef }}>
      <details
        ref={detailsRef}
        id={detailsId}
        open={defaultOpen}
        className={cn("nova-details group", className)}
        onToggle={(e) => {
          const next = (e.currentTarget as HTMLDetailsElement).open;
          setOpen(next);
        }}
      >
        {children}
      </details>
    </CollapsibleContext>
  );
}

// ---------------------------------------------------------------------------
// CollapsibleTrigger
// ---------------------------------------------------------------------------

export interface CollapsibleTriggerProps {
  children: ReactNode;
  className?: string;
  asChild?: boolean;
}

export function CollapsibleTrigger({ children, className, asChild = false }: CollapsibleTriggerProps) {
  const { open } = useCollapsible("CollapsibleTrigger");

  if (asChild && isValidElement(children)) {
    return (
      <summary className="list-none [&::-webkit-details-marker]:hidden">
        {cloneElement(children as ReactElement<Record<string, unknown>>, {
          "data-open": open || undefined,
        })}
      </summary>
    );
  }

  return (
    <summary
      className={cn(
        "flex cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-sm font-medium",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-nova",
        "transition-colors hover:text-accent list-none [&::-webkit-details-marker]:hidden",
        className,
      )}
    >
      {children}
    </summary>
  );
}

// ---------------------------------------------------------------------------
// CollapsibleContent
// ---------------------------------------------------------------------------

export interface CollapsibleContentProps {
  children: ReactNode;
  className?: string;
}

export function CollapsibleContent({ children, className }: CollapsibleContentProps) {
  return (
    <div className={cn("px-4 pb-4 text-sm text-muted", className)}>
      {children}
    </div>
  );
}
