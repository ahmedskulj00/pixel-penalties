import { useEffect, useEffectEvent, useSyncExternalStore } from 'react';
import { useSettings } from '../state/stores.js';

/**
 * Global keyboard shortcuts. useEffectEvent keeps the listener stable while always
 * calling the latest handler, so shortcuts never see stale game state.
 * Space/Enter on a focused control are left to the browser to avoid double actions.
 */
export function useKeydown(handler, enabled = true) {
  const onKey = useEffectEvent(handler);
  useEffect(() => {
    if (!enabled) return undefined;
    const listener = (e) => {
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

const MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const subscribeMotion = (cb) => {
  const mq = window.matchMedia?.(MOTION_QUERY);
  mq?.addEventListener?.('change', cb);
  return () => mq?.removeEventListener?.('change', cb);
};
const systemReduced = () => Boolean(window.matchMedia?.(MOTION_QUERY).matches);

export function useReducedMotion() {
  const { motion } = useSettings();
  const system = useSyncExternalStore(subscribeMotion, systemReduced, () => false);
  return motion === 'reduced' || (motion === 'system' && system);
}

const SPEED = { relaxed: 1.35, normal: 1, turbo: 0.6 };

/** Animation timing multiplier plus the flags the choreography needs. */
export function useTiming() {
  const settings = useSettings();
  const reduced = useReducedMotion();
  return {
    speed: SPEED[settings.speed] ?? 1,
    reduced,
    calm: settings.calm,
  };
}
