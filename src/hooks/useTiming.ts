import type { Speed } from '@/types';
import { useSettings } from '@/state';
import { useReducedMotion } from './useReducedMotion';

const SPEED: Record<Speed, number> = { relaxed: 1.35, normal: 1, turbo: 0.6 };

/** Animation timing multiplier plus the flags the choreography needs. */
export interface Timing {
  /** Multiplier for every animation duration. */
  speed: number;
  reduced: boolean;
  calm: boolean;
}

export function useTiming(): Timing {
  const settings = useSettings();
  const reduced = useReducedMotion();
  return {
    speed: SPEED[settings.speed] ?? 1,
    reduced,
    calm: settings.calm,
  };
}
