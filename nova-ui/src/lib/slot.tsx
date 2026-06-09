import {
  Children,
  cloneElement,
  isValidElement,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "./cn";

interface SlotProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  ref?: Ref<HTMLElement>;
}

/**
 * Minimal Slot: merges its own props onto its single child element,
 * enabling the `asChild` pattern without a dependency. Event handlers
 * are chained (child's first), className/style are merged.
 */
export function Slot({ children, ref, ...slotProps }: SlotProps) {
  if (!isValidElement(children)) {
    Children.only(children);
    return null;
  }

  const child = children as ReactElement<Record<string, unknown>>;
  const childProps = child.props;
  const merged: Record<string, unknown> = { ...slotProps };

  for (const key of Object.keys(slotProps)) {
    const slotValue = (slotProps as Record<string, unknown>)[key];
    const childValue = childProps[key];
    if (childValue === undefined) continue;

    if (/^on[A-Z]/.test(key) && typeof slotValue === "function" && typeof childValue === "function") {
      merged[key] = (...args: unknown[]) => {
        (childValue as (...a: unknown[]) => void)(...args);
        (slotValue as (...a: unknown[]) => void)(...args);
      };
    } else if (key === "className") {
      merged[key] = cn(slotValue as string, childValue as string);
    } else if (key === "style") {
      merged[key] = { ...(slotValue as object), ...(childValue as object) };
    } else {
      merged[key] = childValue;
    }
  }

  if (ref) merged.ref = ref;

  return cloneElement(child, merged);
}
