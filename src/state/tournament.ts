import type { Tournament } from '@/types';
import { validateTournament } from '@/engine/tournament';
import { createStore, useStore } from './createStore';

export const tournamentStore = createStore<Tournament | null>('pp.tournament.v1', null, validateTournament);

export const useTournament = (): Tournament | null => useStore(tournamentStore);
