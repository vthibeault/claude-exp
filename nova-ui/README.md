# Nova UI

A next-gen React component library that leans on the **native web platform** instead of JavaScript re-implementations. Fewer dependencies, less JS shipped, better accessibility by default.

## Stack

| Layer | Tech |
| --- | --- |
| Components | React 19 (ref-as-prop — no `forwardRef` anywhere) |
| Styling | Tailwind CSS v4, CSS-first `@theme` config |
| Color | OKLCH design tokens (perceptually uniform, wide-gamut ready) |
| Variants | class-variance-authority + tailwind-merge |
| Build | Vite library mode, ESM + rolled-up `.d.ts` |
| Tests | Vitest + Testing Library |

## Platform-first primitives

| Component | Platform feature it's built on | What you get for free |
| --- | --- | --- |
| `Dialog` / sheet | native `<dialog>` | top layer, focus trap, inert background, Esc |
| `Popover`, `DropdownMenu`, `Tooltip` | Popover API (`popover="auto"` / `"manual"`) | top layer, light dismiss, no clipping by `overflow: hidden` |
| `Accordion` | `<details name>` | browser-enforced single-open, find-in-page auto-expand |
| Enter/exit animations | `@starting-style` + `transition-behavior: allow-discrete` | CSS-only animation of `display: none` top-layer elements |
| Accordion height animation | `interpolate-size: allow-keywords` | transition to `height: auto` with zero JS measurement |
| `Textarea` | `field-sizing: content` | auto-growing textarea, no resize observers |
| `Card` layouts | container queries (`@container`) | components adapt to their own width, not the viewport |
| Theme switch (demo) | View Transitions API | animated light/dark crossfade |
| `Select`, `Checkbox` | styled native elements | OS pickers on mobile, full AT support |

Everything degrades gracefully: feature detection guards the Popover API calls, accordions snap open without `interpolate-size`, and reduced-motion preferences disable transitions.

## Components

**Primitives** — `Button` (variants, sizes, `loading`, `asChild`) · `Badge` · `Card` · `Input` · `Textarea` · `Label` · `Field` (auto-wired ids/ARIA) · `Select` · `Switch` · `Checkbox` · `Tabs` (roving tabindex) · `Dialog` (modal + sheet) · `Popover` · `DropdownMenu` (full keyboard nav) · `Tooltip` · `Accordion` · `Toast` (`useToast`) · `Avatar` · `Progress` · `Skeleton` · `Spinner` · `Kbd` · `Separator`

**Charts** (zero-dependency SVG, OKLCH palette, hover tooltips, ResizeObserver-responsive) — `LineChart` (line/area, smoothed) · `BarChart` (grouped/stacked) · `DonutChart` · `Sparkline`

**Data** — `DataTable` (search, sort, paginate, row selection, column visibility — headless `useDataTable` hook included) · `DataGrid` (editable cells, spreadsheet arrow-key navigation, type-to-edit) · `PivotTable` (configurable row/column/value fields, sum/avg/count/min/max aggregations, collapsible groups, subtotals on every group level, grand total row + column — pure `buildPivot` engine exported separately) · `Pagination`

**Advanced inputs** — `Combobox` (ARIA 1.2, `aria-activedescendant`) · `TagInput` (tokens + suggestions) · `Calendar` / `DatePicker` (`role="grid"` keyboard nav, Intl-only — no date lib) · `Slider` (single + dual-thumb range) · `NumberInput` (steppers, clamping) · `PinInput` (OTP, paste support) · `FileUpload` (drag & drop)

## Usage

```tsx
import { Button, Field, Input, ToastProvider, useToast } from "@nova-ui/react";
import "@nova-ui/react/styles.css";

function Example() {
  const { toast } = useToast();
  return (
    <Field label="Email" description="We'll never share it." required>
      <Input type="email" placeholder="you@example.com" />
    </Field>
  );
}
```

Dark mode: add the `dark` class to `<html>`. All tokens flip automatically.

## Development

```bash
npm install
npm run dev        # showcase site with every component
npm test           # vitest + testing-library
npm run build      # library bundle (dist/)
npm run build:demo # static demo site (dist-demo/)
```

## Theming

All design decisions live in `src/styles/nova.css` as CSS custom properties — override any `--nova-*` variable to re-brand without touching components:

```css
:root {
  --nova-accent: oklch(60% 0.2 200); /* teal brand */
  --nova-radius: 1rem;
}
```
