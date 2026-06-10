import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";

// ---------------------------------------------------------------------------
// createVelocityTracker — pure closure, no React state
// ---------------------------------------------------------------------------

interface Sample {
  x: number;
  y: number;
  t: number;
}

/** Window of samples (ms) used to compute the release velocity. */
const VELOCITY_WINDOW = 80;
const MAX_SAMPLES = 24;

export interface VelocityTracker {
  onPointerDown(e: PointerEvent | ReactPointerEvent): void;
  onPointerMove(e: PointerEvent | ReactPointerEvent): void;
  /** returns px/ms velocity vector from the last ~80ms of samples */
  getVelocity(): { vx: number; vy: number };
  reset(): void;
}

/**
 * Ring buffer of pointer samples for "velocity transfer": when a drag is
 * released, the exit animation continues at the speed the finger was moving.
 */
export function createVelocityTracker(): VelocityTracker {
  const samples: Sample[] = [];

  const push = (e: PointerEvent | ReactPointerEvent) => {
    samples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (samples.length > MAX_SAMPLES) samples.shift();
  };

  return {
    onPointerDown(e) {
      samples.length = 0;
      push(e);
    },
    onPointerMove(e) {
      push(e);
    },
    getVelocity() {
      const now = performance.now();
      const recent = samples.filter((s) => now - s.t <= VELOCITY_WINDOW);
      if (recent.length < 2) return { vx: 0, vy: 0 };
      const first = recent[0];
      const last = recent[recent.length - 1];
      const dt = last.t - first.t;
      if (dt <= 0) return { vx: 0, vy: 0 };
      return { vx: (last.x - first.x) / dt, vy: (last.y - first.y) / dt };
    },
    reset() {
      samples.length = 0;
    },
  };
}

// ---------------------------------------------------------------------------
// useSwipeDismiss
// ---------------------------------------------------------------------------

export interface UseSwipeDismissOptions {
  ref: RefObject<HTMLElement | null>;
  axis: "x" | "y";
  onDismiss: () => void;
  /** px distance to count as dismiss, default 80 */
  threshold?: number;
  /** px/ms, default 0.5 — a fast flick dismisses regardless of distance */
  velocityThreshold?: number;
  enabled?: boolean;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Swipe-to-dismiss with velocity transfer. The element follows the pointer
 * along `axis` (with 0.25 resistance the "wrong" way — the dismiss direction
 * is positive: right for `x`, down for `y`). On release it either exits at
 * the flick velocity or springs back with a slight overshoot.
 */
export function useSwipeDismiss(opts: UseSwipeDismissOptions): void {
  const { ref, axis, enabled = true } = opts;
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || typeof window === "undefined") return;

    const prevTouchAction = el.style.touchAction;
    el.style.touchAction = axis === "x" ? "pan-y" : "pan-x";

    const tracker = createVelocityTracker();
    let active = false;
    let pointerId = -1;
    let startCoord = 0;
    let current = 0;

    const translateOf = (v: number) => (axis === "x" ? `${v}px 0px` : `0px ${v}px`);

    const springBack = () => {
      const from = current;
      el.style.translate = "0px 0px";
      try {
        el.animate(
          [
            { translate: translateOf(from) },
            { translate: translateOf(-from * 0.08), offset: 0.7 },
            { translate: "0px 0px" },
          ],
          { duration: 300, easing: "ease-out" },
        );
      } catch {
        /* Web Animations API unavailable — snap back */
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (active || !e.isPrimary || e.button !== 0) return;
      const t = e.target as Element | null;
      if (t?.closest?.("button, a, input, textarea, select, [contenteditable]")) return;
      active = true;
      pointerId = e.pointerId;
      startCoord = axis === "x" ? e.clientX : e.clientY;
      current = 0;
      tracker.onPointerDown(e);
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* capture unsupported */
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!active || e.pointerId !== pointerId) return;
      tracker.onPointerMove(e);
      let delta = (axis === "x" ? e.clientX : e.clientY) - startCoord;
      if (delta < 0) delta *= 0.25; // resistance the wrong way
      current = delta;
      el.style.translate = translateOf(delta);
    };

    const release = () => {
      active = false;
      try {
        el.releasePointerCapture(pointerId);
      } catch {
        /* already released */
      }
      pointerId = -1;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!active || e.pointerId !== pointerId) return;
      tracker.onPointerMove(e);
      release();

      const { threshold = 80, velocityThreshold = 0.5 } = optsRef.current;
      const v = tracker.getVelocity();
      const vel = axis === "x" ? v.vx : v.vy;
      const dist = current;

      if (dist > threshold || vel > velocityThreshold) {
        // Exit, continuing at the release velocity.
        const size = (axis === "x" ? el.offsetWidth : el.offsetHeight) || 200;
        const final = Math.max(dist, 0) + size + 32;
        const remaining = Math.max(final - dist, 0);
        const duration = clamp(remaining / Math.max(vel, 0.8), 120, 400);
        const from = translateOf(dist);
        el.style.translate = translateOf(final);
        const dismiss = () => optsRef.current.onDismiss();
        try {
          const anim = el.animate([{ translate: from }, { translate: translateOf(final) }], {
            duration,
            easing: "ease-out",
            fill: "forwards",
          });
          anim.addEventListener("finish", dismiss, { once: true });
          anim.addEventListener("cancel", dismiss, { once: true });
        } catch {
          dismiss();
        }
      } else {
        springBack();
      }
      current = 0;
      tracker.reset();
    };

    const onPointerCancel = (e: PointerEvent) => {
      if (!active || e.pointerId !== pointerId) return;
      release();
      springBack();
      current = 0;
      tracker.reset();
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerCancel);
      el.style.touchAction = prevTouchAction;
      if (active) release();
    };
  }, [ref, axis, enabled]);
}
