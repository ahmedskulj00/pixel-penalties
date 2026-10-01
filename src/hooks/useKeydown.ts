import { useEffect, useEffectEvent } from 'react';

/**
 * Global keyboard shortcuts. useEffectEvent keeps the listener stable while always
 * calling the latest handler, so shortcuts never see stale game state.
 * Space/Enter on a focused control are left to the browser to avoid double actions.
 */
export function useKeydown(handler: (e: KeyboardEvent) => void, enabled = true): void {
  const onKey = useEffectEvent(handler);
  useEffect(() => {
    if (!enabled) return undefined;
    const listener = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t instanceof Element) {
        if (t.closest('input, textarea, select, [contenteditable="true"]')) return;
        if ((e.key === ' ' || e.key === 'Enter') && t.closest('button, a, [role="button"], summary')) return;
      }
      onKey(e);
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [enabled]);
}
