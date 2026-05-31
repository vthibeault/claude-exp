'use client';

// Simple module-level pub/sub for the command palette — no external state library needed.
let listeners: Array<(open: boolean) => void> = [];
let _isOpen = false;

function notify(v: boolean) {
  _isOpen = v;
  listeners.forEach((l) => l(v));
}

export function useCommandSearch() {
  return {
    open: () => notify(true),
    close: () => notify(false),
  };
}

export function subscribeCommandSearch(fn: (open: boolean) => void) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export function getCommandSearchState() {
  return _isOpen;
}
