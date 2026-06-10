import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

const SPRING = "cubic-bezier(0.3, 1.4, 0.4, 1)";
const MOVE_TRANSITION =
  `translate 280ms ${SPRING}, width 280ms ${SPRING}, height 280ms ${SPRING}, ` +
  `border-radius 280ms ${SPRING}, scale 140ms ease, opacity 120ms ease`;
const FADE_TRANSITION = "opacity 120ms ease";

const RING_STYLE: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  pointerEvents: "none",
  zIndex: 9999,
  opacity: 0,
  background: "transparent",
  boxShadow: "0 0 0 2px var(--nova-accent)",
  willChange: "translate, width, height",
};

export interface FocusRingProviderProps {
  children: ReactNode;
  /** Gap in px between the focused element and the ring. */
  offset?: number;
  /** Fixed border-radius; when omitted the target's computed radius is used. */
  radius?: number;
}

/**
 * One floating focus ring per page that slides between keyboard-focused
 * elements instead of teleporting. Pointer-driven focus hides the ring
 * (same modality heuristic as `:focus-visible`).
 *
 * Sets `data-nova-focus-ring` on `<html>` so stylesheets can opt out of
 * per-component focus outlines while the provider is active.
 */
export function FocusRingProvider({ children, offset = 3, radius }: FocusRingProviderProps) {
  const ringRef = useRef<HTMLDivElement | null>(null);
  const optsRef = useRef({ offset, radius });
  optsRef.current = { offset, radius };

  useEffect(() => {
    const ring = ringRef.current;
    if (!ring || typeof document === "undefined") return;

    document.documentElement.setAttribute("data-nova-focus-ring", "");

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let modality: "keyboard" | "pointer" = "pointer";
    let target: HTMLElement | null = null;
    let visible = false;
    let hideRaf = 0;
    let measureRaf = 0;
    let stretchTimer: ReturnType<typeof setTimeout> | null = null;

    const place = (el: HTMLElement, animate: boolean) => {
      const rect = el.getBoundingClientRect();
      const o = optsRef.current.offset;
      let rad = optsRef.current.radius;
      if (rad == null) {
        rad = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
      }
      const shouldAnimate = animate && !reduced?.matches;
      ring.style.transition = shouldAnimate ? MOVE_TRANSITION : FADE_TRANSITION;
      ring.style.translate = `${rect.left - o}px ${rect.top - o}px`;
      ring.style.width = `${rect.width + o * 2}px`;
      ring.style.height = `${rect.height + o * 2}px`;
      ring.style.borderRadius = `${rad + o}px`;
      if (shouldAnimate) {
        // Brief squash-stretch while mid-flight.
        ring.style.scale = "1.02";
        if (stretchTimer) clearTimeout(stretchTimer);
        stretchTimer = setTimeout(() => {
          ring.style.scale = "1";
        }, 140);
      } else {
        ring.style.scale = "1";
      }
    };

    const show = (el: HTMLElement) => {
      if (hideRaf) {
        cancelAnimationFrame(hideRaf);
        hideRaf = 0;
      }
      target = el;
      if (!visible) {
        // Position instantly first so the ring never flies in from elsewhere,
        // then fade in. The reflow commits the new geometry pre-transition.
        place(el, false);
        void ring.getBoundingClientRect();
        ring.style.opacity = "1";
        visible = true;
      } else {
        place(el, true);
      }
    };

    const hide = () => {
      target = null;
      if (!visible) return;
      visible = false;
      ring.style.transition = FADE_TRANSITION;
      ring.style.opacity = "0";
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab" || e.key.startsWith("Arrow")) modality = "keyboard";
      else if (e.key === "Escape") hide();
    };
    const onPointerDown = () => {
      modality = "pointer";
    };
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target;
      if (!(el instanceof HTMLElement) || el === document.body) return;
      if (modality !== "keyboard") {
        hide();
        return;
      }
      show(el);
    };
    const onFocusOut = () => {
      // Hide only if no new focusin lands within a frame.
      if (hideRaf) cancelAnimationFrame(hideRaf);
      hideRaf = requestAnimationFrame(() => {
        hideRaf = 0;
        const active = document.activeElement;
        if (!active || active === document.body || active === document.documentElement) hide();
      });
    };
    const onScrollOrResize = () => {
      if (!visible || !target || measureRaf) return;
      measureRaf = requestAnimationFrame(() => {
        measureRaf = 0;
        if (visible && target) place(target, false);
      });
    };

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      document.documentElement.removeAttribute("data-nova-focus-ring");
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      if (hideRaf) cancelAnimationFrame(hideRaf);
      if (measureRaf) cancelAnimationFrame(measureRaf);
      if (stretchTimer) clearTimeout(stretchTimer);
    };
  }, []);

  return (
    <>
      {children}
      <div ref={ringRef} aria-hidden="true" data-nova-focus-ring-el="" style={RING_STYLE} />
    </>
  );
}
