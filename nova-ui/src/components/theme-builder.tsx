import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OklchColor {
  l: number; // 0–1
  c: number; // 0–0.37
  h: number; // 0–360
}

type ColorRole = "primary" | "success" | "warning" | "danger" | "info" | "surface" | "background";

type ThemeState = Record<ColorRole, OklchColor>;

// ── CSS variable map ──────────────────────────────────────────────────────────

const COLOR_ROLE_VARS: Record<ColorRole, string> = {
  primary:    "--nova-accent",
  success:    "--nova-success",
  warning:    "--nova-warning",
  danger:     "--nova-danger",
  info:       "--nova-chart-2",
  surface:    "--nova-surface",
  background: "--nova-bg",
};

const COLOR_ROLE_LABELS: Record<ColorRole, string> = {
  primary:    "Primary",
  success:    "Success",
  warning:    "Warning",
  danger:     "Danger",
  info:       "Info",
  surface:    "Surface",
  background: "Background",
};

const COLOR_ROLES = Object.keys(COLOR_ROLE_VARS) as ColorRole[];

// ── Radius token base values (rem) ────────────────────────────────────────────

const RADIUS_BASE = 0.625; // rem — same as --nova-radius default

// ── Preset palettes ───────────────────────────────────────────────────────────

const PRESETS: Record<string, ThemeState & { radius: number }> = {
  Default: {
    primary:    { l: 0.54, c: 0.23, h: 277 },
    success:    { l: 0.62, c: 0.17, h: 152 },
    warning:    { l: 0.76, c: 0.16, h: 75  },
    danger:     { l: 0.58, c: 0.21, h: 25  },
    info:       { l: 0.68, c: 0.15, h: 190 },
    surface:    { l: 1.00, c: 0.00, h: 0   },
    background: { l: 0.985,c: 0.002,h: 247 },
    radius: 1,
  },
  Ocean: {
    primary:    { l: 0.55, c: 0.18, h: 220 },
    success:    { l: 0.60, c: 0.15, h: 170 },
    warning:    { l: 0.74, c: 0.15, h: 80  },
    danger:     { l: 0.56, c: 0.20, h: 15  },
    info:       { l: 0.65, c: 0.18, h: 200 },
    surface:    { l: 0.99, c: 0.005,h: 220 },
    background: { l: 0.97, c: 0.004,h: 220 },
    radius: 1.2,
  },
  Forest: {
    primary:    { l: 0.52, c: 0.16, h: 140 },
    success:    { l: 0.58, c: 0.18, h: 145 },
    warning:    { l: 0.74, c: 0.15, h: 70  },
    danger:     { l: 0.55, c: 0.19, h: 20  },
    info:       { l: 0.60, c: 0.14, h: 175 },
    surface:    { l: 0.99, c: 0.003,h: 140 },
    background: { l: 0.97, c: 0.004,h: 140 },
    radius: 0.75,
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function toOklch(color: OklchColor): string {
  return `oklch(${color.l.toFixed(3)} ${color.c.toFixed(3)} ${color.h.toFixed(1)})`;
}

/** Parse `oklch(L C H)` — returns null on failure. */
function parseOklch(value: string): OklchColor | null {
  const m = value.trim().match(/oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)/i);
  if (!m) return null;
  const lRaw = m[1];
  const l = lRaw.endsWith("%") ? parseFloat(lRaw) / 100 : parseFloat(lRaw);
  return { l, c: parseFloat(m[2]), h: parseFloat(m[3]) };
}

function applyTokens(theme: ThemeState, radius: number) {
  const root = document.documentElement;
  for (const role of COLOR_ROLES) {
    root.style.setProperty(COLOR_ROLE_VARS[role], toOklch(theme[role]));
  }
  const r = (RADIUS_BASE * radius).toFixed(4);
  root.style.setProperty("--nova-radius", `${r}rem`);
}

function removeTokenOverrides() {
  const root = document.documentElement;
  for (const role of COLOR_ROLES) {
    root.style.removeProperty(COLOR_ROLE_VARS[role]);
  }
  root.style.removeProperty("--nova-radius");
}

function readCurrentTokens(): ThemeState {
  const computed = getComputedStyle(document.documentElement);
  const state = {} as ThemeState;
  for (const role of COLOR_ROLES) {
    const raw = computed.getPropertyValue(COLOR_ROLE_VARS[role]).trim();
    state[role] = parseOklch(raw) ?? PRESETS.Default[role];
  }
  return state;
}

function buildCssBlock(theme: ThemeState, radius: number): string {
  const r = (RADIUS_BASE * radius).toFixed(4);
  const lines = [":root {"];
  for (const role of COLOR_ROLES) {
    lines.push(`  ${COLOR_ROLE_VARS[role]}: ${toOklch(theme[role])};`);
  }
  lines.push(`  --nova-radius: ${r}rem;`);
  lines.push("}");
  return lines.join("\n");
}

// ── Inline Slider ─────────────────────────────────────────────────────────────

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  trackBackground: string;
  onChange: (v: number) => void;
  displayValue?: string;
}

function DimensionSlider({ label, value, min, max, step, trackBackground, onChange, displayValue }: SliderProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">{label}</span>
        <span className="font-mono text-xs text-subtle">{displayValue ?? value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          appearance: "none" as React.CSSProperties["appearance"],
          WebkitAppearance: "none",
          height: 6,
          borderRadius: 3,
          background: trackBackground,
          cursor: "pointer",
          width: "100%",
          outline: "none",
        }}
      />
    </div>
  );
}

// ── Track gradient builders ───────────────────────────────────────────────────

function hueGradient(c: number, l: number) {
  const stops = Array.from({ length: 13 }, (_, i) => {
    const h = (i / 12) * 360;
    return `oklch(${l.toFixed(2)} ${c.toFixed(2)} ${h.toFixed(0)})`;
  });
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

function chromaGradient(l: number, h: number) {
  return `linear-gradient(to right, oklch(${l.toFixed(2)} 0 ${h.toFixed(0)}), oklch(${l.toFixed(2)} 0.37 ${h.toFixed(0)}))`;
}

function lightnessGradient(c: number, h: number) {
  return `linear-gradient(to right, oklch(0 ${c.toFixed(2)} ${h.toFixed(0)}), oklch(0.5 ${c.toFixed(2)} ${h.toFixed(0)}), oklch(1 ${c.toFixed(2)} ${h.toFixed(0)}))`;
}

// ── Main component ────────────────────────────────────────────────────────────

export interface ThemeBuilderProps {
  className?: string;
  onExport?: (css: string) => void;
}

export function ThemeBuilder({ className, onExport }: ThemeBuilderProps) {
  const [theme, setTheme] = useState<ThemeState>(PRESETS.Default);
  const [radius, setRadius] = useState(1);

  // Read current CSS vars on mount for initial state.
  useEffect(() => {
    if (typeof document !== "undefined") {
      setTheme(readCurrentTokens());
    }
  }, []);

  // Apply tokens whenever theme/radius changes.
  useEffect(() => {
    if (typeof document !== "undefined") {
      applyTokens(theme, radius);
    }
  }, [theme, radius]);

  // Restore on unmount.
  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        removeTokenOverrides();
      }
    };
  }, []);

  const updateColor = useCallback((role: ColorRole, patch: Partial<OklchColor>) => {
    setTheme((prev) => ({ ...prev, [role]: { ...prev[role], ...patch } }));
  }, []);

  const loadPreset = (name: string) => {
    const preset = PRESETS[name];
    if (!preset) return;
    const { radius: r, ...colors } = preset;
    setTheme(colors as ThemeState);
    setRadius(r);
  };

  const handleExport = () => {
    onExport?.(buildCssBlock(theme, radius));
  };

  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-nova-lg p-4 flex flex-col gap-4",
        className,
      )}
    >
      {/* Preset buttons */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Presets</p>
        <div className="flex gap-2">
          {Object.keys(PRESETS).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => loadPreset(name)}
              className="rounded-nova-sm border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-2/60 hover:text-foreground text-muted"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Color roles */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Colors</p>
        {COLOR_ROLES.map((role) => {
          const color = theme[role];
          const oklchStr = toOklch(color);
          return (
            <div key={role} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3">
                {/* Swatch */}
                <div
                  className="w-8 h-8 rounded-full ring-1 ring-border shrink-0"
                  style={{ background: oklchStr }}
                  title={oklchStr}
                />
                {/* Label + value */}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium leading-none">{COLOR_ROLE_LABELS[role]}</span>
                  <span className="font-mono text-xs text-subtle truncate">{oklchStr}</span>
                </div>
              </div>
              {/* Sliders */}
              <div className="flex flex-col gap-1 pl-11">
                <DimensionSlider
                  label="Lightness"
                  value={color.l}
                  min={0}
                  max={1}
                  step={0.005}
                  trackBackground={lightnessGradient(color.c, color.h)}
                  onChange={(l) => updateColor(role, { l })}
                  displayValue={color.l.toFixed(3)}
                />
                <DimensionSlider
                  label="Chroma"
                  value={color.c}
                  min={0}
                  max={0.37}
                  step={0.002}
                  trackBackground={chromaGradient(color.l, color.h)}
                  onChange={(c) => updateColor(role, { c })}
                  displayValue={color.c.toFixed(3)}
                />
                <DimensionSlider
                  label="Hue"
                  value={color.h}
                  min={0}
                  max={360}
                  step={1}
                  trackBackground={hueGradient(color.c, color.l)}
                  onChange={(h) => updateColor(role, { h })}
                  displayValue={`${Math.round(color.h)}°`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Radius */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Border Radius</p>
        <DimensionSlider
          label="Scale"
          value={radius}
          min={0.5}
          max={2}
          step={0.05}
          trackBackground="linear-gradient(to right, var(--nova-surface-2), var(--nova-accent))"
          onChange={setRadius}
          displayValue={`${radius.toFixed(2)}× (${(RADIUS_BASE * radius).toFixed(3)}rem)`}
        />
      </div>

      {/* Export */}
      <button
        type="button"
        onClick={handleExport}
        className="rounded-nova-sm bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Export CSS
      </button>
    </div>
  );
}
