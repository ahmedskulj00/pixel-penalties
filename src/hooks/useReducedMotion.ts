import { useSyncExternalStore } from 'react';
import { useSettings } from '@/state';

const MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia?.(MOTION_QUERY);
  mq?.addEventListener?.('change', cb);
  return () => mq?.removeEventListener?.('change', cb);
};

const systemReduced = () => Boolean(window.matchMedia?.(MOTION_QUERY).matches);

/** True when the player (or, by default, the system) asks for reduced motion. */
export function useReducedMotion(): boolean {
  const { motion } = useSettings();
  const system = useSyncExternalStore(subscribeMotion, systemReduced, () => false);
  return motion === 'reduced' || (motion === 'system' && system);
}
