import { useCallback, useLayoutEffect, useRef } from "react";

export type Side = "top" | "bottom" | "left" | "right";
export type Align = "start" | "center" | "end";

interface Options {
  side?: Side;
  align?: Align;
  offset?: number;
  open: boolean;
}

/**
 * Positions a top-layer [popover] element relative to an anchor.
 *
 * The Popover API gives us the top layer, light dismiss and Esc handling
 * natively; this hook only computes coordinates (with viewport collision
 * flipping) so we stay dependency-free. Repositions on scroll/resize
 * while open.
 */
export function useAnchorPosition<A extends HTMLElement, F extends HTMLElement>({
  side = "bottom",
  align = "center",
  offset = 6,
  open,
}: Options) {
  const anchorRef = useRef<A | null>(null);
  const floatingRef = useRef<F | null>(null);

  const update = useCallback(() => {
    const anchor = anchorRef.current;
    const floating = floatingRef.current;
    if (!anchor || !floating) return;

    const a = anchor.getBoundingClientRect();
    const f = floating.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    let actualSide = side;
    if (side === "bottom" && a.bottom + offset + f.height > vh && a.top - offset - f.height > 0) {
      actualSide = "top";
    } else if (side === "top" && a.top - offset - f.height < 0) {
      actualSide = "bottom";
    } else if (side === "right" && a.right + offset + f.width > vw && a.left - offset - f.width > 0) {
      actualSide = "left";
    } else if (side === "left" && a.left - offset - f.width < 0) {
      actualSide = "right";
    }

    let top = 0;
    let left = 0;

    if (actualSide === "top" || actualSide === "bottom") {
      top = actualSide === "bottom" ? a.bottom + offset : a.top - offset - f.height;
      left =
        align === "start" ? a.left : align === "end" ? a.right - f.width : a.left + a.width / 2 - f.width / 2;
    } else {
      left = actualSide === "right" ? a.right + offset : a.left - offset - f.width;
      top =
        align === "start" ? a.top : align === "end" ? a.bottom - f.height : a.top + a.height / 2 - f.height / 2;
    }

    left = Math.max(8, Math.min(left, vw - f.width - 8));
    top = Math.max(8, Math.min(top, vh - f.height - 8));

    floating.style.top = `${Math.round(top)}px`;
    floating.style.left = `${Math.round(left)}px`;
  }, [side, align, offset]);

  useLayoutEffect(() => {
    if (!open) return;
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, update]);

  return { anchorRef, floatingRef, update };
}

/** True when the browser natively supports the Popover API. */
const POPOVER_SUPPORTED =
  typeof HTMLElement !== "undefined" && "showPopover" in HTMLElement.prototype;

/**
 * Show a [popover] element.
 * Uses the native Popover API where available; falls back to a data-attribute
 * toggle for iOS < 17 / older browsers (paired with the CSS in nova.css).
 */
export function showPopover(el: HTMLElement | null) {
  if (!el || !el.isConnected) return;
  if (POPOVER_SUPPORTED) {
    try { el.showPopover(); } catch { /* already open */ }
  } else {
    el.dataset.popoverOpen = "";
    el.style.zIndex = "9999";
  }
}

/**
 * Hide a [popover] element.
 */
export function hidePopover(el: HTMLElement | null) {
  if (!el || !el.isConnected) return;
  if (POPOVER_SUPPORTED) {
    try { el.hidePopover(); } catch { /* already hidden */ }
  } else {
    delete el.dataset.popoverOpen;
    el.style.zIndex = "";
  }
}
