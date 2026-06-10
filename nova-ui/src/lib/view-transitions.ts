import { useEffect, useRef, type RefObject } from "react";

/**
 * Runs a DOM/state update inside `document.startViewTransition` when the
 * browser supports it, so the old and new states cross-fade (or morph, for
 * elements sharing a `view-transition-name`). Falls back to running the
 * update directly. Resolves when the transition (or update) settles.
 */
export function withViewTransition(update: () => void | Promise<void>): Promise<void> {
  if (typeof document !== "undefined" && typeof document.startViewTransition === "function") {
    try {
      const transition = document.startViewTransition(update);
      // Swallow skipped/aborted transitions — the update itself still ran.
      return transition.finished.catch(() => undefined);
    } catch {
      /* fall through to the plain update */
    }
  }
  return Promise.resolve(update()).then(() => undefined);
}

/**
 * Assigns a `view-transition-name` to the element on mount and clears it on
 * unmount, so the element participates in view transitions started via
 * {@link withViewTransition}. Harmless in unsupporting browsers.
 */
export function useViewTransitionName<T extends HTMLElement>(name: string): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      el.style.setProperty("view-transition-name", name);
    } catch {
      /* ignore */
    }
    return () => {
      try {
        el.style.removeProperty("view-transition-name");
      } catch {
        /* ignore */
      }
    };
  }, [name]);

  return ref;
}
