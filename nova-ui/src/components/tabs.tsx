import {
  createContext,
  use,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/cn";

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
  baseId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(component: string) {
  const ctx = use(TabsContext);
  if (!ctx) throw new Error(`<${component}> must be used inside <Tabs>`);
  return ctx;
}

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({ value, defaultValue, onValueChange, className, children, ...props }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;
  const baseId = useId();

  const setValue = (v: string) => {
    if (!isControlled) setInternal(v);
    onValueChange?.(v);
  };

  return (
    <TabsContext value={{ value: current, setValue, baseId }}>
      <div className={cn("flex flex-col gap-3", className)} {...props}>
        {children}
      </div>
    </TabsContext>
  );
}

export function TabsList({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const listRef = useRef<HTMLDivElement>(null);

  // Roving tabindex: arrow keys move focus and selection together.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])') ?? [],
    );
    if (tabs.length === 0) return;
    const currentIndex = tabs.indexOf(document.activeElement as HTMLButtonElement);

    let next = -1;
    if (e.key === "ArrowRight") next = (currentIndex + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next === -1) return;

    e.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={onKeyDown}
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-nova bg-surface-2 p-1",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
  disabled?: boolean;
}

export function TabsTrigger({ value, className, disabled, ...props }: TabsTriggerProps) {
  const { value: current, setValue, baseId } = useTabs("TabsTrigger");
  const selected = current === value;

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      data-state={selected ? "active" : "inactive"}
      onClick={() => setValue(value)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-nova-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap",
        "transition-colors duration-150",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        selected ? "bg-surface text-foreground shadow-nova-sm" : "text-muted hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ value, className, ...props }: TabsContentProps) {
  const { value: current, baseId } = useTabs("TabsContent");
  if (current !== value) return null;

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      tabIndex={0}
      className={cn("outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-nova", className)}
      {...props}
    />
  );
}
