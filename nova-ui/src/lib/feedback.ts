export type FeedbackKind = "success" | "error" | "warning" | "destructive";

/** Haptic patterns per kind (ms). `warning` is intentionally silent. */
const VIBRATION: Partial<Record<FeedbackKind, number | number[]>> = {
  success: 10,
  error: [20, 40, 20],
  destructive: 35,
};

/** Safety net in case the CSS animation never fires (e.g. class not styled). */
const FALLBACK_MS = 600;

/**
 * Plays the Nova feedback texture for `kind` on an element: applies the
 * `nova-feedback-<kind>` class (removed on `animationend`, with a timeout
 * fallback) and fires a matching haptic pulse where supported.
 */
export function feedback(el: HTMLElement | null, kind: FeedbackKind): void {
  if (el) {
    const cls = `nova-feedback-${kind}`;

    // Restart cleanly if the same feedback is already playing.
    el.classList.remove(cls);
    void el.offsetWidth; // reflow so re-adding the class restarts the animation

    let done = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const cleanup = () => {
      if (done) return;
      done = true;
      el.classList.remove(cls);
      el.removeEventListener("animationend", onEnd);
      if (timer !== null) clearTimeout(timer);
    };
    const onEnd = (e: AnimationEvent) => {
      if (e.target === el) cleanup();
    };

    el.addEventListener("animationend", onEnd);
    timer = setTimeout(cleanup, FALLBACK_MS);
    el.classList.add(cls);
  }

  const pattern = VIBRATION[kind];
  if (pattern !== undefined && typeof navigator !== "undefined") {
    try {
      navigator.vibrate?.(pattern);
    } catch {
      /* vibrate can throw without user activation — ignore */
    }
  }
}

/**
 * Hook form of {@link feedback}. The returned function has a stable identity
 * (it is the module-level `feedback` itself), so it is safe in dep arrays.
 */
export function useFeedback(): (el: HTMLElement | null, kind: FeedbackKind) => void {
  return feedback;
}
