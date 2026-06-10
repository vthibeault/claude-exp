import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

export type AmbientMood = "neutral" | "danger";

interface AmbientContextValue {
  setMood: (mood: AmbientMood) => void;
}

const AmbientContext = createContext<AmbientContextValue | null>(null);

/** Hour boundaries for the evening warm shift (19:00–06:00). */
const NIGHT_START = 19;
const NIGHT_END = 6;
const RECHECK_MS = 30 * 60 * 1000;

const WARM = "oklch(0.8 0.05 60)";
const DANGER = "oklch(0.6 0.12 25)";

export interface AmbientProviderProps {
  children: ReactNode;
  /** Warm the background tokens slightly during evening hours. Default true. */
  timeShift?: boolean;
}

/**
 * Ambient context color: subtly warms `--nova-bg` / `--nova-surface-2` in the
 * evening, and exposes `useAmbient().setMood("danger")` to lean the page
 * background toward red during destructive flows. Original token values are
 * captured once on mount and fully restored on unmount.
 */
export function AmbientProvider({ children, timeShift = true }: AmbientProviderProps) {
  const moodRef = useRef<AmbientMood>("neutral");
  const applyRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    let originalBg = "";
    let originalSurface2 = "";
    try {
      // Clear any stale inline overrides so we read the stylesheet tokens.
      root.style.removeProperty("--nova-bg");
      root.style.removeProperty("--nova-surface-2");
      const cs = getComputedStyle(root);
      originalBg = cs.getPropertyValue("--nova-bg").trim();
      originalSurface2 = cs.getPropertyValue("--nova-surface-2").trim();
    } catch {
      return;
    }

    const apply = () => {
      try {
        const hour = new Date().getHours();
        const night = timeShift && (hour >= NIGHT_START || hour < NIGHT_END);
        const danger = moodRef.current === "danger";

        if (danger && originalBg) {
          root.style.setProperty(
            "--nova-bg",
            `color-mix(in oklch, ${originalBg} 98%, ${DANGER})`,
          );
        } else if (night && originalBg) {
          root.style.setProperty(
            "--nova-bg",
            `color-mix(in oklch, ${originalBg} 97%, ${WARM})`,
          );
        } else {
          root.style.removeProperty("--nova-bg");
        }

        if (night && originalSurface2) {
          root.style.setProperty(
            "--nova-surface-2",
            `color-mix(in oklch, ${originalSurface2} 97%, ${WARM})`,
          );
        } else {
          root.style.removeProperty("--nova-surface-2");
        }

        if (danger) root.dataset.novaMood = "danger";
        else delete root.dataset.novaMood;
      } catch {
        /* DOM write failed — leave tokens untouched */
      }
    };

    applyRef.current = apply;
    apply();
    const interval = setInterval(apply, RECHECK_MS);

    return () => {
      clearInterval(interval);
      applyRef.current = null;
      try {
        root.style.removeProperty("--nova-bg");
        root.style.removeProperty("--nova-surface-2");
        delete root.dataset.novaMood;
      } catch {
        /* ignore */
      }
    };
  }, [timeShift]);

  const setMood = useCallback((mood: AmbientMood) => {
    moodRef.current = mood;
    applyRef.current?.();
  }, []);

  const value = useMemo(() => ({ setMood }), [setMood]);

  return <AmbientContext.Provider value={value}>{children}</AmbientContext.Provider>;
}

/** Access the ambient mood setter. Must be used within an `<AmbientProvider>`. */
export function useAmbient(): AmbientContextValue {
  const ctx = useContext(AmbientContext);
  if (!ctx) throw new Error("useAmbient must be used within an <AmbientProvider>");
  return ctx;
}
