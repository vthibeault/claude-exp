import {
  cloneElement,
  createContext,
  isValidElement,
  use,
  useId,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
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

interface MenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  menuId: string;
  anchorRef: RefObject<HTMLElement | null>;
  floatingRef: RefObject<HTMLDivElement | null>;
}

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenu(component: string) {
  const ctx = use(MenuContext);
  if (!ctx) throw new Error(`<${component}> must be used inside <DropdownMenu>`);
  return ctx;
}

export interface DropdownMenuProps {
  side?: Side;
  align?: Align;
  children: ReactNode;
}

/** Action menu in the top layer (Popover API) with full keyboard navigation. */
export function DropdownMenu({ side = "bottom", align = "start", children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  const { anchorRef, floatingRef } = useAnchorPosition<HTMLElement, HTMLDivElement>({
    side,
    align,
    open,
  });

  const set = (next: boolean) => {
    setOpen(next);
    // onDismiss mirrors the onToggle "closed" sync for fallback browsers,
    // where the native toggle event never fires.
    if (next)
      showPopover(floatingRef.current, () => {
        setOpen(false);
        anchorRef.current?.focus();
      });
    else hidePopover(floatingRef.current);
  };

  return <MenuContext value={{ open, setOpen: set, menuId, anchorRef, floatingRef }}>{children}</MenuContext>;
}

export function DropdownMenuTrigger({ children }: { children: ReactElement<Record<string, unknown>> }) {
  const { open, setOpen, menuId, anchorRef, floatingRef } = useMenu("DropdownMenuTrigger");
  if (!isValidElement(children)) return null;

  return cloneElement(children, {
    ref: anchorRef,
    "aria-haspopup": "menu",
    "aria-expanded": open,
    "aria-controls": menuId,
    onClick: (e: MouseEvent) => {
      (children.props.onClick as ((e: MouseEvent) => void) | undefined)?.(e);
      setOpen(!open);
      if (!open) {
        // Focus the first item once the panel is visible.
        requestAnimationFrame(() => {
          floatingRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
        });
      }
    },
    onKeyDown: (e: ReactKeyboardEvent) => {
      (children.props.onKeyDown as ((e: ReactKeyboardEvent) => void) | undefined)?.(e);
      if (e.key === "ArrowDown" && !open) {
        e.preventDefault();
        setOpen(true);
        requestAnimationFrame(() => {
          floatingRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
        });
      }
    },
  });
}

type ReactKeyboardEvent = KeyboardEvent<HTMLElement>;

export function DropdownMenuContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen, menuId, floatingRef, anchorRef } = useMenu("DropdownMenuContent");

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      floatingRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ??
        [],
    );
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement as HTMLElement);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(index + 1) % items.length].focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(index - 1 + items.length) % items.length].focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0].focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1].focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div
      ref={floatingRef}
      id={menuId}
      role="menu"
      popover="auto"
      onKeyDown={onKeyDown}
      onToggle={(e) => {
        if (e.newState === "closed" && open) {
          setOpen(false);
          anchorRef.current?.focus();
        }
        if (e.newState === "open" && !open) setOpen(true);
      }}
      className={cn(
        "nova-popover fixed inset-auto m-0 min-w-44 rounded-nova-lg border bg-surface p-1 text-sm text-foreground shadow-nova-lg",
        className,
      )}
      {...props}
    >
      {open ? children : null}
    </div>
  );
}

export interface DropdownMenuItemProps extends HTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
  destructive?: boolean;
  onSelect?: () => void;
}

export function DropdownMenuItem({
  className,
  disabled,
  destructive,
  onSelect,
  onClick,
  ...props
}: DropdownMenuItemProps) {
  const { setOpen } = useMenu("DropdownMenuItem");

  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || disabled) return;
        onSelect?.();
        setOpen(false);
      }}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-nova-sm px-2.5 py-1.5 text-left",
        "outline-none transition-colors duration-100",
        "focus:bg-surface-2 hover:bg-surface-2",
        "disabled:pointer-events-none disabled:opacity-50",
        destructive && "text-danger focus:bg-danger-soft hover:bg-danger-soft",
        "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted",
        destructive && "[&_svg]:text-danger",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div role="separator" className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}

export function DropdownMenuLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-2.5 py-1.5 text-xs font-medium text-subtle", className)} {...props} />
  );
}
