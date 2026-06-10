import { useEffect, useRef, useState, type RefObject } from "react";

// ---------------------------------------------------------------------------
// Shared document pointermove listener (one per page, rAF-throttled)
// ---------------------------------------------------------------------------

export interface PointerSample {
  /** Current pointer position (latest rAF sample). */
  x: number;
  y: number;
  t: number;
  /** Previous rAF sample (valid only when hasPrev). */
  px: number;
  py: number;
  pt: number;
  hasPrev: boolean;
}

type Subscriber = (s: PointerSample) => void;

const subscribers = new Set<Subscriber>();
const sample: PointerSample = { x: 0, y: 0, t: 0, px: 0, py: 0, pt: 0, hasPrev: false };
let rafId = 0;
let pendingX = 0;
let pendingY = 0;
let hasPending = false;
let hasLast = false;

function flush() {
  rafId = 0;
  if (!hasPending) return;
  hasPending = false;
  if (hasLast) {
    sample.px = sample.x;
    sample.py = sample.y;
    sample.pt = sample.t;
    sample.hasPrev = true;
  }
  sample.x = pendingX;
  sample.y = pendingY;
  sample.t = performance.now();
  hasLast = true;
  for (const fn of subscribers) fn(sample);
}

function onPointerMove(e: PointerEvent) {
  pendingX = e.clientX;
  pendingY = e.clientY;
  hasPending = true;
  if (!rafId) rafId = requestAnimationFrame(flush);
}

function subscribe(fn: Subscriber): () => void {
  if (subscribers.size === 0) {
    document.addEventListener("pointermove", onPointerMove, { passive: true });
  }
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0) {
      document.removeEventListener("pointermove", onPointerMove);
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      hasPending = false;
      hasLast = false;
      sample.hasPrev = false;
    }
  };
}

const isCoarsePointer = () =>
  typeof window === "undefined" ||
  typeof window.matchMedia !== "function" ||
  window.matchMedia("(pointer: coarse)").matches;

// ---------------------------------------------------------------------------
// useProximity — pre-hover
// ---------------------------------------------------------------------------

/**
 * Tracks how close the pointer is to the element's nearest edge using a
 * single shared document listener. `near` flips when within `radius` px,
 * letting components style `data-near={near}` before an actual hover.
 * Always `{ near: false }` on coarse (touch) pointers.
 */
export function useProximity<T extends HTMLElement>(opts?: {
  radius?: number;
}): { ref: RefObject<T | null>; near: boolean; distance: number } {
  const radius = opts?.radius ?? 80;
  const ref = useRef<T | null>(null);
  const [state, setState] = useState({ near: false, distance: Infinity });

  useEffect(() => {
    if (isCoarsePointer()) return;
    let lastNear = false;
    let lastDistance = Infinity;

    return subscribe((s) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = Math.max(r.left - s.x, 0, s.x - r.right);
      const dy = Math.max(r.top - s.y, 0, s.y - r.bottom);
      const distance = Math.round(Math.hypot(dx, dy));
      const near = distance < radius;
      // Only re-render when `near` flips, or the distance changes while near.
      if (near !== lastNear || (near && distance !== lastDistance)) {
        lastNear = near;
        lastDistance = distance;
        setState({ near, distance });
      }
    });
  }, [radius]);

  return { ref, near: state.near, distance: state.distance };
}

// ---------------------------------------------------------------------------
// useTrajectoryIntent — the pointer is heading toward the element
// ---------------------------------------------------------------------------

/** Parametric ray vs rect (slab) intersection over t ∈ [0, tMax]. */
function rayHitsRect(
  x: number,
  y: number,
  vx: number,
  vy: number,
  tMax: number,
  r: DOMRect,
): boolean {
  let t0 = 0;
  let t1 = tMax;
  if (vx === 0) {
    if (x < r.left || x > r.right) return false;
  } else {
    let ta = (r.left - x) / vx;
    let tb = (r.right - x) / vx;
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta);
    t1 = Math.min(t1, tb);
    if (t0 > t1) return false;
  }
  if (vy === 0) {
    if (y < r.top || y > r.bottom) return false;
  } else {
    let ta = (r.top - y) / vy;
    let tb = (r.bottom - y) / vy;
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta);
    t1 = Math.min(t1, tb);
    if (t0 > t1) return false;
  }
  return true;
}

/** How far ahead (ms) the pointer trajectory is extrapolated. */
const LOOKAHEAD_MS = 250;
/** Minimum pointer speed (px/ms) before intent is considered. */
const MIN_SPEED = 0.3;

/**
 * Fires `onIntent` when the pointer is moving toward the element (its
 * extrapolated path over the next 250ms crosses the element's rect at
 * sufficient speed). Useful for pre-opening menus or prefetching.
 * Rate-limited to once per `cooldownMs` (default 1500).
 */
export function useTrajectoryIntent<T extends HTMLElement>(opts: {
  onIntent: () => void;
  cooldownMs?: number;
}): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const onIntentRef = useRef(opts.onIntent);
  onIntentRef.current = opts.onIntent;
  const cooldownMs = opts.cooldownMs ?? 1500;

  useEffect(() => {
    if (isCoarsePointer()) return;
    let lastFired = -Infinity;

    return subscribe((s) => {
      if (!s.hasPrev) return;
      const el = ref.current;
      if (!el) return;
      const now = s.t;
      if (now - lastFired < cooldownMs) return;
      const dt = s.t - s.pt;
      if (dt <= 0) return;
      const vx = (s.x - s.px) / dt;
      const vy = (s.y - s.py) / dt;
      if (Math.hypot(vx, vy) <= MIN_SPEED) return;
      if (rayHitsRect(s.x, s.y, vx, vy, LOOKAHEAD_MS, el.getBoundingClientRect())) {
        lastFired = now;
        onIntentRef.current();
      }
    });
  }, [cooldownMs]);

  return ref;
}
