import { cabinetStore } from './cabinet';
import { DEFAULT_STATS, statsStore } from './stats';
import { tournamentStore } from './tournament';

/** Forget the saved tournament, the trophies and the stats. */
export function resetProgress(): void {
  tournamentStore.set(null);
  cabinetStore.set([]);
  statsStore.set(DEFAULT_STATS);
}
