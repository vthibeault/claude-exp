import {
  createContext,
  use,
  useCallback,
  useEffect,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";
import { Tooltip } from "./tooltip";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const ctx = use(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used inside <SidebarProvider>");
  return ctx;
}

// ---------------------------------------------------------------------------
// SidebarProvider
// ---------------------------------------------------------------------------

export interface SidebarProviderProps {
  defaultCollapsed?: boolean;
  children: ReactNode;
}

const STORAGE_KEY = "nova-sidebar-collapsed";

export function SidebarProvider({ defaultCollapsed = false, children }: SidebarProviderProps) {
  const [collapsed, setCollapsedState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored !== null ? stored === "true" : defaultCollapsed;
    } catch {
      return defaultCollapsed;
    }
  });

  const setCollapsed = useCallback((v: boolean) => {
    setCollapsedState(v);
    try {
      localStorage.setItem(STORAGE_KEY, String(v));
    } catch {
      // localStorage unavailable (SSR, private mode) — ignore.
    }
  }, []);

  const toggle = useCallback(() => setCollapsed(!collapsed), [collapsed, setCollapsed]);

  // Cmd+B / Ctrl+B keyboard shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCollapsed(!collapsed);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [collapsed, setCollapsed]);

  return (
    <SidebarContext value={{ collapsed, setCollapsed, toggle }}>
      {children}
    </SidebarContext>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export interface SidebarProps {
  className?: string;
  children: ReactNode;
}

export function Sidebar({ className, children }: SidebarProps) {
  const { collapsed } = useSidebar();

  return (
    <>
      {/* Declare --sidebar-w as an animatable custom property. */}
      <style>{`
        @property --sidebar-w {
          syntax: "<length>";
          inherits: false;
          initial-value: 240px;
        }
      `}</style>
      <nav
        aria-label="Sidebar"
        role="navigation"
        data-collapsed={collapsed || undefined}
        style={
          {
            "--sidebar-w": collapsed ? "56px" : "240px",
            width: "var(--sidebar-w)",
            transition: "width 250ms cubic-bezier(0.4,0,0.2,1)",
          } as React.CSSProperties
        }
        className={cn(
          "relative flex h-full flex-col overflow-hidden border-r border-border bg-surface shrink-0",
          className,
        )}
      >
        {children}
      </nav>
    </>
  );
}

// ---------------------------------------------------------------------------
// SidebarGroup
// ---------------------------------------------------------------------------

export interface SidebarGroupProps {
  label?: string;
  children: ReactNode;
}

export function SidebarGroup({ label, children }: SidebarGroupProps) {
  const { collapsed } = useSidebar();

  return (
    <div className="mb-2">
      {label && (
        <p
          className={cn(
            "mb-1 px-3 text-xs font-medium uppercase tracking-wider text-subtle transition-opacity duration-200",
            collapsed ? "opacity-0 select-none" : "opacity-100",
          )}
          aria-hidden={collapsed}
        >
          {label}
        </p>
      )}
      <ul role="list" className="flex flex-col gap-0.5 px-2">
        {children}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SidebarItem
// ---------------------------------------------------------------------------

export interface SidebarItemProps {
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  active?: boolean;
  children: ReactNode;
  badge?: ReactNode;
}

export function SidebarItem({ href, onClick, icon, active, children, badge }: SidebarItemProps) {
  const { collapsed } = useSidebar();

  const sharedClass = cn(
    "flex w-full items-center gap-2.5 rounded-nova px-2.5 py-2 text-sm transition-colors duration-150",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "bg-accent/10 text-accent font-medium"
      : "text-foreground hover:bg-surface-2 focus-visible:bg-surface-2",
    collapsed && "justify-center px-0",
  );

  const inner = collapsed ? (
    <>
      {icon && <span className="size-5 shrink-0 [&_svg]:size-5">{icon}</span>}
    </>
  ) : (
    <>
      {icon && <span className="size-5 shrink-0 [&_svg]:size-5">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
      {badge && <span className="ml-auto shrink-0">{badge}</span>}
    </>
  );

  const element = href ? (
    <a href={href} className={sharedClass} aria-current={active ? "page" : undefined}>
      {inner}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={sharedClass} aria-current={active ? "page" : undefined}>
      {inner}
    </button>
  );

  if (collapsed) {
    return (
      <li>
        <Tooltip content={children} side="right" delay={150}>
          {element}
        </Tooltip>
      </li>
    );
  }

  return <li>{element}</li>;
}

// ---------------------------------------------------------------------------
// SidebarToggle
// ---------------------------------------------------------------------------

export function SidebarToggle({ className, ...props }: HTMLAttributes<HTMLButtonElement>) {
  const { collapsed, toggle } = useSidebar();

  return (
    <div className={cn("mt-auto border-t border-border p-2", collapsed ? "flex justify-center" : "")}>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn("text-muted", className)}
        {...props}
      >
        {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
      </Button>
    </div>
  );
}
