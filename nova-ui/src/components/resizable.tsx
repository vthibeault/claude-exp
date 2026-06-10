import {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

interface PanelConfig {
  id: string;
  size: number;
  minSize: number;
  maxSize: number;
  collapsible: boolean;
}

interface PanelGroupContextValue {
  direction: "horizontal" | "vertical";
  panels: React.MutableRefObject<PanelConfig[]>;
  registerPanel: (config: PanelConfig) => void;
  unregisterPanel: (id: string) => void;
  resizeByIndex: (leftIndex: number, deltaPercent: number) => void;
  collapseByIndex: (leftIndex: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const PanelGroupContext = createContext<PanelGroupContextValue | null>(null);

function usePanelGroup() {
  const ctx = use(PanelGroupContext);
  if (!ctx) throw new Error("Must be used inside <PanelGroup>");
  return ctx;
}

export interface PanelGroupProps {
  direction: "horizontal" | "vertical";
  className?: string;
  children: ReactNode;
  onLayout?: (sizes: number[]) => void;
  id?: string;
}

export function PanelGroup({ direction, className, children, onLayout, id }: PanelGroupProps) {
  const storageKey = id ? `nova-panel-${id}` : null;
  const panelsRef = useRef<PanelConfig[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, forceUpdate] = useState(0);
  const onLayoutRef = useRef(onLayout);
  onLayoutRef.current = onLayout;

  const applyPanelSizes = useCallback(() => {
    const panels = panelsRef.current;
    const container = containerRef.current;
    if (!container) return;
    const panelEls = Array.from(container.querySelectorAll<HTMLElement>("[data-nova-panel]"));
    panelEls.forEach((el, i) => {
      if (panels[i]) el.style.flex = `0 0 ${panels[i].size}%`;
    });
  }, []);

  const registerPanel = useCallback(
    (config: PanelConfig) => {
      if (panelsRef.current.find((p) => p.id === config.id)) return;
      panelsRef.current = [...panelsRef.current, config];

      if (storageKey && panelsRef.current.length > 0) {
        try {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            const sizes: number[] = JSON.parse(saved);
            if (sizes.length === panelsRef.current.length) {
              panelsRef.current = panelsRef.current.map((p, i) => ({ ...p, size: sizes[i] }));
            }
          }
        } catch {}
      }

      forceUpdate((n) => n + 1);
      requestAnimationFrame(applyPanelSizes);
    },
    [storageKey, applyPanelSizes],
  );

  const unregisterPanel = useCallback((panelId: string) => {
    panelsRef.current = panelsRef.current.filter((p) => p.id !== panelId);
    forceUpdate((n) => n + 1);
  }, []);

  const resizeByIndex = useCallback(
    (leftIndex: number, deltaPercent: number) => {
      const panels = panelsRef.current;
      const left = panels[leftIndex];
      const right = panels[leftIndex + 1];
      if (!left || !right) return;

      const newLeft = Math.min(left.maxSize, Math.max(left.minSize, left.size + deltaPercent));
      const actualDelta = newLeft - left.size;
      const newRight = right.size - actualDelta;
      if (newRight < right.minSize || newRight > right.maxSize) return;

      left.size = newLeft;
      right.size = newRight;

      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(panels.map((p) => p.size)));
        } catch {}
      }

      applyPanelSizes();
      onLayoutRef.current?.(panels.map((p) => p.size));
    },
    [storageKey, applyPanelSizes],
  );

  const collapseByIndex = useCallback(
    (leftIndex: number) => {
      const panels = panelsRef.current;
      const left = panels[leftIndex];
      const right = panels[leftIndex + 1];
      if (!left || !right || !left.collapsible) return;

      const isCollapsed = left.size <= left.minSize;
      const targetLeft = isCollapsed ? Math.min(left.maxSize, (left.maxSize + left.minSize) / 2) : left.minSize;
      const delta = targetLeft - left.size;
      const newRight = right.size - delta;
      if (newRight < right.minSize || newRight > right.maxSize) return;

      left.size = targetLeft;
      right.size = newRight;
      applyPanelSizes();
      onLayoutRef.current?.(panels.map((p) => p.size));
    },
    [applyPanelSizes],
  );

  return (
    <PanelGroupContext
      value={{ direction, panels: panelsRef, registerPanel, unregisterPanel, resizeByIndex, collapseByIndex, containerRef }}
    >
      <div
        ref={containerRef}
        className={cn("flex overflow-hidden", direction === "horizontal" ? "flex-row" : "flex-col", className)}
      >
        {children}
      </div>
    </PanelGroupContext>
  );
}

export interface PanelProps {
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  collapsible?: boolean;
  className?: string;
  children: ReactNode;
}

export function Panel({
  defaultSize = 50,
  minSize = 10,
  maxSize = 90,
  collapsible = false,
  className,
  children,
}: PanelProps) {
  const { registerPanel, unregisterPanel } = usePanelGroup();
  const panelId = useId();

  useEffect(() => {
    registerPanel({ id: panelId, size: defaultSize, minSize, maxSize, collapsible });
    return () => unregisterPanel(panelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelId]);

  return (
    <div
      data-nova-panel="true"
      className={cn("overflow-auto", className)}
      style={{ flex: `0 0 ${defaultSize}%`, minWidth: 0, minHeight: 0 }}
    >
      {children}
    </div>
  );
}

export interface PanelResizeHandleProps {
  className?: string;
}

export function PanelResizeHandle({ className }: PanelResizeHandleProps) {
  const { direction, resizeByIndex, collapseByIndex, containerRef } = usePanelGroup();
  const handleRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startPos: number; panelIndex: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const getPanelIndex = useCallback(() => {
    const container = containerRef.current;
    const handle = handleRef.current;
    if (!container || !handle) return -1;
    const children = Array.from(container.children);
    const hIdx = children.indexOf(handle);
    let panelCount = 0;
    for (let i = 0; i < hIdx; i++) {
      if (children[i].getAttribute("data-nova-panel") === "true") panelCount++;
    }
    return panelCount - 1;
  }, [containerRef]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const index = getPanelIndex();
    if (index < 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = {
      startPos: direction === "horizontal" ? e.clientX : e.clientY,
      panelIndex: index,
    };
    setDragging(true);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState.current || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const { startPos, panelIndex } = dragState.current;
    const currentPos = direction === "horizontal" ? e.clientX : e.clientY;
    const delta = currentPos - startPos;
    const container = containerRef.current;
    if (!container) return;
    const totalSize = direction === "horizontal" ? container.offsetWidth : container.offsetHeight;
    const deltaPercent = (delta / totalSize) * 100;
    dragState.current.startPos = currentPos;
    resizeByIndex(panelIndex, deltaPercent);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragState.current = null;
    setDragging(false);
  };

  const onDoubleClick = () => {
    const index = getPanelIndex();
    if (index < 0) return;
    collapseByIndex(index);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const index = getPanelIndex();
    if (index < 0) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      resizeByIndex(index, -1);
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      resizeByIndex(index, 1);
    }
  };

  const isHorizontal = direction === "horizontal";

  return (
    <div
      ref={handleRef}
      role="separator"
      tabIndex={0}
      aria-orientation={isHorizontal ? "vertical" : "horizontal"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={onDoubleClick}
      onKeyDown={onKeyDown}
      className={cn(
        "shrink-0 bg-transparent transition-colors",
        "hover:bg-primary/20 focus-visible:outline-none focus-visible:bg-primary/30",
        dragging && "bg-primary/40",
        isHorizontal
          ? "w-1 self-stretch mx-0.5 cursor-col-resize"
          : "h-1 self-stretch my-0.5 cursor-row-resize",
        className,
      )}
    />
  );
}
