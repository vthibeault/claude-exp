import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

// ---------------------------------------------------------------------------
// usePresence — headless hook
// ---------------------------------------------------------------------------

export interface UsePresenceResult {
  /** Attach to the element being animated in/out. */
  ref: Ref<HTMLElement>;
  /** Whether the element should render in the DOM at all. */
  isMounted: boolean;
  /** Mirrors the `present` input, but stays true until the exit animation ends. */
  isPresent: boolean;
}

/**
 * Holds an element in the DOM long enough for its exit animation to play,
 * then sets `isMounted = false` once the transition/animation finishes.
 *
 * Exit is triggered by setting `data-leaving=""` on the DOM node; CSS
 * should select `[data-leaving]` to drive the leave animation.
 */
export function usePresence(present: boolean): UsePresenceResult {
  const [isMounted, setIsMounted] = useState(present);
  const [isPresent, setIsPresent] = useState(present);
  const nodeRef = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSafetyTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (present) {
      // Enter: mount immediately, clear any leaving state.
      setIsMounted(true);
      setIsPresent(true);
      clearSafetyTimeout();
      if (nodeRef.current) {
        nodeRef.current.removeAttribute("data-leaving");
      }
      return;
    }

    // Exit: tag the node, wait for animation/transition to finish.
    const node = nodeRef.current;
    if (!node) {
      setIsMounted(false);
      setIsPresent(false);
      return;
    }

    setIsPresent(false);
    node.setAttribute("data-leaving", "");

    const unmount = () => {
      clearSafetyTimeout();
      node.removeEventListener("transitionend", onEnd);
      node.removeEventListener("animationend", onEnd);
      setIsMounted(false);
    };

    const onEnd = (e: Event) => {
      // Only react to events on the node itself, not bubbled children.
      if (e.target === node) unmount();
    };

    node.addEventListener("transitionend", onEnd);
    node.addEventListener("animationend", onEnd);

    // Safety fallback: unmount after 300 ms if no animation fires.
    timeoutRef.current = setTimeout(unmount, 300);

    return () => {
      node.removeEventListener("transitionend", onEnd);
      node.removeEventListener("animationend", onEnd);
      clearSafetyTimeout();
    };
  }, [present, clearSafetyTimeout]);

  const ref = useCallback((node: HTMLElement | null) => {
    nodeRef.current = node;
  }, []) as Ref<HTMLElement>;

  return { ref, isMounted, isPresent };
}

// ---------------------------------------------------------------------------
// <Presence> — declarative wrapper
// ---------------------------------------------------------------------------

export interface PresenceProps {
  present: boolean;
  children: ReactNode;
}

/**
 * Keeps its child mounted while an exit animation plays, then removes it.
 *
 * The child must accept a `ref` prop (any HTML element). Exit animations are
 * triggered by the `[data-leaving]` attribute added to the child's DOM node.
 *
 * ```tsx
 * <Presence present={isOpen}>
 *   <div className="fade-out-on-[data-leaving]">…</div>
 * </Presence>
 * ```
 */
export function Presence({ present, children }: PresenceProps) {
  const { ref, isMounted } = usePresence(present);

  if (!isMounted) return null;

  // We need to forward `ref` to the child's DOM node.
  if (isValidElement(children)) {
    return cloneElement(children as ReactElement<Record<string, unknown>>, { ref });
  }

  // If children is not a valid element (e.g. a plain string), wrap it.
  return <span ref={ref as Ref<HTMLSpanElement>}>{children}</span>;
}
