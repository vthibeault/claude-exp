import {
  Children,
  createContext,
  isValidElement,
  use,
  useState,
  useId,
  type ReactNode,
} from "react";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { hidePopover, showPopover, useAnchorPosition } from "@/lib/use-anchor-position";

// ---------------------------------------------------------------------------
// Context to pass collapsed items up from Breadcrumb to BreadcrumbEllipsis
// ---------------------------------------------------------------------------

interface BreadcrumbContextValue {
  collapsedChildren: ReactNode[];
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({ collapsedChildren: [] });

// ---------------------------------------------------------------------------
// Breadcrumb root
// ---------------------------------------------------------------------------

export interface BreadcrumbProps {
  children: ReactNode;
  /** When set, collapse middle items if count exceeds this number. */
  maxItems?: number;
  className?: string;
}

export function Breadcrumb({ children, maxItems, className }: BreadcrumbProps) {
  const childArray = Children.toArray(children).filter(isValidElement);
  const total = childArray.length;

  let visibleChildren: ReactNode[] = childArray;
  let collapsedChildren: ReactNode[] = [];

  if (maxItems && total > maxItems) {
    // Always show: first item, last 2 items; collapse the rest into ellipsis.
    const first = childArray[0];
    const lastTwo = childArray.slice(-2);
    collapsedChildren = childArray.slice(1, -2);

    visibleChildren = [
      first,
      <BreadcrumbEllipsis key="__ellipsis__" />,
      ...lastTwo,
    ];
  }

  return (
    <BreadcrumbContext value={{ collapsedChildren }}>
      <nav aria-label="breadcrumb" className={className}>
        <ol className="flex items-center gap-1.5 flex-wrap text-sm">{visibleChildren}</ol>
      </nav>
    </BreadcrumbContext>
  );
}

// ---------------------------------------------------------------------------
// BreadcrumbItem
// ---------------------------------------------------------------------------

export interface BreadcrumbItemProps {
  href?: string;
  /** Mark this item as the current page. */
  current?: boolean;
  children: ReactNode;
  className?: string;
}

export function BreadcrumbItem({ href, current, children, className }: BreadcrumbItemProps) {
  return (
    <li className="flex items-center gap-1.5">
      {current ? (
        <span
          aria-current="page"
          className={cn("text-foreground font-medium", className)}
        >
          {children}
        </span>
      ) : (
        <a
          href={href}
          className={cn(
            "text-muted hover:text-foreground transition-colors",
            className,
          )}
        >
          {children}
        </a>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// BreadcrumbSeparator
// ---------------------------------------------------------------------------

export function BreadcrumbSeparator({ children }: { children?: ReactNode }) {
  return (
    <li aria-hidden="true" className="text-muted/50 select-none">
      {children ?? <ChevronRight className="size-3.5" />}
    </li>
  );
}

// ---------------------------------------------------------------------------
// BreadcrumbEllipsis — dropdown showing collapsed items
// ---------------------------------------------------------------------------

export function BreadcrumbEllipsis() {
  const { collapsedChildren } = use(BreadcrumbContext);
  const [open, setOpen] = useState(false);
  const menuId = useId();

  const { anchorRef, floatingRef } = useAnchorPosition<HTMLButtonElement, HTMLDivElement>({
    side: "bottom",
    align: "start",
    open,
  });

  const toggle = () => {
    const next = !open;
    setOpen(next);
    // onDismiss mirrors the onToggle "closed" sync for fallback browsers,
    // where the native toggle event never fires.
    if (next) showPopover(floatingRef.current, () => setOpen(false));
    else hidePopover(floatingRef.current);
  };

  return (
    <li className="flex items-center">
      <button
        ref={anchorRef}
        type="button"
        aria-label="Show more breadcrumbs"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={toggle}
        className={cn(
          "flex items-center gap-0.5 rounded-nova-sm px-1.5 py-0.5 text-muted",
          "hover:text-foreground hover:bg-surface-2 transition-colors",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        <MoreHorizontal className="size-4" />
      </button>

      <div
        ref={floatingRef}
        id={menuId}
        popover="auto"
        onToggle={(e) => {
          if (e.newState === "closed" && open) {
            setOpen(false);
          }
        }}
        className={cn(
          "nova-popover fixed inset-auto m-0 min-w-36 rounded-nova-lg border bg-surface p-1 text-sm text-foreground shadow-nova-lg",
        )}
      >
        {open && collapsedChildren.length > 0 && (
          <ul>
            {collapsedChildren.map((child, i) => (
              <li key={i} className="px-2 py-1.5 rounded-nova-sm hover:bg-surface-2 transition-colors">
                {child}
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}
