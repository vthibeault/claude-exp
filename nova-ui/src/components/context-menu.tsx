import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "./dropdown-menu";

export type ContextMenuItem =
  | { type: "item"; label: string; icon?: ReactNode; shortcut?: string; onSelect: () => void; disabled?: boolean }
  | { type: "separator" }
  | { type: "label"; label: string };

export interface ContextMenuProps {
  children: ReactNode;
  items: ContextMenuItem[];
}

interface MenuPosition {
  x: number;
  y: number;
}

const MENU_WIDTH = 200;
const MENU_ITEM_HEIGHT = 32;

export function ContextMenu({ children, items }: ContextMenuProps) {
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = () => setPosition(null);

  const onContextMenu = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const itemCount = items.filter((i) => i.type !== "separator").length;
    const estimatedHeight = itemCount * MENU_ITEM_HEIGHT + 8;
    const x = e.clientX + MENU_WIDTH > window.innerWidth ? e.clientX - MENU_WIDTH : e.clientX;
    const y = e.clientY + estimatedHeight > window.innerHeight ? e.clientY - estimatedHeight : e.clientY;
    setPosition({ x, y });
  };

  useEffect(() => {
    if (!position) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [position]);

  useEffect(() => {
    if (!position) return;
    requestAnimationFrame(() => {
      const firstItem = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
      firstItem?.focus();
    });
  }, [position]);

  const selectableItems = items.filter((i) => i.type === "item" && !i.disabled);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }

    const menuEl = menuRef.current;
    if (!menuEl) return;
    const focusable = Array.from(menuEl.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])'));
    const current = document.activeElement as HTMLElement;
    const idx = focusable.indexOf(current);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusable[(idx + 1) % focusable.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusable[(idx - 1 + focusable.length) % focusable.length]?.focus();
    } else if (e.key === "Enter" && idx >= 0) {
      e.preventDefault();
      current.click();
    }

    void selectableItems;
  };

  return (
    <div ref={containerRef} onContextMenu={onContextMenu} className="contents">
      {children}
      {position && (
        <div
          ref={menuRef}
          role="menu"
          onKeyDown={onKeyDown}
          style={{ position: "fixed", left: position.x, top: position.y, zIndex: 9999 }}
          className={cn(
            "min-w-[160px] rounded-nova-lg border border-border bg-surface py-1 text-sm text-foreground shadow-nova-lg",
            "animate-in fade-in-0 zoom-in-95 duration-100",
          )}
        >
          {items.map((item, i) => {
            if (item.type === "separator") {
              return <DropdownMenuSeparator key={i} />;
            }
            if (item.type === "label") {
              return <DropdownMenuLabel key={i}>{item.label}</DropdownMenuLabel>;
            }
            return (
              <ContextMenuItemWrapper key={i} item={item} onClose={close} />
            );
          })}
        </div>
      )}
    </div>
  );
}

function ContextMenuItemWrapper({
  item,
  onClose,
}: {
  item: Extract<ContextMenuItem, { type: "item" }>;
  onClose: () => void;
}) {
  return (
    <DropdownMenuItem
      disabled={item.disabled}
      onSelect={() => {
        item.onSelect();
        onClose();
      }}
    >
      {item.icon}
      <span className="flex-1">{item.label}</span>
      {item.shortcut && (
        <span className="ml-auto text-xs text-foreground-muted">{item.shortcut}</span>
      )}
    </DropdownMenuItem>
  );
}
