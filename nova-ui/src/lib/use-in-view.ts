import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Fires once when the observed element enters the viewport.
 *
 * Usage A — pass an existing ref (e.g. from useMeasure), returns just the boolean:
 *   const inView = useInView(ref);
 *
 * Usage B — standalone, creates its own ref:
 *   const { ref, inView } = useInView<HTMLDivElement>();
 *
 * Falls back to inView = true immediately when IntersectionObserver is unavailable.
 */
export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  opts?: IntersectionObserverInit,
): boolean;
export function useInView<T extends Element>(
  opts?: IntersectionObserverInit,
): { ref: RefObject<T | null>; inView: boolean };
export function useInView<T extends Element>(
  refOrOpts?: RefObject<T | null> | IntersectionObserverInit,
  maybeOpts?: IntersectionObserverInit,
): boolean | { ref: RefObject<T | null>; inView: boolean } {
  const ownRef = useRef<T | null>(null);

  const isRef =
    refOrOpts !== undefined &&
    typeof refOrOpts === "object" &&
    "current" in (refOrOpts as object);

  const target = isRef ? (refOrOpts as RefObject<T | null>) : ownRef;
  const observerOpts = isRef
    ? maybeOpts
    : (refOrOpts as IntersectionObserverInit | undefined);

  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const el = target.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, ...observerOpts },
    );
    observer.observe(el);
    return () => observer.disconnect();
  // Run once on mount — the element in the ref is stable across renders.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isRef) return inView;
  return { ref: ownRef, inView };
}
